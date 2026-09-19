import type { OutboxItem } from './types';

export interface SyncPayload {
  token: string;
  action: 'test' | 'sync' | 'list' | 'put' | 'remove';
  lastSrvUpdatedAt?: number;
  outbox?: OutboxItem[];
}

export interface SyncResponse {
  success: boolean;
  message?: string;
  srvUpdatedAt?: number;
  serverChanges?: {
    shop?: any[];
    products?: any[];
    customers?: any[];
    invoices?: any[];
    invoiceItems?: any[];
  };
  processedOutboxIds?: number[];
  error?: string;
}

export interface ISyncAdapter {
  testConnection(sheetUrl: string, token: string): Promise<{ success: boolean; message: string }>;
  sync(sheetUrl: string, token: string, lastSrvUpdatedAt: number, outboxItems: OutboxItem[]): Promise<SyncResponse>;
}

export class GoogleSheetSyncAdapter implements ISyncAdapter {
  async testConnection(sheetUrl: string, token: string): Promise<{ success: boolean; message: string }> {
    if (!sheetUrl || !sheetUrl.startsWith('http')) {
      return { success: false, message: 'Invalid Web App URL' };
    }

    try {
      const response = await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token, action: 'test' })
      });

      if (!response.ok) {
        return { success: false, message: `HTTP Error: ${response.status}` };
      }

      const res: SyncResponse = await response.json();
      if (res.success) {
        return { success: true, message: res.message || 'Connection successful!' };
      } else {
        return { success: false, message: res.error || 'Invalid token or script error' };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network request failed' };
    }
  }

  async sync(
    sheetUrl: string,
    token: string,
    lastSrvUpdatedAt: number,
    outboxItems: OutboxItem[]
  ): Promise<SyncResponse> {
    if (!sheetUrl || !token) {
      return { success: false, error: 'Web App URL or Token missing' };
    }

    const payload: SyncPayload = {
      token,
      action: 'sync',
      lastSrvUpdatedAt,
      outbox: outboxItems
    };

    const response = await fetch(sheetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Sync HTTP Error: ${response.status}`);
    }

    const result: SyncResponse = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Server returned error during sync');
    }

    return result;
  }
}
