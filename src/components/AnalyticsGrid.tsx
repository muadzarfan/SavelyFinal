import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Layers,
  Search,
  Trash2,
  Tag,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  Filter,
  Sparkles,
  Receipt,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, UserProfile, FinancialHealthMetrics } from '../types';
import { formatCurrency, formatCompactCurrency } from '../lib/currencies';
import { translations, Language } from '../lib/i18n';

interface AnalyticsGridProps {
  expenses: ExpenseRecord[];
  userProfile: UserProfile;
  metrics: FinancialHealthMetrics;
  language: Language;
  hideBalances: boolean;
  onDeleteExpense: (id: string) => void;
  onEditExpense: (expense: ExpenseRecord) => void;
  onOpenAddManual: () => void;
}

type Timeframe = 'day' | 'week' | 'month';

export const AnalyticsGrid: React.FC<AnalyticsGridProps> = ({
  expenses,
  userProfile,
  metrics,
  language,
  hideBalances,
  onDeleteExpense,
  onEditExpense,
  onOpenAddManual,
}) => {
  const [activeTab, setActiveTab] = useState<Timeframe>('month');
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ label: string; amount: number; x: number; y: number } | null>(null);
  const t = translations[language];

  // Distinct days with expenses count
  const distinctDaysCount = useMemo(() => {
    const set = new Set<string>();
    for (const exp of expenses) {
      set.add(exp.date.split('T')[0]);
    }
    return set.size;
  }, [expenses]);

  const hasEnoughDataForProjections = distinctDaysCount >= 3;

  // Filter expenses by active timeframe
  const filteredByTime = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();

    return expenses.filter((e) => {
      const expDate = new Date(e.date);
      if (activeTab === 'day') {
        return (
          expDate.getFullYear() === currentYear &&
          expDate.getMonth() === currentMonth &&
          expDate.getDate() === currentDay
        );
      } else if (activeTab === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 6);
        weekAgo.setHours(0, 0, 0, 0);
        return expDate >= weekAgo && expDate <= now;
      } else {
        // month: 1st of month to end of month
        return (
          expDate.getFullYear() === currentYear &&
          expDate.getMonth() === currentMonth
        );
      }
    });
  }, [expenses, activeTab]);

  // Last period expenses for comparison (e.g., last month)
  const lastMonthExpenses = useMemo(() => {
    const now = new Date();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonthMonth = lastMonthDate.getMonth();

    return expenses.filter((e) => {
      const expDate = new Date(e.date);
      return expDate.getFullYear() === lastMonthYear && expDate.getMonth() === lastMonthMonth;
    });
  }, [expenses]);

  const totalLastMonthSpend = useMemo(() => {
    return lastMonthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [lastMonthExpenses]);

  // Total for active timeframe
  const totalPeriodSpend = useMemo(() => {
    return filteredByTime.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredByTime]);

  // Category breakdown with comparisons
  const categoryBreakdown = useMemo(() => {
    const currentMap: Record<string, number> = {};
    for (const exp of filteredByTime) {
      currentMap[exp.category] = (currentMap[exp.category] || 0) + (exp.amount || 0);
    }

    const lastMonthMap: Record<string, number> = {};
    for (const exp of lastMonthExpenses) {
      lastMonthMap[exp.category] = (lastMonthMap[exp.category] || 0) + (exp.amount || 0);
    }

    const arr = Object.entries(currentMap).map(([category, amount]) => {
      const percentage = totalPeriodSpend > 0 ? Math.round((amount / totalPeriodSpend) * 100) : 0;
      const lastAmount = lastMonthMap[category] || 0;
      let deltaPct = 0;
      if (lastAmount > 0) {
        deltaPct = Math.round(((amount - lastAmount) / lastAmount) * 100);
      }
      return {
        category,
        amount,
        percentage,
        lastAmount,
        deltaPct,
      };
    });

    return arr.sort((a, b) => b.amount - a.amount);
  }, [filteredByTime, lastMonthExpenses, totalPeriodSpend]);

  // Full period Chart Points (Fixed: Month starts on the 1st through today/end)
  const chartPoints = useMemo(() => {
    const points: { dateStr: string; label: string; amount: number }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const todayDate = now.getDate();

    if (activeTab === 'day') {
      // 7 points: yesterday to 6 days ago
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayLabel = d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'narrow' });
        const dayTotal = expenses.filter((e) => e.date.startsWith(dStr)).reduce((s, e) => s + e.amount, 0);
        points.push({ dateStr: dStr, label: dayLabel, amount: dayTotal });
      }
    } else if (activeTab === 'week') {
      // 7 days of the past week
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayLabel = d.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: 'numeric', day: 'numeric' });
        const dayTotal = expenses.filter((e) => e.date.startsWith(dStr)).reduce((s, e) => s + e.amount, 0);
        points.push({ dateStr: dStr, label: dayLabel, amount: dayTotal });
      }
    } else {
      // Month: start from Day 1 of the current month up to today (or end of month)
      const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const maxDay = Math.min(daysInCurrentMonth, Math.max(todayDate, 7));

      for (let day = 1; day <= maxDay; day++) {
        const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTotal = expenses.filter((e) => e.date.startsWith(dStr)).reduce((s, e) => s + e.amount, 0);
        points.push({
          dateStr: dStr,
          label: `${day}`,
          amount: dayTotal,
        });
      }
    }

    return points;
  }, [expenses, activeTab, language]);

  // AI-generated Plain Language Insights
  const dynamicAIInsights = useMemo(() => {
    const list: { title: string; body: string; tip: string; type: 'alert' | 'success' | 'info' }[] = [];

    // Food category velocity check
    const foodCat = categoryBreakdown.find((c) => c.category === 'Food & Beverage');
    if (foodCat && foodCat.percentage > 35) {
      list.push({
        title: language === 'id' ? 'Pengeluaran Makanan Cukup Tinggi' : 'High Dining Spending Detected',
        body: language === 'id'
          ? `Kategori Makanan & Minuman menyerap ${foodCat.percentage}% dari seluruh pengeluaran periode ini (${formatCurrency(foodCat.amount, userProfile.currency, hideBalances)}).`
          : `Food & Beverage accounts for ${foodCat.percentage}% of your period spending (${formatCurrency(foodCat.amount, userProfile.currency, hideBalances)}).`,
        tip: language === 'id'
          ? 'Memasak makanan di rumah 2 kali minggu ini dapat menghemat sekitar 15-20% batas belanja harian.'
          : 'Cooking at home twice this week can recover 15-20% of your daily allowance.',
        type: 'alert',
      });
    }

    // Comparison with last month
    if (totalLastMonthSpend > 0) {
      const overallDelta = Math.round(((totalPeriodSpend - totalLastMonthSpend) / totalLastMonthSpend) * 100);
      if (overallDelta > 20) {
        list.push({
          title: language === 'id' ? 'Pengeluaran Meningkat vs Bulan Lalu' : 'Spending Increased vs Last Month',
          body: language === 'id'
            ? `Pengeluaran bulan ini ${overallDelta}% lebih tinggi dibanding periode yang sama bulan lalu.`
            : `Spending this month is ${overallDelta}% higher than the same period last month.`,
          tip: language === 'id' ? 'Tinjau kembali transaksi non-primer untuk menjaga target tabungan.' : 'Audit non-essential items to protect your savings deadline.',
          type: 'alert',
        });
      } else if (overallDelta < -10) {
        list.push({
          title: language === 'id' ? 'Disiplin Pengeluaran Sangat Baik' : 'Excellent Spending Discipline',
          body: language === 'id'
            ? `Pengeluaran Anda ${Math.abs(overallDelta)}% lebih hemat dibanding bulan lalu.`
            : `You are spending ${Math.abs(overallDelta)}% less than last month.`,
          tip: language === 'id' ? 'Pertahankan ritme ini untuk mempercepat penyelesaian target tabungan.' : 'Maintain this pace to achieve your savings goal early.',
          type: 'success',
        });
      }
    }

    // Baseline Insight if list is empty
    if (list.length === 0) {
      list.push({
        title: language === 'id' ? 'Keseimbangan Alokasi Aman' : 'Safe Spending Equilibrium',
        body: language === 'id'
          ? `Alokasi belanja harian Anda terjaga di angka ${formatCurrency(metrics.dailySafeToSpend, userProfile.currency, hideBalances)} per hari.`
          : `Your daily safe allocation is calibrated at ${formatCurrency(metrics.dailySafeToSpend, userProfile.currency, hideBalances)} per day.`,
        tip: language === 'id' ? 'Catat pengeluaran segera setelah bertransaksi menggunakan mikrofon suara.' : 'Record expenses right after purchase using the voice mic.',
        type: 'info',
      });
    }

    return list;
  }, [categoryBreakdown, totalPeriodSpend, totalLastMonthSpend, metrics, userProfile, language, hideBalances]);

  // Chart rendering coordinates
  const maxChartVal = Math.max(
    metrics.dailySafeToSpend * 1.4,
    ...chartPoints.map((p) => p.amount),
    1000
  );
  const chartWidth = 640;
  const chartHeight = 180;
  const paddingLeft = 60; // Enough space for y-axis labels
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 30;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (idx: number) =>
    paddingLeft + (idx / Math.max(1, chartPoints.length - 1)) * usableWidth;

  const getY = (val: number) =>
    chartHeight - paddingBottom - (val / maxChartVal) * usableHeight;

  const pathD = chartPoints.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.amount);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const areaD = chartPoints.length > 0
    ? `${pathD} L ${getX(chartPoints.length - 1)} ${chartHeight - paddingBottom} L ${getX(0)} ${chartHeight - paddingBottom} Z`
    : '';

  const safeLineY = getY(metrics.dailySafeToSpend);

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <h3 className="font-display text-xl font-bold text-white tracking-tight">
            {t.analytics}
          </h3>
          <p className="text-xs text-slate-300">
            {language === 'id'
              ? 'Rincian pengeluaran, perbandingan kategori, dan rekomendasi otomatis'
              : 'Reconciled spending analytics, category breakdowns, and audit trails'}
          </p>
        </div>

        {/* Timeframe Segmented Control Buttons */}
        <div className="flex items-center rounded-2xl border border-white/10 bg-[#090e11] p-1 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('day')}
            className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'day'
                ? 'bg-emerald-500 text-emerald-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.today}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('week')}
            className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'week'
                ? 'bg-emerald-500 text-emerald-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.thisWeek}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('month')}
            className={`rounded-xl px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'month'
                ? 'bg-emerald-500 text-emerald-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.thisMonth}
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Card 1: Total Spend */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {activeTab === 'day' ? t.spentToday : activeTab === 'week' ? 'Spent This Week' : 'Spent This Month'}
          </span>
          <p className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(totalPeriodSpend, userProfile.currency, hideBalances)}
          </p>
          <span className="mt-1 block text-xs text-emerald-400 font-medium">
            {filteredByTime.length} {language === 'id' ? 'transaksi' : 'transactions'}
          </span>
        </div>

        {/* Card 2: Safe Limit */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {activeTab === 'day' ? t.dailySafe : activeTab === 'week' ? t.weeklySafe : 'Monthly Safe'}
          </span>
          <p className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-emerald-300">
            {formatCurrency(
              activeTab === 'day'
                ? metrics.dailySafeToSpend
                : activeTab === 'week'
                ? metrics.weeklySafeToSpend
                : metrics.monthlyRemainingSafe,
              userProfile.currency,
              hideBalances
            )}
          </p>
          <span className="mt-1 block text-xs text-slate-400">
            {language === 'id' ? 'Batas terkalibrasi dinamis' : 'Dynamic benchmark ceiling'}
          </span>
        </div>

        {/* Card 3: Top Category */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {language === 'id' ? 'Kategori Terbesar' : 'Top Category'}
          </span>
          <p className="mt-1.5 truncate font-display text-lg sm:text-xl font-bold text-white">
            {categoryBreakdown[0]?.category || (language === 'id' ? 'Belum ada data' : 'None yet')}
          </p>
          <span className="mt-1 block text-xs text-teal-400 font-medium">
            {categoryBreakdown[0] ? `${categoryBreakdown[0].percentage}% of total` : '0%'}
          </span>
        </div>

        {/* Card 4: Month-End Forecast */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {language === 'id' ? 'Prakiraan Sisa Akhir Bulan' : 'Month-End Reserve'}
          </span>
          {hasEnoughDataForProjections ? (
            <>
              <p className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-teal-300">
                {formatCurrency(metrics.projectedMonthEndSavings, userProfile.currency, hideBalances)}
              </p>
              <span className="mt-1 block text-xs text-slate-400">
                {language === 'id' ? 'Berdasarkan kecepatan saat ini' : 'Based on current run-rate'}
              </span>
            </>
          ) : (
            <div className="mt-2 text-xs text-amber-300 flex items-center space-x-1.5">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{t.notEnoughData}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Analytics Layout: Category Donut & Comparison | Trajectory Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Category Breakdown & Comparison (lg:col-span-5) */}
        <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 lg:col-span-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
              {t.categoryDistribution}
            </h4>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {formatCurrency(totalPeriodSpend, userProfile.currency, hideBalances)}
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {categoryBreakdown.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                {language === 'id' ? 'Belum ada transaksi pada periode ini.' : 'No expenses logged for this period.'}
              </p>
            ) : (
              categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat.category}</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-300">
                        {formatCurrency(cat.amount, userProfile.currency, hideBalances)}
                      </span>
                      <span className="font-mono font-bold text-emerald-400 w-10 text-right">
                        {cat.percentage}%
                      </span>
                      {/* Comparison vs last month arrow */}
                      {cat.deltaPct !== 0 && (
                        <span
                          className={`inline-flex items-center text-[10px] font-mono font-bold ${
                            cat.deltaPct > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                          title={`${Math.abs(cat.deltaPct)}% ${cat.deltaPct > 0 ? t.higher : t.lower} ${t.vsLastMonth}`}
                        >
                          {cat.deltaPct > 0 ? (
                            <TrendingUp className="h-3 w-3 mr-0.5" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-0.5" />
                          )}
                          {Math.abs(cat.deltaPct)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Trajectory SVG Chart (lg:col-span-7) */}
        <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-6 lg:col-span-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/5">
            <div>
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                {t.spendingTrajectory}
              </h4>
              <p className="text-xs text-slate-400">
                {language === 'id'
                  ? 'Garis hijau menunjukkan pengeluaran aktual; garis putus emas adalah batas aman harian'
                  : 'Emerald line shows daily spend; dashed gold line represents safe daily target'}
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>{language === 'id' ? 'Aktual' : 'Actual'}</span>
              </span>
              <span className="flex items-center space-x-1.5 text-amber-300">
                <span className="h-0.5 w-3.5 bg-amber-400 border-dashed" />
                <span>{language === 'id' ? 'Batas Aman' : 'Safe Limit'}</span>
              </span>
            </div>
          </div>

          {/* SVG Canvas with Y-Axis and Tooltips */}
          <div className="relative mt-4 flex items-center justify-center overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto max-h-56 overflow-visible"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis Value Labels & Guidelines */}
              {[1, 0.5, 0].map((ratio) => {
                const y = chartHeight - paddingBottom - ratio * usableHeight;
                const val = Math.round(maxChartVal * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={chartWidth - paddingRight}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.07)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      {formatCompactCurrency(val, userProfile.currency, hideBalances)}
                    </text>
                  </g>
                );
              })}

              {/* Safe Daily Limit Line */}
              {metrics.dailySafeToSpend > 0 && safeLineY >= paddingTop && safeLineY <= chartHeight - paddingBottom && (
                <g>
                  <line
                    x1={paddingLeft}
                    y1={safeLineY}
                    x2={chartWidth - paddingRight}
                    y2={safeLineY}
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    strokeDasharray="5 5"
                    opacity="0.85"
                  />
                  <text
                    x={chartWidth - paddingRight}
                    y={safeLineY - 4}
                    textAnchor="end"
                    fill="#fbbf24"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    Safe Limit
                  </text>
                </g>
              )}

              {/* Shaded Area Fill */}
              {areaD && <path d={areaD} fill="url(#areaGradient)" />}

              {/* Trend Stroke Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points */}
              {chartPoints.map((pt, idx) => {
                const cx = getX(idx);
                const cy = getY(pt.amount);
                return (
                  <g key={pt.dateStr} className="cursor-pointer group">
                    <circle
                      cx={cx}
                      cy={cy}
                      r="4"
                      className="fill-[#080d0f] stroke-emerald-400 stroke-2 transition-transform duration-200 group-hover:scale-150"
                      onMouseEnter={() => setHoveredDataPoint({ label: pt.label, amount: pt.amount, x: cx, y: cy })}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    />
                    {/* Show only every few labels if there are many days to prevent clipping */}
                    {(chartPoints.length <= 14 || idx % 2 === 0 || idx === chartPoints.length - 1) && (
                      <text
                        x={cx}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {pt.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredDataPoint && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl border border-emerald-500/30 bg-[#080d0f] px-3 py-1.5 text-xs shadow-xl"
                style={{
                  left: `${(hoveredDataPoint.x / chartWidth) * 100}%`,
                  top: `${(hoveredDataPoint.y / chartHeight) * 100}%`,
                }}
              >
                <p className="text-[10px] text-slate-400">{hoveredDataPoint.label}</p>
                <p className="font-mono font-bold text-emerald-300">
                  {formatCurrency(hoveredDataPoint.amount, userProfile.currency, hideBalances)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Smart Insights Cards with Suggested Actions */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <h4 className="font-display text-base font-bold text-white">
            {t.aiInsights}
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dynamicAIInsights.map((ins, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-5 backdrop-blur-sm space-y-3 ${
                ins.type === 'alert'
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : ins.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center space-x-2">
                {ins.type === 'alert' ? (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                ) : ins.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Lightbulb className="h-4 w-4 text-emerald-400" />
                )}
                <h5 className="font-semibold text-sm text-white">{ins.title}</h5>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{ins.body}</p>

              <div className="pt-2 border-t border-white/5 flex items-start space-x-2 text-xs text-emerald-400">
                <span className="font-bold">Aksi:</span>
                <span className="text-slate-300">{ins.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
