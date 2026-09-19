import * as XLSX from 'xlsx';
import type { Invoice, InvoiceItem, ShopSettings } from './types';
import { formatNumberIN } from './money';

/**
 * Exports a single invoice to Excel (.xlsx) with proper headers, numeric formatting,
 * column widths, and UTF-8 Devanagari text support.
 * Filename format: Invoice_INV-0001_2026-09-19.xlsx
 */
export function exportSingleInvoiceToExcel(options: {
  shop: ShopSettings;
  invoice: Invoice;
  items: InvoiceItem[];
}) {
  const { shop, invoice, items } = options;

  const rows: any[][] = [];

  // Header Info
  rows.push([`M/S ${shop.shopName.toUpperCase()}`]);
  if (shop.proprietor) rows.push([`Proprietor: ${shop.proprietor}`]);
  if (shop.address) rows.push([`Address: ${shop.address}`]);
  rows.push([
    `GSTIN: ${shop.gstin || 'N/A'}`,
    `Phone: ${shop.phone || 'N/A'}`,
    `Email: ${shop.email || 'N/A'}`
  ]);
  rows.push([]); // blank line

  rows.push(['INVOICE']);
  rows.push([`Invoice No: ${invoice.invoiceNo}`, `Date: ${invoice.date}`]);
  rows.push([`Party Name: ${invoice.customerName}`]);
  rows.push([`Party Address: ${invoice.customerAddress || 'N/A'}`]);
  rows.push([`Party Phone: ${invoice.customerPhone || 'N/A'}`]);
  rows.push([]); // blank line

  // Table Headers
  const tableHeaderRowIndex = rows.length;
  rows.push(['Sr No', 'Description of Goods', 'Qty', 'Unit', 'Rate (₹)', 'Amount (₹)']);

  // Table Data
  items.forEach((item, idx) => {
    rows.push([
      idx + 1,
      item.description,
      Number(item.qty),
      item.unit,
      Number(item.rate),
      Number(item.amount)
    ]);
  });

  // Round Off Line if present
  if (shop.roundOffEnabled && invoice.roundOff !== 0) {
    rows.push(['', 'Round Off', '', '', '', Number(invoice.roundOff)]);
  }

  // Totals
  rows.push(['', 'Subtotal', '', '', '', Number(invoice.subtotal)]);
  rows.push(['', 'GRAND TOTAL (₹)', '', '', '', Number(invoice.total)]);
  rows.push([]);

  // Amount in Words & Terms
  rows.push([`Amount Chargeable (in words): ${invoice.amountInWords}`]);
  if (invoice.note) rows.push([`Note: ${invoice.note}`]);
  rows.push([`Declaration: ${shop.declaration}`]);
  rows.push([`Signature Label: ${shop.signatureLabel}`]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // Sr No
    { wch: 35 }, // Description
    { wch: 10 }, // Qty
    { wch: 10 }, // Unit
    { wch: 14 }, // Rate
    { wch: 16 }  // Amount
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invoice');

  const safeInvoiceNo = invoice.invoiceNo.replace(/[^a-zA-Z0-9-]/g, '_');
  const filename = `Invoice_${safeInvoiceNo}_${invoice.date}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Exports a list of invoices to Excel (.xlsx) with one row per invoice.
 * Filename format: Invoices_List_2026-09-19.xlsx
 */
export function exportInvoicesListToExcel(invoices: Invoice[]) {
  const rows: any[][] = [];

  // Header Row
  rows.push([
    'Invoice No',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Subtotal (₹)',
    'Round Off (₹)',
    'Total (₹)',
    'Status',
    'Amount in Words'
  ]);

  invoices.forEach((inv) => {
    rows.push([
      inv.invoiceNo,
      inv.date,
      inv.customerName,
      inv.customerPhone || '',
      Number(inv.subtotal),
      Number(inv.roundOff),
      Number(inv.total),
      inv.status.toUpperCase(),
      inv.amountInWords
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 16 }, // Invoice No
    { wch: 12 }, // Date
    { wch: 28 }, // Customer
    { wch: 15 }, // Phone
    { wch: 14 }, // Subtotal
    { wch: 12 }, // Round Off
    { wch: 16 }, // Total
    { wch: 12 }, // Status
    { wch: 45 }  // Amount in Words
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Bills List');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Invoices_List_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
