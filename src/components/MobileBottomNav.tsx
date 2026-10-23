import React from 'react';
import { Home, BarChart3, Receipt, Target, SlidersHorizontal } from 'lucide-react';
import { NavTab } from '../types';
import { translations, Language } from '../lib/i18n';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: Language;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
}) => {
  const t = translations[language];

  const items = [
    { id: 'home' as NavTab, label: t.home, icon: Home },
    { id: 'analytics' as NavTab, label: t.analytics, icon: BarChart3 },
    { id: 'transactions' as NavTab, label: t.transactions, icon: Receipt },
    { id: 'goals' as NavTab, label: t.goals, icon: Target },
    { id: 'settings' as NavTab, label: t.settings, icon: SlidersHorizontal },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#080c0e]/95 backdrop-blur-xl px-2 py-1.5 safe-area-inset-bottom"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-400 font-semibold scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-normal'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-lg transition-colors ${
                  isActive ? 'bg-emerald-500/15' : ''
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
