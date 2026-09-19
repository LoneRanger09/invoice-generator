import React from 'react';
import { PlusCircle, FileText, Package, Store } from 'lucide-react';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';

export type TabType = 'new_bill' | 'bills' | 'products' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language
}) => {
  const t = translations[language];

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'new_bill',
      label: t.navNewBill,
      icon: <PlusCircle size={22} />
    },
    {
      id: 'bills',
      label: t.navBills,
      icon: <FileText size={22} />
    },
    {
      id: 'products',
      label: t.navProducts,
      icon: <Package size={22} />
    },
    {
      id: 'settings',
      label: t.navSettings,
      icon: <Store size={22} />
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30 pb-safe">
      <div className="max-w-3xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 min-h-[52px] text-xs font-semibold transition-colors relative ${
                isActive
                  ? 'text-blue-700 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-700 rounded-b-full" />
              )}
              <div className={isActive ? 'text-blue-700 scale-105 transition-transform' : 'text-gray-500'}>
                {tab.icon}
              </div>
              <span className="mt-1 leading-none">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
