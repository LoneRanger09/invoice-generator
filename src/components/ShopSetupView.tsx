import React, { useState } from 'react';
import { Store, Download, AlertCircle } from 'lucide-react';
import * as utilsXLSX from 'xlsx';
import type { ShopSettings } from '../lib/types';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';
import { Repository } from '../lib/repository';
import { seedDemoData } from '../lib/demoData';

interface ShopSetupViewProps {
  settings: ShopSettings | undefined;
  onSave: (updated: ShopSettings) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onTriggerSync?: () => void;
  isFirstRunBlocked?: boolean;
}

export const ShopSetupView: React.FC<ShopSetupViewProps> = ({
  settings,
  onSave,
  language,
  isFirstRunBlocked
}) => {
  const t = translations[language];

  const [formData, setFormData] = useState<Partial<ShopSettings>>({
    shopName: settings?.shopName || '',
    proprietor: settings?.proprietor || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
    email: settings?.email || '',
    gstin: settings?.gstin || '',
    declaration:
      settings?.declaration ||
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
    signatureLabel: settings?.signatureLabel || 'Authorised Signatory',
    invoicePrefix: settings?.invoicePrefix || 'INV-',
    nextInvoiceNo: settings?.nextInvoiceNo || 1,
    roundOffEnabled: settings?.roundOffEnabled ?? true,
    language: settings?.language || language
  });

  const [saving, setSaving] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shopName || !formData.shopName.trim()) {
      setErrorMsg(t.shopNameRequired);
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      const saved = await Repository.saveShopSettings(formData);
      onSave(saved);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save shop settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackupXLSX = async () => {
    try {
      const products = await Repository.listProducts(true);
      const invoices = await Repository.listInvoices(true);
      const shop = await Repository.getShopSettings();

      const wb = utilsXLSX.utils.book_new();

      if (shop) {
        const shopWS = utilsXLSX.utils.json_to_sheet([shop]);
        utilsXLSX.utils.book_append_sheet(wb, shopWS, 'Shop');
      }

      if (products.length > 0) {
        const prodWS = utilsXLSX.utils.json_to_sheet(products);
        utilsXLSX.utils.book_append_sheet(wb, prodWS, 'Products');
      }

      if (invoices.length > 0) {
        const invWS = utilsXLSX.utils.json_to_sheet(invoices);
        utilsXLSX.utils.book_append_sheet(wb, invWS, 'Invoices');
      }

      const filename = `DukaanBill_Backup_${new Date().toISOString().split('T')[0]}.xlsx`;
      utilsXLSX.writeFile(wb, filename);
    } catch (err: any) {
      alert(`Export failed: ${err?.message || err}`);
    }
  };

  const handleLoadDemoData = async () => {
    if (confirm('Load sample shop & 15 products? This will update your shop info and catalog.')) {
      setDemoLoading(true);
      try {
        await seedDemoData();
        const updated = await Repository.getShopSettings();
        if (updated) {
          setFormData(updated);
          onSave(updated);
        }
      } catch (err: any) {
        alert(`Demo seed failed: ${err?.message}`);
      } finally {
        setDemoLoading(false);
      }
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-3xl mx-auto space-y-6">
      {/* Onboarding Notice for First Run */}
      {isFirstRunBlocked && (
        <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 flex items-start space-x-3 text-red-800 shadow-md animate-bounce">
          <AlertCircle size={24} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-base">{t.firstRunNotice}</h2>
            <p className="text-xs text-red-700 mt-0.5">{t.shopNameRequired}</p>
          </div>
        </div>
      )}

      {/* Main Shop Details Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 space-y-5">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <Store className="text-blue-700" size={22} />
            <h2 className="text-lg font-bold text-gray-900">{t.shopDetails}</h2>
          </div>
          <button
            type="button"
            onClick={handleLoadDemoData}
            disabled={demoLoading}
            className="text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg transition"
          >
            {demoLoading ? 'Loading...' : t.enableDemoData}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t.shopName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. M/s Gupta Trading Company"
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.proprietor}</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Gupta"
              value={formData.proprietor}
              onChange={(e) => setFormData({ ...formData, proprietor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.gstin}</label>
            <input
              type="text"
              placeholder="e.g. 09ABCDE1234F1Z5"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.address}</label>
            <textarea
              rows={2}
              placeholder="e.g. Shop No. 12, Main Market, Kanpur - 208001"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.phone}</label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="e.g. +91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.email}</label>
            <input
              type="email"
              placeholder="e.g. dukaan@gmail.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.invoicePrefix}</label>
            <input
              type="text"
              placeholder="e.g. INV-"
              value={formData.invoicePrefix}
              onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.nextInvoiceNo}</label>
            <input
              type="number"
              inputMode="numeric"
              value={formData.nextInvoiceNo}
              onChange={(e) => setFormData({ ...formData, nextInvoiceNo: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.declaration}</label>
            <textarea
              rows={2}
              value={formData.declaration}
              onChange={(e) => setFormData({ ...formData, declaration: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.signatureLabel}</label>
            <input
              type="text"
              value={formData.signatureLabel}
              onChange={(e) => setFormData({ ...formData, signatureLabel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <input
              type="checkbox"
              id="roundOff"
              checked={formData.roundOffEnabled}
              onChange={(e) => setFormData({ ...formData, roundOffEnabled: e.target.checked })}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="roundOff" className="text-sm font-semibold text-gray-800">
              {t.roundOffToggle}
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[48px] bg-blue-700 hover:bg-blue-800 text-white font-bold text-base rounded-xl transition shadow-md"
        >
          {saving ? 'Saving...' : t.saveSettings}
        </button>
      </form>

      {/* Offline Backup Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Data Backup (.xlsx)</h3>
          <p className="text-xs text-gray-500 mt-0.5">Download your shop data & invoices to Excel</p>
        </div>
        <button
          type="button"
          onClick={handleDownloadBackupXLSX}
          className="px-3.5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow"
        >
          <Download size={15} />
          <span>{t.downloadBackup}</span>
        </button>
      </div>
    </div>
  );
};
