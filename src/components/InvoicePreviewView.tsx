import React, { useRef, useState, useEffect } from 'react';
import { Download, Share2, Edit, PlusCircle, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import type { Invoice, InvoiceItem, ShopSettings } from '../lib/types';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';
import { Repository } from '../lib/repository';
import { formatNumberIN, formatINR } from '../lib/money';
import { generateInvoicePDF, downloadPdfBlob } from '../lib/pdfGenerator';
import { sendInvoiceViaWhatsApp } from '../lib/whatsapp';
import { exportSingleInvoiceToExcel } from '../lib/excelExport';

interface InvoicePreviewViewProps {
  invoiceId: string;
  onEdit: (invoiceId: string) => void;
  onNewBill: () => void;
  onBack: () => void;
  language: Language;
}

export const InvoicePreviewView: React.FC<InvoicePreviewViewProps> = ({
  invoiceId,
  onEdit,
  onNewBill,
  onBack,
  language
}) => {
  const t = translations[language];

  const [shop, setShop] = useState<ShopSettings | undefined>();
  const [invoice, setInvoice] = useState<Invoice | undefined>();
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Hidden off-screen A4 container for exact html2canvas PDF rendering
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const s = await Repository.getShopSettings();
      const res = await Repository.getInvoiceWithItems(invoiceId);
      setShop(s);
      if (res) {
        setInvoice(res.invoice);
        setItems(res.items);
      }
      setLoading(false);
    }
    load();
  }, [invoiceId]);

  if (loading || !invoice || !shop) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        Loading invoice preview...
      </div>
    );
  }

  const pdfFilename = `Invoice-${invoice.invoiceNo}-${invoice.customerName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    setPdfGenerating(true);
    try {
      const blob = await generateInvoicePDF(pdfRef.current, pdfFilename);
      downloadPdfBlob(blob, pdfFilename);
    } catch (err: any) {
      alert(`PDF export failed: ${err?.message || err}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!pdfRef.current) return;
    setPdfGenerating(true);
    try {
      const blob = await generateInvoicePDF(pdfRef.current, pdfFilename);
      await sendInvoiceViaWhatsApp({
        pdfBlob: blob,
        filename: pdfFilename,
        invoiceNo: invoice.invoiceNo,
        shopName: shop.shopName,
        totalFormatted: `₹${formatNumberIN(invoice.total)}`,
        partyPhone: invoice.customerPhone,
        onFallbackHint: (msg) => setHintMessage(msg)
      });
    } catch (err: any) {
      alert(`WhatsApp share failed: ${err?.message || err}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleExportExcel = () => {
    exportSingleInvoiceToExcel({ shop, invoice, items });
  };

  return (
    <div className="pb-28 pt-2 px-2 sm:px-4 max-w-4xl mx-auto space-y-4">
      {/* Action Toolbar */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center space-x-1 transition"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="min-h-[44px] px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow transition"
          >
            <Download size={15} />
            <span>{pdfGenerating ? 'Generating...' : t.downloadPdf}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="min-h-[44px] px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow transition"
          >
            <FileSpreadsheet size={15} />
            <span>Excel</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            disabled={pdfGenerating}
            className="min-h-[44px] px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow transition"
          >
            <Share2 size={15} />
            <span>{t.sendWhatsapp}</span>
          </button>

          <button
            onClick={() => onEdit(invoice.id)}
            className="min-h-[44px] px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center space-x-1 transition"
          >
            <Edit size={14} />
            <span>{t.editBill}</span>
          </button>

          <button
            onClick={onNewBill}
            className="min-h-[44px] px-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-xl flex items-center space-x-1 transition"
          >
            <PlusCircle size={14} />
            <span>{t.newBill}</span>
          </button>
        </div>
      </div>

      {hintMessage && (
        <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-xs font-medium">
          {hintMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 1: MOBILE & DESKTOP RESPONSIVE SCREEN VIEW (100% Fluid, Zero Overflow) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200 space-y-4 max-w-full overflow-hidden">
        {/* Top Info Bar */}
        <div className="flex flex-wrap justify-between items-center border-b pb-2 text-xs sm:text-sm font-mono font-bold text-gray-800 gap-1">
          <span className="text-red-700">Invoice No. {invoice.invoiceNo}</span>
          <span className="text-gray-600">Dated {invoice.date}</span>
        </div>

        {/* Shop Name & Header Details */}
        <div className="text-center space-y-1">
          <h1
            className="font-extrabold uppercase tracking-wide text-gray-900 leading-snug break-words"
            style={{ fontSize: 'clamp(1.125rem, 4vw, 1.75rem)' }}
          >
            M/s {shop.shopName}
          </h1>
          {shop.proprietor && (
            <p className="text-xs sm:text-sm font-bold italic text-gray-700 break-words">
              Proprietor: {shop.proprietor}
            </p>
          )}
          {shop.address && (
            <p className="text-xs text-gray-600 leading-normal break-words max-w-lg mx-auto">
              {shop.address}
            </p>
          )}
          {/* Stacked responsive details on mobile */}
          <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs text-gray-700 pt-1">
            {shop.gstin && (
              <span className="font-bold break-all">GSTIN: {shop.gstin}</span>
            )}
            {shop.phone && <span className="break-all">Ph: {shop.phone}</span>}
            {shop.email && <span className="break-all">Email: {shop.email}</span>}
          </div>
        </div>

        {/* Section Title Banner */}
        <div className="text-center py-1.5 bg-gray-100 border-y border-gray-300 font-bold tracking-widest text-xs sm:text-sm text-gray-800">
          INVOICE
        </div>

        {/* Customer / Party Details */}
        <div className="border-b pb-3 text-xs sm:text-sm text-gray-900 leading-relaxed space-y-0.5">
          <p className="font-bold">
            Party : <span className="uppercase text-blue-900 font-extrabold">{invoice.customerName}</span>
          </p>
          {invoice.customerAddress && (
            <p className="text-gray-700 break-words">Address: {invoice.customerAddress}</p>
          )}
          {invoice.customerPhone && (
            <p className="text-gray-700 font-mono">Phone: {invoice.customerPhone}</p>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Mobile View (< 640px): Stacked Cards Layout */}
        {/* ------------------------------------------------------------- */}
        <div className="block sm:hidden space-y-2.5">
          {items.map((item, idx) => (
            <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between items-start font-bold">
                <span className="text-gray-900 break-words flex-1 pr-2">
                  <span className="text-blue-700 mr-1.5 font-mono">#{idx + 1}</span>
                  {item.description}
                </span>
                <span className="font-mono text-sm text-gray-900 shrink-0">
                  {formatINR(item.amount)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 text-[11px] font-mono border-t border-gray-200/60 pt-1">
                <span>
                  {formatNumberIN(item.qty)} {item.unit} × ₹{formatNumberIN(item.rate)}
                </span>
                <span>per {item.unit}</span>
              </div>
            </div>
          ))}

          {/* Round Off Line if present */}
          {shop.roundOffEnabled && invoice.roundOff !== 0 && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex justify-between items-center text-xs italic">
              <span className="font-semibold text-amber-900">Round Off</span>
              <span className="font-mono font-bold text-amber-900">
                {invoice.roundOff >= 0 ? `+${formatNumberIN(invoice.roundOff)}` : formatNumberIN(invoice.roundOff)}
              </span>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Desktop View (>= 640px): Table Layout */}
        {/* ------------------------------------------------------------- */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-left text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300 font-bold text-center text-gray-800">
                <th className="border-r border-gray-300 p-2 w-12">Sl No</th>
                <th className="border-r border-gray-300 p-2 text-left">Description of Goods</th>
                <th className="border-r border-gray-300 p-2 w-28">Quantity</th>
                <th className="border-r border-gray-300 p-2 w-24 text-right">Rate</th>
                <th className="border-r border-gray-300 p-2 w-20 text-center">per</th>
                <th className="p-2 w-28 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="border-r border-gray-300 p-2 text-center font-mono font-semibold">{idx + 1}</td>
                  <td className="border-r border-gray-300 p-2 font-medium">{item.description}</td>
                  <td className="border-r border-gray-300 p-2 text-center font-mono">{formatNumberIN(item.qty)} {item.unit}</td>
                  <td className="border-r border-gray-300 p-2 text-right font-mono">{formatNumberIN(item.rate)}</td>
                  <td className="border-r border-gray-300 p-2 text-center text-gray-600">{item.unit}</td>
                  <td className="p-2 text-right font-mono font-bold">{formatNumberIN(item.amount)}</td>
                </tr>
              ))}
              {shop.roundOffEnabled && invoice.roundOff !== 0 && (
                <tr className="italic bg-gray-50 border-t border-gray-300">
                  <td className="border-r border-gray-300 p-2 text-center"></td>
                  <td className="border-r border-gray-300 p-2 font-semibold">Round Off</td>
                  <td className="border-r border-gray-300 p-2"></td>
                  <td className="border-r border-gray-300 p-2"></td>
                  <td className="border-r border-gray-300 p-2"></td>
                  <td className="p-2 text-right font-mono font-bold">
                    {invoice.roundOff >= 0 ? `+${formatNumberIN(invoice.roundOff)}` : formatNumberIN(invoice.roundOff)}
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-400 bg-gray-100 font-bold text-sm">
                <td colSpan={2} className="border-r border-gray-300 p-2 font-mono text-left">E. & O.E</td>
                <td colSpan={3} className="border-r border-gray-300 p-2 text-right">Total</td>
                <td className="p-2 text-right font-mono text-base font-extrabold text-blue-900">
                  ₹{formatNumberIN(invoice.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary & Totals Block for Mobile View */}
        <div className="sm:hidden bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2">
          <div className="flex justify-between text-xs text-gray-600 font-mono">
            <span>Sub-total:</span>
            <span>{formatINR(invoice.subtotal)}</span>
          </div>
          {shop.roundOffEnabled && invoice.roundOff !== 0 && (
            <div className="flex justify-between text-xs text-gray-600 font-mono">
              <span>Round Off:</span>
              <span>{invoice.roundOff >= 0 ? `+${formatINR(invoice.roundOff)}` : formatINR(invoice.roundOff)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-blue-900 font-mono border-t pt-2">
            <span>GRAND TOTAL:</span>
            <span>{formatINR(invoice.total)}</span>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold leading-relaxed break-words">
          Amount Chargeable (in words): <span className="font-serif italic text-blue-950">{invoice.amountInWords}</span>
        </div>

        {invoice.note && (
          <div className="text-xs text-gray-600 italic break-words">
            Note: {invoice.note}
          </div>
        )}

        {/* Footer Declaration */}
        <div className="pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end text-xs">
          <div className="space-y-1">
            <span className="font-bold underline text-gray-900">Declaration:</span>
            <p className="text-gray-700 italic leading-relaxed break-words">{shop.declaration}</p>
          </div>
          <div className="text-right font-bold space-y-6 pt-2 sm:pt-0">
            <p>for M/s {shop.shopName}</p>
            <p className="pt-6 inline-block font-sans text-xs border-t border-dashed border-gray-400">
              {shop.signatureLabel}
            </p>
          </div>
          <div className="sm:col-span-2 text-center text-[11px] text-gray-500 pt-2 border-t border-gray-200">
            This is a Computer Generated Invoice
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PART 2: HIDDEN OFF-SCREEN A4 PRINT TEMPLATE FOR PERFECT PDF GENERATION */}
      {/* ========================================================================= */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}>
        <div
          ref={pdfRef}
          className="p-8 font-serif text-xs"
          style={{
            width: '210mm',
            minHeight: '297mm',
            color: '#000000',
            backgroundColor: '#ffffff',
            border: '1px solid #000000',
            boxSizing: 'border-box'
          }}
        >
          <div>
            <div className="flex justify-between items-center pb-2 mb-3 font-mono text-[13px] font-bold" style={{ borderBottom: '1px solid #000000', lineHeight: '1.4' }}>
              <span>Invoice No. {invoice.invoiceNo}</span>
              <span>Dated {invoice.date}</span>
            </div>

            <div className="text-center mb-4 space-y-1" style={{ lineHeight: '1.4' }}>
              <h1 className="text-2xl font-extrabold tracking-wide uppercase" style={{ color: '#000000', margin: '0 0 2px 0' }}>
                M/s {shop.shopName}
              </h1>
              {shop.proprietor && (
                <p className="text-[12px] font-bold italic" style={{ color: '#000000', margin: '0 0 2px 0' }}>
                  Proprietor: {shop.proprietor}
                </p>
              )}
              {shop.address && <p className="text-[11px] leading-relaxed" style={{ color: '#000000', margin: '0' }}>{shop.address}</p>}
              <div className="flex justify-center space-x-3 text-[11px] font-sans pt-1" style={{ color: '#000000' }}>
                {shop.gstin && <span className="font-bold">GSTIN: {shop.gstin}</span>}
                {shop.phone && <span>Ph: {shop.phone}</span>}
                {shop.email && <span>Email: {shop.email}</span>}
              </div>
            </div>

            <div
              className="text-center my-3 font-bold tracking-widest text-sm"
              style={{
                backgroundColor: '#f3f4f6',
                color: '#000000',
                borderTop: '1px solid #000000',
                borderBottom: '1px solid #000000',
                padding: '8px 0',
                lineHeight: '1.5'
              }}
            >
              INVOICE
            </div>

            <div className="mb-4 pb-3 text-[12px] leading-relaxed" style={{ borderBottom: '1px solid #000000', color: '#000000' }}>
              <p className="font-bold">
                Party : <span className="uppercase text-sm">{invoice.customerName}</span>
              </p>
              {invoice.customerAddress && <p>Address: {invoice.customerAddress}</p>}
              {invoice.customerPhone && <p>Phone: {invoice.customerPhone}</p>}
            </div>

            <table className="w-full border-collapse text-left text-[11px]" style={{ border: '1px solid #000000' }}>
              <thead>
                <tr className="font-bold text-center" style={{ backgroundColor: '#f3f4f6', color: '#000000', borderBottom: '1px solid #000000', lineHeight: '1.4' }}>
                  <th className="p-2 w-10" style={{ borderRight: '1px solid #000000' }}>Sl No</th>
                  <th className="p-2 text-left" style={{ borderRight: '1px solid #000000' }}>Description of Goods</th>
                  <th className="p-2 w-24" style={{ borderRight: '1px solid #000000' }}>Quantity</th>
                  <th className="p-2 w-20 text-right" style={{ borderRight: '1px solid #000000' }}>Rate</th>
                  <th className="p-2 w-16 text-center" style={{ borderRight: '1px solid #000000' }}>per</th>
                  <th className="p-2 w-24 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="font-sans">
                {items.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb', color: '#000000', lineHeight: '1.4' }}>
                    <td className="p-2 text-center font-mono font-semibold" style={{ borderRight: '1px solid #000000' }}>{idx + 1}</td>
                    <td className="p-2 font-medium" style={{ borderRight: '1px solid #000000' }}>{item.description}</td>
                    <td className="p-2 text-center font-mono font-semibold" style={{ borderRight: '1px solid #000000' }}>{formatNumberIN(item.qty)} {item.unit}</td>
                    <td className="p-2 text-right font-mono" style={{ borderRight: '1px solid #000000' }}>{formatNumberIN(item.rate)}</td>
                    <td className="p-2 text-center" style={{ borderRight: '1px solid #000000', color: '#374151' }}>{item.unit}</td>
                    <td className="p-2 text-right font-mono font-bold">{formatNumberIN(item.amount)}</td>
                  </tr>
                ))}
                {shop.roundOffEnabled && invoice.roundOff !== 0 && (
                  <tr className="italic" style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #000000', color: '#000000', lineHeight: '1.4' }}>
                    <td className="p-2 text-center" style={{ borderRight: '1px solid #000000' }}></td>
                    <td className="p-2 font-semibold" style={{ borderRight: '1px solid #000000' }}>Round Off</td>
                    <td className="p-2" style={{ borderRight: '1px solid #000000' }}></td>
                    <td className="p-2" style={{ borderRight: '1px solid #000000' }}></td>
                    <td className="p-2" style={{ borderRight: '1px solid #000000' }}></td>
                    <td className="p-2 text-right font-mono font-bold">
                      {invoice.roundOff >= 0 ? `+${formatNumberIN(invoice.roundOff)}` : formatNumberIN(invoice.roundOff)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="font-bold text-sm" style={{ backgroundColor: '#f3f4f6', color: '#000000', borderTop: '2px solid #000000', lineHeight: '1.4' }}>
                  <td colSpan={2} className="p-2 font-mono text-left" style={{ borderRight: '1px solid #000000' }}>E. & O.E</td>
                  <td colSpan={3} className="p-2 text-right" style={{ borderRight: '1px solid #000000' }}>Total</td>
                  <td className="p-2 text-right font-mono text-base font-extrabold">₹{formatNumberIN(invoice.total)}</td>
                </tr>
              </tfoot>
            </table>

            <div className="mt-4 p-2.5 font-bold text-[11px] leading-relaxed" style={{ backgroundColor: '#f9fafb', color: '#000000', border: '1px solid #000000' }}>
              Amount Chargeable (in words): <span className="font-serif italic">{invoice.amountInWords}</span>
            </div>

            {invoice.note && (
              <div className="mt-2 text-[10px] italic" style={{ color: '#4b5563' }}>
                Note: {invoice.note}
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 grid grid-cols-2 gap-4 items-end" style={{ borderTop: '1px solid #000000', color: '#000000' }}>
            <div className="text-[10px] leading-tight space-y-1">
              <span className="font-bold underline block text-[11px]">Declaration:</span>
              <p className="italic" style={{ color: '#1f2937' }}>{shop.declaration}</p>
            </div>
            <div className="text-right text-[11px] font-bold space-y-8">
              <p>for M/s {shop.shopName}</p>
              <p className="pt-8 inline-block font-sans text-xs" style={{ borderTop: '1px dashed #9ca3af' }}>
                {shop.signatureLabel}
              </p>
            </div>
            <div className="col-span-2 text-center text-[10px] font-sans pt-2" style={{ color: '#6b7280', borderTop: '1px solid #e5e7eb' }}>
              This is a Computer Generated Invoice
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
