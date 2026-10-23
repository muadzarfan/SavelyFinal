import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  Check,
  LogOut,
  User,
  Globe,
  Coins,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Flame,
  ShieldCheck,
  Receipt,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { CurrencyCode, UserProfile, FinancialHealthMetrics, NavTab } from '../types';
import { SUPPORTED_CURRENCIES } from '../lib/currencies';
import { AuthUser } from '../lib/auth';
import { translations, Language } from '../lib/i18n';

interface TopBarProps {
  userProfile: UserProfile;
  metrics: FinancialHealthMetrics;
  currentUser: AuthUser | null;
  language: Language;
  hideBalances: boolean;
  theme: 'dark' | 'light';
  onLanguageChange: (lang: Language) => void;
  onCurrencyChange: (code: CurrencyCode) => void;
  onToggleHideBalances: () => void;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  userProfile,
  metrics,
  currentUser,
  language,
  hideBalances,
  theme,
  onLanguageChange,
  onCurrencyChange,
  onToggleHideBalances,
  onToggleTheme,
  onOpenProfile,
  onNavigateTab,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    setDropdownOpen(false);
    onLogout();
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-[#080c0e]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand Logo & Title (visible on mobile / desktop) */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            <div className="lg:hidden relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-900 shadow-[0_0_15px_rgba(16,185,129,0.35)] shrink-0">
              <Sparkles className="h-4 w-4 text-emerald-950 fill-emerald-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                  Savely
                </span>
                <span className="hidden sm:inline-block rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-400 uppercase">
                  AI Fintech
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden min-[1100px]:block truncate max-w-xs xl:max-w-md">
                Smart multilingual money tracker & safe-to-spend intelligence
              </p>
            </div>
          </div>

          {/* Financial Period Badge (Real period start/end and days left) */}
          {metrics.financialPeriod && (
            <div className="hidden sm:flex items-center space-x-2 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300 backdrop-blur-sm">
              <Calendar className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-medium">
                {metrics.financialPeriod.label}
              </span>
              <span className="text-emerald-500/50">•</span>
              <span className="font-mono text-emerald-200">
                {language === 'id'
                  ? `Hari ${metrics.financialPeriod.currentDayNumber}/${metrics.financialPeriod.totalDays} (${metrics.financialPeriod.daysRemaining} hari lagi)`
                  : `Day ${metrics.financialPeriod.currentDayNumber}/${metrics.financialPeriod.totalDays} (${metrics.financialPeriod.daysRemaining}d left)`}
              </span>
            </div>
          )}

          {/* Right Action Controls: Hide Balances, Transactions Shortcut, User Menu Dropdown */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Quick Hide Balances Eye Toggle */}
            <button
              type="button"
              onClick={onToggleHideBalances}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:border-emerald-500/30 transition-colors"
              title={hideBalances ? 'Show balances' : 'Hide balances'}
              aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
            >
              {hideBalances ? <EyeOff className="h-4 w-4 text-emerald-400" /> : <Eye className="h-4 w-4" />}
            </button>

            {/* Quick Transactions Link */}
            <button
              type="button"
              onClick={() => onNavigateTab('transactions')}
              className="hidden sm:inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-emerald-500/30 transition-colors"
            >
              <Receipt className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.transactions}</span>
            </button>

            {/* Unified User Menu Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-menu-dropdown-button"
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 pr-2.5 hover:border-emerald-500/30 hover:bg-white/[0.08] transition-all"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 text-xs font-bold text-emerald-950 shadow-sm">
                  {userProfile.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'SA'}
                </div>
                <span className="max-w-[90px] truncate text-xs font-medium text-slate-200 hidden sm:inline">
                  {userProfile.name.split(' ')[0]}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                    dropdownOpen ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 z-50 w-72 rounded-2xl border border-white/10 bg-[#0c1215] p-2 shadow-2xl backdrop-blur-2xl divide-y divide-white/5">
                  {/* User Profile Overview */}
                  <div className="p-3">
                    <p className="font-semibold text-sm text-white truncate">{userProfile.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser?.email || userProfile.email}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="mt-2.5 inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>{t.profileSettings}</span>
                    </button>
                  </div>

                  {/* Language Switcher */}
                  <div className="p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                      <span className="flex items-center space-x-1.5">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        <span>{t.languageOption}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onLanguageChange('id')}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                          language === 'id'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <span>Bahasa (ID)</span>
                        {language === 'id' && <Check className="h-3 w-3 text-emerald-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onLanguageChange('en')}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors ${
                          language === 'en'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <span>English (EN)</span>
                        {language === 'en' && <Check className="h-3 w-3 text-emerald-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Currency Switcher */}
                  <div className="p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                      <span className="flex items-center space-x-1.5">
                        <Coins className="h-3.5 w-3.5 text-slate-400" />
                        <span>{t.currencyOption}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['IDR', 'USD', 'SGD', 'EUR', 'GBP'] as CurrencyCode[]).map((cCode) => (
                        <button
                          key={cCode}
                          type="button"
                          onClick={() => onCurrencyChange(cCode)}
                          className={`rounded-lg px-2 py-1 text-xs font-mono font-semibold transition-colors ${
                            userProfile.currency === cCode
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          {cCode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme & Privacy Toggles */}
                  <div className="p-2.5 space-y-1">
                    <button
                      type="button"
                      onClick={onToggleHideBalances}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
                    >
                      <span className="flex items-center space-x-2">
                        {hideBalances ? <EyeOff className="h-4 w-4 text-emerald-400" /> : <Eye className="h-4 w-4 text-slate-400" />}
                        <span>{t.hideBalances}</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {hideBalances ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={onToggleTheme}
                      className="w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs text-slate-300 hover:bg-white/5 transition-colors"
                    >
                      <span className="flex items-center space-x-2">
                        {theme === 'dark' ? <Moon className="h-4 w-4 text-emerald-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
                        <span>{t.themeOption}</span>
                      </span>
                      <span className="text-[11px] text-slate-500 capitalize">{theme}</span>
                    </button>
                  </div>

                  {/* Sign Out with Confirmation trigger */}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(true)}
                      className="w-full flex items-center space-x-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0c1215] p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="text-center font-display text-base font-bold text-white">
              {t.logout}
            </h4>
            <p className="mt-1 text-center text-xs text-slate-400">
              {t.confirmLogout}
            </p>

            <div className="mt-6 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08]"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600"
              >
                {t.logout}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
