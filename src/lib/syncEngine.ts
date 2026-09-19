import { db } from './db';
import { Repository } from './repository';
import { ISyncAdapter, GoogleSheetSyncAdapter } from './syncAdapter';
import type { SyncStatus } from './types';

type Listener = (status: SyncStatus) => void;

export class SyncEngine {
  private adapter: ISyncAdapter;
  private listeners: Set<Listener> = new Set();
  private isSyncing = false;
  private currentError: string | null = null;

  constructor(adapter?: ISyncAdapter) {
    this.adapter = adapter || new GoogleSheetSyncAdapter();
    this.initListeners();
  }

  private initListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyStatus();
        this.triggerSync();
      });
      window.addEventListener('offline', () => {
        this.notifyStatus();
      });
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.notifyStatus();
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async getStatus(): Promise<SyncStatus> {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const outboxCount = await db.outbox.count();
    const lastSyncedMeta = await db.meta.get('lastSyncedAt');
    const shop = await db.shop.get('default');

    return {
      isOnline,
      isSyncing: this.isSyncing,
      pendingCount: outboxCount,
      lastSyncedAt: lastSyncedMeta?.value || shop?.lastSyncedAt,
      error: this.currentError
    };
  }

  private async notifyStatus() {
    const status = await this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  public async triggerSync(): Promise<void> {
    if (this.isSyncing) return;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      this.currentError = 'Offline mode (No internet connection)';
      await this.notifyStatus();
      return;
    }

    const shop = await db.shop.get('default');
    const sheetUrl = shop?.sheetUrl || import.meta.env.VITE_GOOGLE_SHEET_URL || '';
    const sheetToken = shop?.sheetToken || import.meta.env.VITE_GOOGLE_SHEET_TOKEN || '';

    if (!sheetUrl || !sheetToken) {
      // Pure local mode, no sheet configured
      this.currentError = null;
      await this.notifyStatus();
      return;
    }

    this.isSyncing = true;
    this.currentError = null;
    await this.notifyStatus();

    try {
      const outbox = await db.outbox.orderBy('id').toArray();
      const lastSrvMeta = await db.meta.get('lastSrvUpdatedAt');
      const lastSrvUpdatedAt = lastSrvMeta?.value || 0;

      const response = await this.adapter.sync(
        sheetUrl,
        sheetToken,
        lastSrvUpdatedAt,
        outbox
      );

      if (response.success) {
        // Clear processed outbox items
        if (response.processedOutboxIds && response.processedOutboxIds.length > 0) {
          await db.outbox.bulkDelete(response.processedOutboxIds);
        } else if (outbox.length > 0) {
          // If all processed
          const ids = outbox.map((item) => item.id!).filter(Boolean);
          await db.outbox.bulkDelete(ids);
        }

        // Apply incoming server changes with Last-Write-Wins rule
        if (response.serverChanges) {
          await this.applyServerChanges(response.serverChanges);
        }

        const now = Date.now();
        const newSrvUpdated = response.srvUpdatedAt || now;
        await db.meta.put({ key: 'lastSrvUpdatedAt', value: newSrvUpdated });
        await db.meta.put({ key: 'lastSyncedAt', value: now });
        await db.shop.update('default', { lastSyncedAt: now });

        this.currentError = null;
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      this.currentError = err?.message || 'Sync failed';
    } finally {
      this.isSyncing = false;
      await this.notifyStatus();
    }
  }

  private async applyServerChanges(serverChanges: any) {
    const { shop, products, customers, invoices, invoiceItems } = serverChanges;

    // 1. Products
    if (Array.isArray(products) && products.length > 0) {
      await db.transaction('rw', db.products, async () => {
        for (const remote of products) {
          const local = await db.products.get(remote.id);
          if (!local || (remote.updatedAt || 0) >= (local.updatedAt || 0)) {
            await db.products.put(remote);
          }
        }
      });
    }

    // 2. Customers
    if (Array.isArray(customers) && customers.length > 0) {
      await db.transaction('rw', db.customers, async () => {
        for (const remote of customers) {
          const local = await db.customers.get(remote.id);
          if (!local || (remote.updatedAt || 0) >= (local.updatedAt || 0)) {
            await db.customers.put(remote);
          }
        }
      });
    }

    // 3. Invoices
    if (Array.isArray(invoices) && invoices.length > 0) {
      await db.transaction('rw', db.invoices, async () => {
        for (const remote of invoices) {
          const local = await db.invoices.get(remote.id);
          if (!local || (remote.updatedAt || 0) >= (local.updatedAt || 0)) {
            await db.invoices.put(remote);
          }
        }
      });
    }

    // 4. Invoice Items
    if (Array.isArray(invoiceItems) && invoiceItems.length > 0) {
      await db.transaction('rw', db.invoiceItems, async () => {
        for (const remote of invoiceItems) {
          await db.invoiceItems.put(remote);
        }
      });
    }

    // 5. Shop settings
    if (Array.isArray(shop) && shop.length > 0) {
      const remoteShop = shop[0];
      if (remoteShop) {
        const local = await db.shop.get('default');
        if (!local || (remoteShop.updatedAt || 0) >= (local.updatedAt || 0)) {
          await db.shop.put({ ...local, ...remoteShop, id: 'default' });
        }
      }
    }
  }
}

export const syncEngine = new SyncEngine();
