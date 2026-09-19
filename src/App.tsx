import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './lib/db';
import { Repository } from './lib/repository';
import { syncEngine } from './lib/syncEngine';
import type { SyncStatus, ShopSettings } from './lib/types';
import type { Language } from './lib/i18n';
import type { TabType } from './components/BottomNav';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ShopSetupView } from './components/ShopSetupView';
import { ProductCatalogView } from './components/ProductCatalogView';
import { InvoiceFormView } from './components/InvoiceFormView';
import { InvoicePreviewView } from './components/InvoicePreviewView';
import { InvoicesListView } from './components/InvoicesListView';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('new_bill');
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | undefined>();
  const [previewInvoiceId, setPreviewInvoiceId] = useState<string | undefined>();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0
  });

  // Dexie live queries for real-time local updates
  const shopSettings = useLiveQuery(() => db.shop.get('default'));
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];

  const language: Language = shopSettings?.language || 'en';

  // Initialize shop settings if missing
  useEffect(() => {
    async function init() {
      const existing = await Repository.getShopSettings();
      if (!existing) {
        // Initial setup prompt
        await Repository.saveShopSettings({ shopName: '', language: 'en' });
      }
    }
    init();
  }, []);

  // Sync engine subscription & auto sync trigger
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status) => {
      setSyncStatus(status);
    });
    syncEngine.triggerSync();
    return () => unsubscribe();
  }, []);

  // First run check: Block invoice creation if shop name is empty
  const isFirstRun = !shopSettings || !shopSettings.shopName || !shopSettings.shopName.trim();

  const handleLanguageChange = async (newLang: Language) => {
    if (shopSettings) {
      const updated = await Repository.saveShopSettings({ ...shopSettings, language: newLang });
    }
  };

  const handleShopSave = async (updated: ShopSettings) => {
    // If shop name saved for first time, switch to new_bill
    if (isFirstRun && updated.shopName.trim()) {
      setActiveTab('new_bill');
    }
  };

  const handleInvoiceSaved = (invoiceId: string) => {
    setEditingInvoiceId(undefined);
    setPreviewInvoiceId(invoiceId);
    syncEngine.triggerSync();
  };

  const handleEditInvoice = (id: string) => {
    setPreviewInvoiceId(undefined);
    setEditingInvoiceId(id);
    setActiveTab('new_bill');
  };

  const handleOpenPreview = (id: string) => {
    setEditingInvoiceId(undefined);
    setPreviewInvoiceId(id);
  };

  const handleNewBillClick = () => {
    setPreviewInvoiceId(undefined);
    setEditingInvoiceId(undefined);
    setActiveTab('new_bill');
  };

  const renderTabContent = () => {
    // Preview overlay takes precedence if active
    if (previewInvoiceId) {
      return (
        <InvoicePreviewView
          invoiceId={previewInvoiceId}
          onEdit={(id) => handleEditInvoice(id)}
          onNewBill={handleNewBillClick}
          onBack={() => setPreviewInvoiceId(undefined)}
          language={language}
        />
      );
    }

    // Force setup screen if first run
    if (isFirstRun) {
      return (
        <ShopSetupView
          settings={shopSettings}
          onSave={handleShopSave}
          language={language}
          onLanguageChange={handleLanguageChange}
          onTriggerSync={() => syncEngine.triggerSync()}
          isFirstRunBlocked={true}
        />
      );
    }

    switch (activeTab) {
      case 'new_bill':
        return (
          <InvoiceFormView
            shopSettings={shopSettings}
            products={products}
            customers={customers}
            editInvoiceId={editingInvoiceId}
            onSaved={handleInvoiceSaved}
            language={language}
          />
        );

      case 'bills':
        return (
          <InvoicesListView
            invoices={invoices}
            onOpenPreview={handleOpenPreview}
            onEdit={handleEditInvoice}
            onNewBill={handleNewBillClick}
            onRefresh={() => {}}
            language={language}
          />
        );

      case 'products':
        return (
          <ProductCatalogView
            products={products}
            onRefresh={() => {}}
            language={language}
          />
        );

      case 'settings':
        return (
          <ShopSetupView
            settings={shopSettings}
            onSave={handleShopSave}
            language={language}
            onLanguageChange={handleLanguageChange}
            onTriggerSync={() => syncEngine.triggerSync()}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-gray-900 flex flex-col antialiased">
      <Header
        syncStatus={syncStatus}
        language={language}
        onLanguageChange={handleLanguageChange}
        onSyncTrigger={() => syncEngine.triggerSync()}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto">
        {renderTabContent()}
      </main>

      <BottomNav
        activeTab={previewInvoiceId ? 'bills' : isFirstRun ? 'settings' : activeTab}
        onTabChange={(tab) => {
          setPreviewInvoiceId(undefined);
          if (tab === 'new_bill') {
            setEditingInvoiceId(undefined);
          }
          setActiveTab(tab);
        }}
        language={language}
      />
    </div>
  );
}
