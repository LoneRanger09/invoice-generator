import React, { useState } from 'react';
import { Search, Plus, FileText, Eye, Edit, Copy, Ban, FileSpreadsheet } from 'lucide-react';
import type { Invoice } from '../lib/types';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';
import { Repository } from '../lib/repository';
import { formatINR } from '../lib/money';
import { exportInvoicesListToExcel } from '../lib/excelExport';

interface InvoicesListViewProps {
  invoices: Invoice[];
  onOpenPreview: (id: string) => void;
  onEdit: (id: string) => void;
  onNewBill: () => void;
  onRefresh: () => void;
  language: Language;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  invoices,
  onOpenPreview,
  onEdit,
  onNewBill,
  onRefresh,
  language
}) => {
  const t = translations[language];

  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const filteredInvoices = invoices.filter((inv) => {
    if (inv.deleted) return false;
    const matchSearch =
      inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase());
    const matchDate = !filterDate || inv.date === filterDate;
    return matchSearch && matchDate;
  });

  const handleCancelInvoice = async (id: string) => {
    if (confirm(t.confirmCancelInvoice)) {
      await Repository.cancelInvoice(id);
      onRefresh();
    }
  };

  const handleExportListExcel = () => {
    if (filteredInvoices.length === 0) {
      alert('No invoices to export');
      return;
    }
    exportInvoicesListToExcel(filteredInvoices);
  };

  const handleDuplicateInvoice = async (inv: Invoice) => {
    const res = await Repository.getInvoiceWithItems(inv.id);
    if (!res) return;

    const shopSettings = await Repository.getShopSettings();
    const prefix = shopSettings?.invoicePrefix || 'INV-';
    const nextNo = shopSettings?.nextInvoiceNo || 1;
    const newInvoiceNo = `${prefix}${nextNo}`;

    const newInvoice = await Repository.saveInvoice(
      {
        invoiceNo: newInvoiceNo,
        date: new Date().toISOString().split('T')[0],
        customerName: res.invoice.customerName,
        customerAddress: res.invoice.customerAddress,
        customerPhone: res.invoice.customerPhone,
        subtotal: res.invoice.subtotal,
        roundOff: res.invoice.roundOff,
        total: res.invoice.total,
        amountInWords: res.invoice.amountInWords,
        note: res.invoice.note,
        status: 'active'
      },
      res.items.map((i) => ({
        slNo: i.slNo,
        description: i.description,
        qty: i.qty,
        unit: i.unit,
        rate: i.rate,
        amount: i.amount
      }))
    );

    onRefresh();
    onOpenPreview(newInvoice.invoice.id);
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-3xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText size={22} className="text-blue-700" />
          <h2 className="text-lg font-bold text-gray-900">{t.invoicesList}</h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportListExcel}
            className="min-h-[44px] px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow transition"
          >
            <FileSpreadsheet size={15} />
            <span>Excel</span>
          </button>

          <button
            onClick={onNewBill}
            className="min-h-[44px] px-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow transition"
          >
            <Plus size={16} />
            <span>{t.navNewBill}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-2 relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t.searchInvoices}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-sm"
          />
        </div>

        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* List */}
      {filteredInvoices.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200 shadow-sm space-y-3">
          <p className="text-sm font-medium">{t.noInvoices}</p>
          <button
            onClick={onNewBill}
            className="px-4 py-2 bg-blue-100 text-blue-900 text-xs font-bold rounded-xl hover:bg-blue-200 transition"
          >
            {t.navNewBill}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className={`bg-white rounded-2xl p-4 border shadow-sm transition space-y-3 ${
                inv.status === 'cancelled' ? 'border-red-200 bg-red-50/20' : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-base text-red-700">{inv.invoiceNo}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {inv.status === 'cancelled' ? t.statusCancelled : t.statusActive}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mt-1 uppercase">{inv.customerName}</h3>
                  <p className="text-xs text-gray-500 font-mono">Date: {inv.date}</p>
                </div>

                <div className="text-right">
                  <span className="text-lg font-bold text-blue-900 font-mono block">
                    {formatINR(inv.total)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => onOpenPreview(inv.id)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 text-xs font-bold rounded-xl flex items-center space-x-1 transition"
                >
                  <Eye size={14} />
                  <span>View</span>
                </button>

                {inv.status !== 'cancelled' && (
                  <>
                    <button
                      onClick={() => onEdit(inv.id)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-800 hover:bg-gray-200 text-xs font-bold rounded-xl flex items-center space-x-1 transition"
                    >
                      <Edit size={14} />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDuplicateInvoice(inv)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-800 hover:bg-gray-200 text-xs font-bold rounded-xl flex items-center space-x-1 transition"
                      title="Duplicate"
                    >
                      <Copy size={14} />
                      <span>Duplicate</span>
                    </button>

                    <button
                      onClick={() => handleCancelInvoice(inv.id)}
                      className="px-2.5 py-1.5 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl flex items-center space-x-1 transition"
                      title="Cancel invoice"
                    >
                      <Ban size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
