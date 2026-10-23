import React, { useState } from 'react';
import {
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  HelpCircle,
  Camera,
  Info,
  X,
  Shield,
  Layers,
} from 'lucide-react';
import { UserProfile, FinancialHealthMetrics, ExpenseRecord } from '../types';
import {
  formatCurrency,
  formatCompactCurrency,
  formatHumanDate,
  formatRemainingTime,
} from '../lib/currencies';
import { translations, Language } from '../lib/i18n';

interface HeroProgressProps {
  userProfile: UserProfile;
  metrics: FinancialHealthMetrics;
  expenses: ExpenseRecord[];
  language: Language;
  hideBalances: boolean;
  onOpenAddManual: () => void;
  onOpenScanReceipt: () => void;
  onOpenGoalEdit: () => void;
  onOpenCalculationInspector: () => void;
}

export const HeroProgress: React.FC<HeroProgressProps> = ({
  userProfile,
  metrics,
  expenses,
  language,
  hideBalances,
  onOpenAddManual,
  onOpenScanReceipt,
  onOpenGoalEdit,
  onOpenCalculationInspector,
}) => {
  const [showFormulaPopover, setShowFormulaPopover] = useState(false);
  const goal = userProfile.savingsGoal;
  const progressPct = metrics.savingsGoalProgressPct;
  const currency = userProfile.currency || 'IDR';
  const t = translations[language];

  // Check if at least 1 expense exists
  const hasExpenses = expenses.length > 0;

  // Real-data Status Badge
  const getPaceStatus = () => {
    if (!hasExpenses || metrics.totalSpentThisMonth === 0) {
      return {
        label: t.noDataYet,
        color: 'text-slate-300 border-slate-700 bg-slate-800/40',
        icon: Info,
        tooltip: language === 'id' ? 'Catat pengeluaran pertama untuk mengukur kecepatan anggaran.' : 'Log your first expense to calibrate spending pace.',
      };
    }

    if (metrics.velocityStatus === 'critical' || metrics.dailyBurnPct > 100) {
      return {
        label: t.overspending,
        color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
        icon: AlertTriangle,
        tooltip: language === 'id' ? 'Pengeluaran harian melebihi batas aman.' : 'Daily spending exceeds safe threshold.',
      };
    }

    if (metrics.dailyBurnPct > 75 || metrics.velocityStatus === 'caution') {
      return {
        label: t.caution,
        color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        icon: AlertTriangle,
        tooltip: language === 'id' ? 'Mendekati batas aman harian.' : 'Approaching daily safe limit.',
      };
    }

    if (metrics.velocityStatus === 'thriving') {
      return {
        label: t.aheadOfPace,
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        icon: CheckCircle2,
        tooltip: language === 'id' ? 'Pengeluaran sangat terkontrol di bawah alokasi.' : 'Discretionary spending is well under budget.',
      };
    }

    return {
      label: t.onTrack,
      color: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
      icon: TrendingUp,
      tooltip: language === 'id' ? 'Pengeluaran sesuai jalur tabungan.' : 'Spending on target.',
    };
  };

  const status = getPaceStatus();
  const StatusIcon = status.icon;

  // Mini 7-day bar chart data for Weekly Burn Target
  const now = new Date();
  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const dayLabel = d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'narrow' });
    
    const dayTotal = expenses.filter((e) => {
      const expDate = new Date(e.date);
      return (
        expDate.getFullYear() === d.getFullYear() &&
        expDate.getMonth() === d.getMonth() &&
        expDate.getDate() === d.getDate()
      );
    }).reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      dayLabel,
      amount: dayTotal,
      isToday: i === 6,
    };
  });

  const max7DaySpend = Math.max(metrics.dailySafeToSpend, ...last7DaysData.map((d) => d.amount), 1);

  // Savings goal circular ring
  const radius = 64;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progressPct)) / 100) * circumference;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-emerald-900/30 bg-gradient-to-b from-[#0c1417] via-[#091012] to-[#070b0d] p-6 sm:p-8 lg:p-10 shadow-2xl">
      {/* Background ambient radial glow */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-teal-500/10 blur-[100px]" />

      {/* Top Banner Row */}
      <div className="relative z-10 mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
            <span>{language === 'id' ? 'Periode Anggaran' : 'Budget Period'}</span>
            <span aria-hidden="true">·</span>
            <span>{new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            {language === 'id' ? `Selamat Datang, ${userProfile.name || 'Member'}` : `Welcome back, ${userProfile.name || 'Member'}`}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Real-data Pace Badge with tooltip */}
          <div
            className={`inline-flex items-center space-x-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${status.color}`}
            title={status.tooltip}
          >
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{status.label}</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs text-slate-300 bg-white/[0.04] border border-white/10 px-3 py-1 rounded-full">
            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
            <span>
              {language === 'id'
                ? `Hari ${metrics.currentDayOfMonth} dari ${metrics.daysInMonth} (${metrics.daysRemainingInMonth} hari tersisa)`
                : `Day ${metrics.currentDayOfMonth} of ${metrics.daysInMonth} (${metrics.daysRemainingInMonth} days left)`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Dominant Safe-To-Spend Hero Center + Flanking Supporting Cards */}
      <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
        {/* Dominant Hero Card: SAFE TO SPEND TODAY (lg:col-span-6) */}
        <div className="flex flex-col justify-between rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950/30 via-[#0a1215] to-[#080d10] p-6 sm:p-8 backdrop-blur-md shadow-xl lg:col-span-6">
          <div>
            <div className="flex items-center justify-between relative">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center space-x-1.5">
                <Shield className="h-4 w-4" />
                <span>{t.safeToSpendToday}</span>
              </span>

              {/* Explaining Formula Popover Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowFormulaPopover(!showFormulaPopover)}
                  className="inline-flex items-center space-x-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-300 hover:text-emerald-300 hover:border-emerald-500/30 transition-all"
                  aria-label={t.howCalculated}
                >
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{t.howCalculated}</span>
                </button>

                {showFormulaPopover && (
                  <div className="absolute right-0 top-8 z-50 w-72 sm:w-80 rounded-2xl border border-emerald-500/30 bg-[#0d1417] p-4 shadow-2xl backdrop-blur-2xl">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                      <span className="font-semibold text-xs text-emerald-400">{t.formulaTitle}</span>
                      <button
                        type="button"
                        onClick={() => setShowFormulaPopover(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.formulaExplanation}
                    </p>
                    <div className="mt-3 rounded-xl bg-white/[0.03] p-2.5 font-mono text-[11px] text-slate-300 border border-white/5 space-y-1">
                      <p>
                        {language === 'id' ? 'Sisa Anggaran' : 'Remaining Budget'}: {formatCurrency(metrics.monthlyRemainingSafe, currency, hideBalances)}
                      </p>
                      <p>
                        {language === 'id' ? 'Sisa Hari' : 'Days Remaining'}: {metrics.daysRemainingInMonth}
                      </p>
                      <p className="font-bold text-emerald-300 pt-1 border-t border-white/10">
                        = {formatCurrency(metrics.dailySafeToSpend, currency, hideBalances)} / {language === 'id' ? 'hari' : 'day'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFormulaPopover(false);
                        onOpenCalculationInspector();
                      }}
                      className="mt-3 text-xs text-emerald-400 hover:underline block text-right font-medium"
                    >
                      {language === 'id' ? 'Buka rincian lengkap →' : 'View full breakdown →'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Dominant Allowance Metric */}
            <div className="mt-5">
              <p className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                {formatCurrency(metrics.dailySafeToSpend, currency, hideBalances)}
              </p>

              {/* Spent Today Status: Never show Rp 0 in red! */}
              <div className="mt-2.5 flex items-center space-x-2 text-sm text-slate-200">
                <span>{t.spentToday}:</span>
                <span
                  className={`font-mono font-semibold ${
                    metrics.totalSpentToday === 0
                      ? 'text-emerald-400'
                      : metrics.totalSpentToday > metrics.dailySafeToSpend
                      ? 'text-rose-400'
                      : 'text-amber-300'
                  }`}
                >
                  {formatCurrency(metrics.totalSpentToday, currency, hideBalances)}
                </span>
              </div>

              <p className="text-xs font-medium mt-1">
                {metrics.todayRemainingSafe > 0 ? (
                  <span className="text-emerald-400">
                    <span className="font-mono font-bold">
                      {formatCurrency(metrics.todayRemainingSafe, currency, hideBalances)}
                    </span>{' '}
                    {t.remainingToday}.
                  </span>
                ) : metrics.totalSpentToday > 0 ? (
                  <span className="text-rose-300">
                    {t.allowanceExhausted}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {language === 'id' ? 'Belum ada pengeluaran hari ini. Batas penuh tersedia.' : 'No expenses recorded today. Full allowance available.'}
                  </span>
                )}
              </p>
            </div>

            {/* Daily Burn Gauge Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>{t.dailyBurnPace}</span>
                <span className="font-mono font-semibold text-slate-200">
                  {metrics.dailyBurnPct}% {t.consumed}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90 border border-white/5">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    metrics.dailyBurnPct > 100
                      ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                      : metrics.dailyBurnPct > 75
                      ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                      : 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                  }`}
                  style={{ width: `${Math.min(100, metrics.dailyBurnPct)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Row: Manual Entry & Receipt Scan as clear secondary actions */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center gap-3">
            <button
              id="hero-log-manual-btn"
              type="button"
              onClick={onOpenAddManual}
              className="inline-flex items-center space-x-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>{t.logManually}</span>
            </button>

            <button
              id="hero-scan-receipt-btn"
              type="button"
              onClick={onOpenScanReceipt}
              className="inline-flex items-center space-x-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08] hover:text-white transition-all"
            >
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>{t.scanReceipt}</span>
            </button>
          </div>
        </div>

        {/* Flanking Card 1: Savings Goal Progress (lg:col-span-3) */}
        <div className="flex flex-col justify-between rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm lg:col-span-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t.savingsGoal}
              </span>
              <button
                type="button"
                onClick={onOpenGoalEdit}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                {t.edit}
              </button>
            </div>

            {/* Circular Ring */}
            <div className="my-5 flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                <svg height={radius * 2} width={radius * 2} className="-rotate-90 transform">
                  <defs>
                    <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <circle
                    stroke="rgba(16, 185, 129, 0.15)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  <circle
                    stroke="url(#goalGrad)"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-2xl font-extrabold text-white">
                    {progressPct}%
                  </span>
                  <span className="text-xs text-slate-300 uppercase tracking-wider">
                    {t.completed}
                  </span>
                </div>
              </div>
            </div>

            {/* Goal Numbers */}
            <div className="text-center">
              <h4 className="text-sm font-semibold text-white truncate max-w-full">
                {goal?.title || (language === 'id' ? 'Dana Darurat' : 'Emergency Fund')}
              </h4>
              <div className="mt-1 flex items-center justify-center space-x-1.5 text-xs">
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(goal?.currentSaved || 0, currency, hideBalances)}
                </span>
                <span className="text-slate-400">/</span>
                <span className="font-mono text-slate-300">
                  {formatCurrency(goal?.targetAmount || 0, currency, hideBalances)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-300 flex items-center justify-between">
            <span className="truncate">
              {formatHumanDate(goal?.deadlineDate || '2028-06-01', language)} ({formatRemainingTime(goal?.deadlineDate || '2028-06-01', language)})
            </span>
            <span className="text-emerald-400 font-mono font-semibold shrink-0 ml-2">
              +{formatCompactCurrency(goal?.monthlyTargetContribution || 0, currency, hideBalances)}/mo
            </span>
          </div>
        </div>

        {/* Flanking Card 2: Weekly Burn Target & Mini 7-Day Chart (lg:col-span-3) */}
        <div className="flex flex-col justify-between rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm lg:col-span-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t.weeklySafe}
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
            </div>

            <div className="mt-3">
              <p className="font-display text-2xl font-bold tracking-tight text-white">
                {formatCurrency(metrics.weeklySafeToSpend, currency, hideBalances)}
              </p>
              <p className="text-xs text-slate-300 mt-0.5">
                {language === 'id' ? 'Alokasi aman 7 hari' : '7-day safe allocation'}
              </p>
            </div>

            {/* Rebalanced mini 7-day bar chart filling the gap */}
            <div className="mt-4 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-300 block">
                {language === 'id' ? 'Aktivitas 7 Hari Terakhir' : 'Last 7 Days Burn'}
              </span>
              <div className="flex items-end justify-between h-14 pt-2 px-1 bg-white/[0.02] rounded-xl border border-white/5">
                {last7DaysData.map((d, idx) => {
                  const heightPct = Math.min(100, Math.max(8, (d.amount / max7DaySpend) * 100));
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 space-y-1">
                      <div className="w-full flex justify-center h-10 items-end">
                        <div
                          className={`w-3 rounded-t-sm transition-all duration-300 ${
                            d.amount === 0
                              ? 'bg-slate-800'
                              : d.amount > metrics.dailySafeToSpend
                              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                              : d.isToday
                              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                              : 'bg-teal-500/70'
                          }`}
                          style={{ height: `${d.amount === 0 ? 4 : heightPct}%` }}
                          title={`${d.dayLabel}: ${formatCurrency(d.amount, currency, hideBalances)}`}
                        />
                      </div>
                      <span className={`text-[10px] font-mono ${d.isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                        {d.dayLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Spent this week bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">{language === 'id' ? 'Terpakai Minggu Ini' : 'Spent This Week'}</span>
                <span className="font-mono font-semibold text-teal-300">
                  {formatCurrency(metrics.totalSpentThisWeek, currency, hideBalances)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/90 border border-white/5">
                <div
                  className={`h-full transition-all duration-700 rounded-full ${
                    metrics.weeklyBurnPct > 100
                      ? 'bg-rose-500'
                      : metrics.weeklyBurnPct > 75
                      ? 'bg-amber-400'
                      : 'bg-teal-400'
                  }`}
                  style={{ width: `${Math.min(100, metrics.weeklyBurnPct)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-xs text-slate-300 flex items-center justify-between">
            <span>{language === 'id' ? 'Prakiraan sisa akhir bulan' : 'Forecasted month reserve'}:</span>
            <span className="font-mono font-bold text-emerald-400 ml-2">
              {formatCurrency(metrics.projectedMonthEndSavings, currency, hideBalances)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
