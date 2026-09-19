import React from 'react';
import { Wifi, WifiOff, RefreshCw, Globe } from 'lucide-react';
import type { SyncStatus } from '../lib/types';
import type { Language } from '../lib/i18n';
import { translations } from '../lib/i18n';

interface HeaderProps {
  syncStatus: SyncStatus;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSyncTrigger: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  syncStatus,
  language,
  onLanguageChange,
  onSyncTrigger
}) => {
  const t = translations[language];

  return (
    <header className="bg-blue-900 text-white shadow-md sticky top-0 z-30 px-4 py-3 border-b border-blue-800">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        {/* Brand & App Title */}
        <div className="flex items-center space-x-2">
          <div className="bg-white text-blue-900 font-bold px-2.5 py-1 rounded text-lg tracking-tight shadow-sm font-mono border border-blue-200">
            ₹ DB
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">{t.appName}</h1>
            <p className="text-xs text-blue-200 hidden sm:block">{t.tagline}</p>
          </div>
        </div>

        {/* Sync Status & Action Bar */}
        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <div
            onClick={onSyncTrigger}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
              !syncStatus.isOnline
                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                : syncStatus.isSyncing
                ? 'bg-blue-700/50 text-blue-100 animate-pulse'
                : syncStatus.pendingCount > 0
                ? 'bg-orange-500/20 text-orange-200 border border-orange-400/30'
                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
            }`}
            title={syncStatus.error || (syncStatus.pendingCount > 0 ? `${syncStatus.pendingCount} ${t.pendingChanges}` : t.online)}
          >
            {syncStatus.isSyncing ? (
              <RefreshCw size={13} className="animate-spin text-blue-300" />
            ) : syncStatus.isOnline ? (
              <Wifi size={13} className="text-emerald-400" />
            ) : (
              <WifiOff size={13} className="text-amber-400" />
            )}

            <span className="truncate max-w-[110px] sm:max-w-none">
              {syncStatus.isSyncing
                ? t.syncing
                : !syncStatus.isOnline
                ? t.offline
                : syncStatus.pendingCount > 0
                ? `${syncStatus.pendingCount} ${t.pendingChanges}`
                : t.online}
            </span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => onLanguageChange(language === 'hi' ? 'en' : 'hi')}
            className="flex items-center space-x-1 bg-blue-800/80 hover:bg-blue-800 text-blue-100 px-2.5 py-1 rounded-full text-xs font-medium border border-blue-700 transition"
          >
            <Globe size={13} />
            <span>{language === 'hi' ? 'EN' : 'हिंदी'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
