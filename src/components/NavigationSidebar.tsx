import React from 'react';
import {
  Home,
  BarChart3,
  Receipt,
  Target,
  SlidersHorizontal,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavTab } from '../types';
import { translations, Language } from '../lib/i18n';

interface NavigationSidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: Language;
  streakCount: number;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onTabChange,
  language,
  streakCount,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const t = translations[language];

  const navItems = [
    { id: 'home' as NavTab, label: t.home, icon: Home },
    { id: 'analytics' as NavTab, label: t.analytics, icon: BarChart3 },
    { id: 'transactions' as NavTab, label: t.transactions, icon: Receipt },
    { id: 'goals' as NavTab, label: t.goals, icon: Target },
    { id: 'settings' as NavTab, label: t.settings, icon: SlidersHorizontal },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col justify-between shrink-0 border-r border-white/5 bg-[#090e11]/90 backdrop-blur-xl transition-all duration-300 z-30 sticky top-0 h-screen ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      aria-label="Sidebar Navigation"
    >
      <div>
        {/* Brand & Collapse Toggle */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-white/5 min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-900 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
              <Sparkles className="h-5 w-5 text-emerald-950 fill-emerald-100" />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#090e11] bg-emerald-400" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 truncate">
                <span className="font-display text-lg font-bold tracking-tight text-white block truncate leading-tight">
                  Savely
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest block truncate">
                  AI Fintech
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1.5" aria-label="Main Menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`group flex w-full items-center rounded-2xl transition-all ${
                  isCollapsed ? 'justify-center p-3' : 'px-3.5 py-3 space-x-3.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 font-medium'
                }`}
                title={isCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {!isCollapsed && (
                  <span className="text-sm truncate tracking-tight">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Streak Gamification Badge */}
      <div className="p-4 border-t border-white/5">
        {!isCollapsed ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5">
            <div className="flex items-center space-x-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Flame className="h-4 w-4 animate-pulse" />
              </span>
              <div>
                <p className="text-[11px] font-semibold text-amber-300">
                  {streakCount} {t.dayStreak}
                </p>
                <p className="text-[10px] text-slate-400">{t.streakTitle}</p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="flex justify-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400"
            title={`${streakCount} ${t.dayStreak}`}
          >
            <Flame className="h-5 w-5 animate-pulse" />
          </div>
        )}
      </div>
    </aside>
  );
};
