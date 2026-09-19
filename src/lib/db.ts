import Dexie, { Table } from 'dexie';
import type {
  ShopSettings,
  Product,
  Customer,
  Invoice,
  InvoiceItem,
  OutboxItem
} from './types';

export class DukaanBillDatabase extends Dexie {
  shop!: Table<ShopSettings, string>;
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  invoices!: Table<Invoice, string>;
  invoiceItems!: Table<InvoiceItem, string>;
  outbox!: Table<OutboxItem, number>;
  meta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('DukaanBillDB');

    this.version(1).stores({
      shop: 'id',
      products: 'id, name, updatedAt, srvUpdatedAt, deleted',
      customers: 'id, name, phone, updatedAt, srvUpdatedAt, deleted',
      invoices: 'id, invoiceNo, date, customerId, status, createdAt, updatedAt, srvUpdatedAt, deleted',
      invoiceItems: 'id, invoiceId, slNo, srvUpdatedAt',
      outbox: '++id, table, timestamp',
      meta: 'key'
    });
  }
}

export const db = new DukaanBillDatabase();
