export type UnitType =
  | 'kgs'
  | 'gm'
  | 'pcs'
  | 'litre'
  | 'ml'
  | 'dozen'
  | 'packet'
  | 'box'
  | 'metre'
  | string;

export interface ShopSettings {
  id: string; // always 'default'
  shopName: string;
  proprietor: string;
  address: string;
  phone: string;
  email: string;
  gstin: string; // Optional plain text header only
  declaration: string;
  signatureLabel: string;
  invoicePrefix: string;
  nextInvoiceNo: number;
  roundOffEnabled: boolean;
  language: 'hi' | 'en';
  sheetUrl: string;
  sheetToken: string;
  autoSync: boolean;
  lastSyncedAt?: number;
  devicePrefix?: string;
  updatedAt: number;
}

export interface Product {
  id: string;
  name: string;
  unit: UnitType;
  price: number; // In Rupees (e.g. 120.50)
  updatedAt: number;
  srvUpdatedAt?: number;
  deleted?: number; // 0 or 1
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  phone: string;
  updatedAt: number;
  srvUpdatedAt?: number;
  deleted?: number; // 0 or 1
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  slNo: number;
  description: string;
  qty: number; // Decimals allowed e.g. 17.60
  unit: string;
  rate: number; // Rate in Rupees
  amount: number; // Amount in Rupees = qty * rate
  srvUpdatedAt?: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string; // YYYY-MM-DD
  customerId?: string;
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  subtotal: number; // In Rupees
  roundOff: number; // In Rupees e.g. 0.30 or -0.20
  total: number; // In Rupees
  amountInWords: string;
  note?: string;
  status: 'active' | 'cancelled';
  createdAt: number;
  updatedAt: number;
  srvUpdatedAt?: number;
  deleted?: number; // 0 or 1
}

export interface OutboxItem {
  id?: number;
  table: 'shop' | 'products' | 'customers' | 'invoices' | 'invoiceItems';
  action: 'put' | 'remove';
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt?: number;
  error?: string | null;
}
