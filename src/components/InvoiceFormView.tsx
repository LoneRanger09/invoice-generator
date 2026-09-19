import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Sparkles } from 'lucide-react';
import type { Invoice, InvoiceItem, Product, Customer, ShopSettings } from '../lib/types';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';
import { Repository } from '../lib/repository';
import {
  toPaise,
  fromPaise,
  calculateLineAmountPaise,
  calculateRoundOffPaise,
  formatINR
} from '../lib/money';
import { numberToWordsINR } from '../lib/numberToWords';

interface InvoiceFormViewProps {
  shopSettings: ShopSettings;
  products: Product[];
  customers: Customer[];
  editInvoiceId?: string;
  onSaved: (invoiceId: string) => void;
  language: Language;
}

interface ItemRow {
  id: string;
  description: string;
  qty: string;
  unit: string;
  rate: string;
  savedInCatalog?: boolean;
}

export const InvoiceFormView: React.FC<InvoiceFormViewProps> = ({
  shopSettings,
  products,
  customers,
  editInvoiceId,
  onSaved,
  language
}) => {
  const t = translations[language];

  const [invoiceNo, setInvoiceNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');

  const [items, setItems] = useState<ItemRow[]>([
    { id: '1', description: '', qty: '1', unit: 'pcs', rate: '0' }
  ]);

  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [activeCatalogRowIdx, setActiveCatalogRowIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Initialize Invoice Number & Load draft/existing invoice
  useEffect(() => {
    async function loadData() {
      if (editInvoiceId) {
        const res = await Repository.getInvoiceWithItems(editInvoiceId);
        if (res) {
          setInvoiceNo(res.invoice.invoiceNo);
          setDate(res.invoice.date);
          setCustomerName(res.invoice.customerName);
          setCustomerAddress(res.invoice.customerAddress);
          setCustomerPhone(res.invoice.customerPhone || '');
          setNote(res.invoice.note || '');
          setItems(
            res.items.map((i) => ({
              id: i.id,
              description: i.description,
              qty: i.qty.toString(),
              unit: i.unit,
              rate: i.rate.toString(),
              savedInCatalog: true
            }))
          );
          return;
        }
      }

      // Auto generate invoice number for new invoice
      const prefix = shopSettings.invoicePrefix || 'INV-';
      const nextNo = shopSettings.nextInvoiceNo || 1;
      setInvoiceNo(`${prefix}${nextNo}`);

      // Check draft in localStorage
      const draft = localStorage.getItem('dukaan_bill_draft');
      if (draft && !editInvoiceId) {
        try {
          const parsed = JSON.parse(draft);
          setCustomerName(parsed.customerName || '');
          setCustomerAddress(parsed.customerAddress || '');
          setCustomerPhone(parsed.customerPhone || '');
          setNote(parsed.note || '');
          if (parsed.items && parsed.items.length > 0) {
            setItems(parsed.items);
          }
        } catch (e) {}
      }
    }
    loadData();
  }, [editInvoiceId, shopSettings]);

  // Draft autosave effect
  useEffect(() => {
    if (!editInvoiceId) {
      localStorage.setItem(
        'dukaan_bill_draft',
        JSON.stringify({ customerName, customerAddress, customerPhone, note, items })
      );
    }
  }, [customerName, customerAddress, customerPhone, note, items, editInvoiceId]);

  // Party search suggestion
  const handlePartyChange = (val: string) => {
    setCustomerName(val);
    if (val.trim()) {
      const matches = customers.filter(
        (c) => !c.deleted && c.name.toLowerCase().includes(val.toLowerCase())
      );
      setCustomerSuggestions(matches);
    } else {
      setCustomerSuggestions([]);
    }
  };

  const selectParty = (c: Customer) => {
    setCustomerName(c.name);
    setCustomerAddress(c.address);
    setCustomerPhone(c.phone);
    setCustomerSuggestions([]);
  };

  // Item row operations with functional state updates to prevent state overwrites
  const updateItemFields = (index: number, updates: Partial<ItemRow>) => {
    setItems((prevItems) => {
      const next = [...prevItems];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleProductSelect = (index: number, prod: Product) => {
    updateItemFields(index, {
      description: prod.name,
      unit: prod.unit,
      rate: prod.price.toString(),
      savedInCatalog: true
    });
    setActiveCatalogRowIdx(null);
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: '', qty: '1', unit: 'pcs', rate: '0' }
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== index)));
  };

  const saveProductToCatalog = async (row: ItemRow) => {
    if (!row.description.trim()) return;
    await Repository.saveProduct({
      name: row.description.trim(),
      unit: row.unit || 'pcs',
      price: parseFloat(row.rate) || 0
    });
    updateItemFields(items.findIndex((i) => i.id === row.id), { savedInCatalog: true });
    alert(`"${row.description}" ${t.saveToCatalog}!`);
  };

  // Compute live money totals in integer paise
  let subtotalPaise = 0;
  const lineCalculations = items.map((item) => {
    const q = parseFloat(item.qty) || 0;
    const r = parseFloat(item.rate) || 0;
    const amountPaise = calculateLineAmountPaise(q, r);
    subtotalPaise += amountPaise;
    return { qty: q, rate: r, amountPaise, amountRupees: fromPaise(amountPaise) };
  });

  const { roundOffPaise, totalPaise } = calculateRoundOffPaise(
    subtotalPaise,
    shopSettings.roundOffEnabled
  );

  const subtotalRupees = fromPaise(subtotalPaise);
  const roundOffRupees = fromPaise(roundOffPaise);
  const totalRupees = fromPaise(totalPaise);
  const amountWords = numberToWordsINR(totalRupees);

  // Form submission / Invoice Save
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter party/customer name');
      return;
    }

    if (items.some((i) => !i.description.trim())) {
      alert('Please fill description for all item rows');
      return;
    }

    setSaving(true);
    try {
      // Auto save party if not exists
      const existingCust = customers.find((c) => c.name.toLowerCase() === customerName.toLowerCase());
      if (!existingCust) {
        await Repository.saveCustomer({
          name: customerName.trim(),
          address: customerAddress.trim(),
          phone: customerPhone.trim()
        });
      }

      const invoiceData = {
        id: editInvoiceId,
        invoiceNo,
        date,
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        customerPhone: customerPhone.trim(),
        subtotal: subtotalRupees,
        roundOff: roundOffRupees,
        total: totalRupees,
        amountInWords: amountWords,
        note: note.trim(),
        status: 'active' as const
      };

      const itemPayloads = items.map((item, idx) => ({
        slNo: idx + 1,
        description: item.description.trim(),
        qty: parseFloat(item.qty) || 0,
        unit: item.unit.trim() || 'pcs',
        rate: parseFloat(item.rate) || 0,
        amount: lineCalculations[idx].amountRupees
      }));

      const saved = await Repository.saveInvoice(invoiceData, itemPayloads);
      localStorage.removeItem('dukaan_bill_draft');
      onSaved(saved.invoice.id);
    } catch (err: any) {
      alert(`Save failed: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-3xl mx-auto space-y-5">
      <form onSubmit={handleSaveInvoice} className="space-y-5">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.invoiceNo}</label>
            <input
              type="text"
              readOnly
              value={invoiceNo}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-xl text-sm font-bold text-red-700 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">{t.date}</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Customer / Party Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-3 relative">
          <h3 className="text-sm font-bold text-gray-900 border-b pb-2">{t.partyDetails}</h3>

          <div className="relative">
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {t.partyName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Verma Provision Store"
              value={customerName}
              onChange={(e) => handlePartyChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />

            {/* Suggestions Popup */}
            {customerSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto divide-y divide-gray-100">
                {customerSuggestions.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectParty(c);
                    }}
                    className="w-full text-left p-2.5 hover:bg-blue-50 transition flex justify-between items-center"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{c.name}</p>
                      <p className="text-[11px] text-gray-500">{c.address}</p>
                    </div>
                    {c.phone && <span className="text-[11px] text-blue-700 font-mono">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.partyPhone}</label>
              <input
                type="tel"
                inputMode="tel"
                placeholder="e.g. 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t.partyAddress}</label>
              <input
                type="text"
                placeholder="e.g. Civil Lines, Kanpur"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Items Table Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-sm font-bold text-gray-900">{t.items}</h3>
            <span className="text-xs font-semibold text-gray-500">{items.length} item(s)</span>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => {
              const matchedProducts = products.filter(
                (p) =>
                  !p.deleted &&
                  item.description.trim() &&
                  p.name.toLowerCase().includes(item.description.toLowerCase())
              );

              return (
                <div
                  key={item.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-full">
                      #{idx + 1}
                    </span>

                    <div className="flex items-center space-x-2">
                      {!item.savedInCatalog && item.description.trim() && (
                        <button
                          type="button"
                          onClick={() => saveProductToCatalog(item)}
                          className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-md border border-blue-200"
                        >
                          <Sparkles size={12} />
                          <span>{t.saveToCatalog}</span>
                        </button>
                      )}

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Item Name Input with Catalog Autocomplete */}
                  <div className="relative">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.description} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Type or pick item from catalog..."
                      value={item.description}
                      onFocus={() => setActiveCatalogRowIdx(idx)}
                      onChange={(e) => {
                        updateItemFields(idx, {
                          description: e.target.value,
                          savedInCatalog: false
                        });
                        setActiveCatalogRowIdx(idx);
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />

                    {/* Catalog suggestions popup */}
                    {activeCatalogRowIdx === idx && matchedProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-40 overflow-y-auto divide-y divide-gray-100">
                        {matchedProducts.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleProductSelect(idx, p);
                            }}
                            className="w-full text-left p-2.5 hover:bg-blue-50 transition flex justify-between items-center text-xs"
                          >
                            <span className="font-bold text-gray-900">{p.name}</span>
                            <span className="font-mono text-blue-800">
                              {formatINR(p.price)} / {p.unit}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Qty, Unit, Rate, Amount Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.qty}</label>
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        required
                        value={item.qty}
                        onChange={(e) => updateItemFields(idx, { qty: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.unit}</label>
                      <input
                        type="text"
                        placeholder="kgs, pcs..."
                        value={item.unit}
                        onChange={(e) => updateItemFields(idx, { unit: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">{t.rate}</label>
                      <input
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        required
                        value={item.rate}
                        onChange={(e) => updateItemFields(idx, { rate: e.target.value })}
                        className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200/60">
                    <span className="text-gray-500 font-medium">Line Amount:</span>
                    <span className="font-bold text-gray-900 font-mono text-sm">
                      {formatINR(lineCalculations[idx].amountRupees)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addItemRow}
            className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200 flex items-center justify-center space-x-1.5 transition"
          >
            <Plus size={16} />
            <span>{t.addItem}</span>
          </button>
        </div>

        {/* Live Calculation Summary */}
        <div className="bg-stone-950 text-white rounded-2xl p-5 shadow-lg space-y-3 font-sans">
          <div className="flex justify-between text-xs text-stone-300">
            <span>{t.subtotal}</span>
            <span className="font-mono text-sm">{formatINR(subtotalRupees)}</span>
          </div>

          {shopSettings.roundOffEnabled && (
            <div className="flex justify-between text-xs text-stone-300 border-t border-stone-800 pt-2">
              <span>{t.roundOff}</span>
              <span className="font-mono text-sm">
                {roundOffRupees >= 0 ? `+${formatINR(roundOffRupees)}` : formatINR(roundOffRupees)}
              </span>
            </div>
          )}

          <div className="flex justify-between text-base font-bold text-white border-t border-stone-800 pt-3">
            <span>{t.total}</span>
            <span className="font-mono text-xl text-emerald-400">{formatINR(totalRupees)}</span>
          </div>

          <div className="bg-stone-900/80 p-3 rounded-xl text-xs text-stone-200 border border-stone-800 italic">
            <span className="font-semibold non-italic text-stone-400 block mb-0.5">{t.amountInWords}:</span>
            "{amountWords}"
          </div>
        </div>

        {/* Optional Note */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <label className="block text-xs font-bold text-gray-700 mb-1">{t.note}</label>
          <input
            type="text"
            placeholder="e.g. Goods once sold will not be taken back."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[52px] bg-blue-700 hover:bg-blue-800 text-white font-bold text-base rounded-xl transition shadow-xl flex items-center justify-center space-x-2"
        >
          <Save size={18} />
          <span>{saving ? 'Saving...' : t.saveInvoice}</span>
        </button>
      </form>
    </div>
  );
};
