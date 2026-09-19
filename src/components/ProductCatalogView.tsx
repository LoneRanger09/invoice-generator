import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import type { Product, UnitType } from '../lib/types';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';
import { Repository } from '../lib/repository';
import { formatINR } from '../lib/money';

interface ProductCatalogViewProps {
  products: Product[];
  onRefresh: () => void;
  language: Language;
}

const COMMON_UNITS: UnitType[] = [
  'kgs',
  'gm',
  'pcs',
  'litre',
  'ml',
  'dozen',
  'packet',
  'box',
  'metre'
];

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({
  products,
  onRefresh,
  language
}) => {
  const t = translations[language];

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState<UnitType>('kgs');
  const [customUnit, setCustomUnit] = useState('');
  const [price, setPrice] = useState<string>('');

  const filteredProducts = products.filter(
    (p) => !p.deleted && p.name.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setUnit('kgs');
    setCustomUnit('');
    setPrice('');
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    if (COMMON_UNITS.includes(p.unit)) {
      setUnit(p.unit);
      setCustomUnit('');
    } else {
      setUnit('custom');
      setCustomUnit(p.unit);
    }
    setPrice(p.price.toString());
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalUnit = unit === 'custom' ? customUnit.trim() || 'pcs' : unit;
    const finalPrice = parseFloat(price) || 0;

    await Repository.saveProduct({
      id: editingProduct?.id,
      name: name.trim(),
      unit: finalUnit,
      price: finalPrice
    });

    setModalOpen(false);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm(t.confirmDelete)) {
      await Repository.deleteProduct(id);
      onRefresh();
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-3xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package size={22} className="text-blue-700" />
          <h2 className="text-lg font-bold text-gray-900">{t.productsCatalog}</h2>
        </div>
        <button
          onClick={openAddModal}
          className="min-h-[44px] px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow transition"
        >
          <Plus size={16} />
          <span>{t.addProduct}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t.searchProducts}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-sm"
        />
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200 shadow-sm">
          <p className="text-sm font-medium">{t.noProducts}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
          {filteredProducts.map((prod) => (
            <div key={prod.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{prod.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Unit: <span className="font-semibold text-gray-700">{prod.unit}</span>
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {formatINR(prod.price)} / {prod.unit}
                </span>
                <button
                  onClick={() => openEditModal(prod)}
                  className="p-2 text-gray-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 transition"
                  title={t.editProduct}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(prod.id)}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  title={t.delete}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              {editingProduct ? t.editProduct : t.addProduct}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {t.productName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.unit}</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                  >
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option value="custom">Custom...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.defaultPrice}</label>
                  <input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {unit === 'custom' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Custom Unit Name</label>
                  <input
                    type="text"
                    placeholder="e.g. bundle, roll"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 min-h-[44px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl transition shadow"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
