import { db } from './db';
import type {
  ShopSettings,
  Product,
  Customer,
  Invoice,
  InvoiceItem,
  OutboxItem
} from './types';

// Helper to generate UUID v4
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate device prefix if not set
export function getDevicePrefix(): string {
  let code = localStorage.getItem('dukaan_device_prefix');
  if (!code) {
    const randomHex = Math.floor(100 + Math.random() * 900).toString();
    code = `D${randomHex}`;
    localStorage.setItem('dukaan_device_prefix', code);
  }
  return code;
}

export const Repository = {
  // Shop Settings
  async getShopSettings(): Promise<ShopSettings | undefined> {
    return await db.shop.get('default');
  },

  async saveShopSettings(settings: Partial<ShopSettings>): Promise<ShopSettings> {
    const existing = await db.shop.get('default');
    const devicePrefix = settings.devicePrefix || existing?.devicePrefix || getDevicePrefix();
    const now = Date.now();

    const updated: ShopSettings = {
      id: 'default',
      shopName: settings.shopName ?? existing?.shopName ?? '',
      proprietor: settings.proprietor ?? existing?.proprietor ?? '',
      address: settings.address ?? existing?.address ?? '',
      phone: settings.phone ?? existing?.phone ?? '',
      email: settings.email ?? existing?.email ?? '',
      gstin: settings.gstin ?? existing?.gstin ?? '',
      declaration:
        settings.declaration ??
        existing?.declaration ??
        'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      signatureLabel: settings.signatureLabel ?? existing?.signatureLabel ?? 'Authorised Signatory',
      invoicePrefix: settings.invoicePrefix ?? existing?.invoicePrefix ?? `INV-${devicePrefix}-`,
      nextInvoiceNo: settings.nextInvoiceNo ?? existing?.nextInvoiceNo ?? 1,
      roundOffEnabled: settings.roundOffEnabled ?? existing?.roundOffEnabled ?? true,
      language: settings.language ?? existing?.language ?? 'en',
      sheetUrl: settings.sheetUrl ?? existing?.sheetUrl ?? '',
      sheetToken: settings.sheetToken ?? existing?.sheetToken ?? '',
      autoSync: settings.autoSync ?? existing?.autoSync ?? true,
      lastSyncedAt: settings.lastSyncedAt ?? existing?.lastSyncedAt,
      devicePrefix,
      updatedAt: now
    };

    await db.transaction('rw', [db.shop, db.outbox], async () => {
      await db.shop.put(updated);
      await db.outbox.add({
        table: 'shop',
        action: 'put',
        data: updated,
        timestamp: now,
        retryCount: 0
      });
    });

    return updated;
  },

  // Products
  async listProducts(includeDeleted = false): Promise<Product[]> {
    const all = await db.products.toArray();
    return includeDeleted ? all : all.filter((p) => !p.deleted);
  },

  async getProduct(id: string): Promise<Product | undefined> {
    return await db.products.get(id);
  },

  async saveProduct(productData: Partial<Product> & { name: string }): Promise<Product> {
    const now = Date.now();
    const id = productData.id || generateUUID();

    const product: Product = {
      id,
      name: productData.name,
      unit: productData.unit || 'pcs',
      price: productData.price || 0,
      updatedAt: now,
      srvUpdatedAt: productData.srvUpdatedAt,
      deleted: productData.deleted || 0
    };

    await db.transaction('rw', [db.products, db.outbox], async () => {
      await db.products.put(product);
      await db.outbox.add({
        table: 'products',
        action: 'put',
        data: product,
        timestamp: now,
        retryCount: 0
      });
    });

    return product;
  },

  async deleteProduct(id: string): Promise<void> {
    const product = await db.products.get(id);
    if (!product) return;
    const now = Date.now();
    const updated: Product = {
      ...product,
      deleted: 1,
      updatedAt: now
    };

    await db.transaction('rw', [db.products, db.outbox], async () => {
      await db.products.put(updated);
      await db.outbox.add({
        table: 'products',
        action: 'remove',
        data: updated,
        timestamp: now,
        retryCount: 0
      });
    });
  },

  // Customers
  async listCustomers(includeDeleted = false): Promise<Customer[]> {
    const all = await db.customers.toArray();
    return includeDeleted ? all : all.filter((c) => !c.deleted);
  },

  async saveCustomer(customerData: Partial<Customer> & { name: string }): Promise<Customer> {
    const now = Date.now();
    const id = customerData.id || generateUUID();

    const customer: Customer = {
      id,
      name: customerData.name,
      address: customerData.address || '',
      phone: customerData.phone || '',
      updatedAt: now,
      srvUpdatedAt: customerData.srvUpdatedAt,
      deleted: customerData.deleted || 0
    };

    await db.transaction('rw', [db.customers, db.outbox], async () => {
      await db.customers.put(customer);
      await db.outbox.add({
        table: 'customers',
        action: 'put',
        data: customer,
        timestamp: now,
        retryCount: 0
      });
    });

    return customer;
  },

  // Invoices & InvoiceItems
  async listInvoices(includeDeleted = false): Promise<Invoice[]> {
    const all = await db.invoices.toArray();
    const filtered = includeDeleted ? all : all.filter((i) => !i.deleted);
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  },

  async getInvoiceWithItems(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined> {
    const invoice = await db.invoices.get(id);
    if (!invoice) return undefined;
    const items = await db.invoiceItems.where('invoiceId').equals(id).sortBy('slNo');
    return { invoice, items };
  },

  async saveInvoice(
    invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number },
    itemsData: Array<Omit<InvoiceItem, 'id' | 'invoiceId' | 'srvUpdatedAt'>>
  ): Promise<{ invoice: Invoice; items: InvoiceItem[] }> {
    const now = Date.now();
    const id = invoiceData.id || generateUUID();
    const createdAt = invoiceData.createdAt || now;

    const invoice: Invoice = {
      ...invoiceData,
      id,
      createdAt,
      updatedAt: now,
      deleted: invoiceData.deleted || 0
    };

    const items: InvoiceItem[] = itemsData.map((item, idx) => ({
      ...item,
      id: generateUUID(),
      invoiceId: id,
      slNo: idx + 1
    }));

    await db.transaction('rw', [db.invoices, db.invoiceItems, db.shop, db.outbox], async () => {
      // Delete existing items for this invoice
      await db.invoiceItems.where('invoiceId').equals(id).delete();

      // Save new invoice & items
      await db.invoices.put(invoice);
      await db.invoiceItems.bulkPut(items);

      // Increment next invoice number if this was a new invoice creation
      if (!invoiceData.id) {
        const shop = await db.shop.get('default');
        if (shop) {
          const nextNo = (shop.nextInvoiceNo || 1) + 1;
          await db.shop.put({ ...shop, nextInvoiceNo: nextNo, updatedAt: now });
        }
      }

      // Add to outbox as a combined invoice bundle
      await db.outbox.add({
        table: 'invoices',
        action: 'put',
        data: { invoice, items },
        timestamp: now,
        retryCount: 0
      });
    });

    return { invoice, items };
  },

  async cancelInvoice(id: string): Promise<void> {
    const invoice = await db.invoices.get(id);
    if (!invoice) return;
    const now = Date.now();
    const updated: Invoice = {
      ...invoice,
      status: 'cancelled',
      updatedAt: now
    };

    const items = await db.invoiceItems.where('invoiceId').equals(id).toArray();

    await db.transaction('rw', [db.invoices, db.outbox], async () => {
      await db.invoices.put(updated);
      await db.outbox.add({
        table: 'invoices',
        action: 'put',
        data: { invoice: updated, items },
        timestamp: now,
        retryCount: 0
      });
    });
  },

  // Outbox operations
  async getOutboxQueue(): Promise<OutboxItem[]> {
    return await db.outbox.orderBy('id').toArray();
  },

  async clearOutboxItem(id: number): Promise<void> {
    await db.outbox.delete(id);
  }
};
