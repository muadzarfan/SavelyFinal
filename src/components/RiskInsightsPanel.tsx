import React, { useState } from 'react';
import {
  AlertTriangle,
  Sparkles,
  Flame,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Lightbulb,
  ShieldCheck,
  Calendar,
  Wallet,
} from 'lucide-react';
import { RiskInsight, UserProfile, FinancialHealthMetrics } from '../types';
import { formatCurrency } from '../lib/currencies';
import { Language } from '../lib/i18n';

interface RiskInsightsPanelProps {
  insights: RiskInsight[];
  userProfile: UserProfile;
  metrics: FinancialHealthMetrics;
  language?: Language;
  onOpenDeepScenario: () => void;
}

export const RiskInsightsPanel: React.FC<RiskInsightsPanelProps> = ({
  insights,
  userProfile,
  metrics,
  language = 'id',
  onOpenDeepScenario,
}) => {
  const [showSecondaryInsights, setShowSecondaryInsights] = useState(false);
  const goalTitle = userProfile.savingsGoal?.title || (language === 'id' ? 'Target Tabungan' : 'Savings Goal');
  const currency = userProfile.currency || 'IDR';
  const isId = language === 'id';

  // Primary High-Value Insight is the top element
  const primaryInsight = insights[0] || {
    id: 'baseline_insight',
    type: 'milestone',
    severity: 'info',
    title: isId ? 'Kondisi Keuangan Kamu Aman & Terkendali' : 'Spending is Safe & On Track',
    observation: isId
      ? 'Belanjaanmu sejauh ini masih aman dan tidak mengganggu tabungan.'
      : 'No unusual spending spikes detected.',
    message: isId
      ? `Kamu aman belanja santai sampai ${formatCurrency(metrics.dailySafeToSpend, currency)} per hari tanpa perlu merasa bersalah, karena target '${goalTitle}' tetap terjaga.`
      : `You can comfortably spend up to ${formatCurrency(metrics.dailySafeToSpend, currency)} per day while keeping '${goalTitle}' safe.`,
    evidence: isId
      ? `Sisa uang belanja bebas: ${formatCurrency(metrics.monthlyRemainingSafe, currency)} untuk ${metrics.daysRemainingInMonth} hari ke depan`
      : `Remaining allowance: ${formatCurrency(metrics.monthlyRemainingSafe, currency)} across ${metrics.daysRemainingInMonth} days`,
    actionableTip: isId
      ? 'Strategi AI: Kuncinya simpel: biasakan langsung rekam suara 2 detik di Savely tiap habis bayar sesuatu, supaya jatah harianmu selalu akurat dan gak ada pengeluaran gaib yang kelupaan!'
      : 'AI Strategy: Keep it effortless: log purchases by voice for 2 seconds right after spending, so your daily safe limit stays 100% accurate without surprises!',
    timestamp: new Date().toISOString(),
  };

  const secondaryInsights = insights.slice(1);

  const isAlert = primaryInsight.severity === 'alert';
  const isWarning = primaryInsight.severity === 'warning';
  const isSuccess = primaryInsight.severity === 'success';

  // Clean takeaway text without repetitive prefix
  const cleanStrategyText = primaryInsight.actionableTip
    .replace(/^Strategi AI:\s*/i, '')
    .replace(/^AI Strategy:\s*/i, '');

  return (
    <section className="rounded-3xl border border-emerald-900/30 bg-gradient-to-b from-[#0c1417] via-[#091012] to-[#070b0d] p-6 sm:p-8 shadow-2xl">
      {/* Header with Deep Scenario Strategy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                {isId ? '💡 Arahan Harian dari AI' : '💡 Daily AI Guidance'}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">
                {isId ? 'Strategi Dompet Aman' : 'Smart Wallet Strategy'}
              </span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
              {isId ? 'Apa yang Perlu Kamu Lakukan Hari Ini?' : 'Financial Guidance & Daily Strategy'}
            </h3>
          </div>
        </div>

        <button
          id="trigger-deep-scenario-btn"
          type="button"
          onClick={onOpenDeepScenario}
          className="group inline-flex items-center space-x-2 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all"
        >
          <BrainCircuit className="h-4 w-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>{isId ? 'Simulasi Rencana Penghematan' : 'Scenario Simulation'}</span>
          <ArrowRight className="h-3.5 w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 1 Dominant High-Impact Insight Card: Easy to Understand & Actionable */}
      <div className="mt-6">
        <div
          className={`rounded-3xl border p-6 sm:p-7 backdrop-blur-md transition-all ${
            isAlert
              ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/30 via-[#120a0d] to-[#0a0d10]'
              : isWarning
              ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-[#130f0a] to-[#0a0d10]'
              : isSuccess
              ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-[#0a1210] to-[#080d10]'
              : 'border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-[#091113] to-[#080d10]'
          }`}
        >
          {/* Header Row: Status Badge & Target Impact Tag */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  isAlert
                    ? 'bg-rose-500/20 text-rose-400'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-400'
                    : isSuccess
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-teal-500/20 text-teal-400'
                }`}
              >
                {isAlert && <Flame className="h-4 w-4" />}
                {isWarning && <AlertTriangle className="h-4 w-4" />}
                {isSuccess && <CheckCircle2 className="h-4 w-4" />}
                {!isAlert && !isWarning && !isSuccess && <Sparkles className="h-4 w-4" />}
              </div>

              <div>
                <span className="font-display text-base sm:text-lg font-bold text-white block">
                  {primaryInsight.title}
                </span>
              </div>
            </div>

            {primaryInsight.impactDays !== undefined ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  primaryInsight.impactDays > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {primaryInsight.impactDays > 0
                  ? isId
                    ? `⚠️ Target '${goalTitle}' Terancam Mundur ${primaryInsight.impactDays} Hari`
                    : `⚠️ '${goalTitle}' Delayed by ${primaryInsight.impactDays} Days`
                  : isId
                  ? `🚀 Target '${goalTitle}' 8 Hari Lebih Cepat!`
                  : `🚀 8 Days Ahead of Schedule!`}
              </span>
            ) : (
              <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {isId ? `🎯 Target '${goalTitle}' Aman` : `🎯 '${goalTitle}' Protected`}
              </span>
            )}
          </div>

          {/* Simple, Plain Language Explanation of Current Situation */}
          <div className="space-y-2 mt-2">
            {primaryInsight.observation && (
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                {primaryInsight.observation}
              </p>
            )}

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {primaryInsight.message}
            </p>
          </div>

          {/* HIGHLIGHTED INTI STRATEGI AI BOX: Direct, Friendly, High Clarity */}
          <div className="mt-5 rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-emerald-950/30 p-4 sm:p-5 shadow-lg">
            <div className="flex items-start space-x-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/25 text-emerald-300 border border-emerald-400/30 mt-0.5">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 block">
                  {isId ? '🎯 Inti Strategi & Solusi dari AI:' : '🎯 AI Practical Strategy & Action:'}
                </span>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-semibold">
                  {cleanStrategyText}
                </p>
              </div>
            </div>

            {/* 3 Quick Takeaway Indicators in Plain Language */}
            <div className="mt-4 pt-3.5 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center space-x-2 bg-emerald-950/30 rounded-xl px-3 py-2 border border-emerald-500/15">
                <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    {isId ? 'Batas Belanja Hari Ini' : 'Today Safe Limit'}
                  </span>
                  <span className="font-mono font-bold text-white text-xs truncate block">
                    {formatCurrency(metrics.dailySafeToSpend, currency)}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-emerald-950/30 rounded-xl px-3 py-2 border border-emerald-500/15">
                <Calendar className="h-4 w-4 text-teal-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    {isId ? 'Sisa Waktu Bulan Ini' : 'Days Remaining'}
                  </span>
                  <span className="font-mono font-bold text-white text-xs block">
                    {metrics.daysRemainingInMonth} {isId ? 'Hari Lagi' : 'Days Left'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-emerald-950/30 rounded-xl px-3 py-2 border border-emerald-500/15">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">
                    {isId ? 'Status Target Tabungan' : 'Goal Security'}
                  </span>
                  <span className="font-bold text-emerald-300 text-xs truncate block">
                    {isAlert
                      ? isId ? 'Terancam Berkurang' : 'At Risk'
                      : isWarning
                      ? isId ? 'Perlu Hati-hati' : 'Needs Caution'
                      : isId ? 'Aman & Terjaga' : 'Protected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Insights Expandable Drawer (if any) */}
      {secondaryInsights.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowSecondaryInsights(!showSecondaryInsights)}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-emerald-300 transition-colors py-1"
          >
            <span>
              {showSecondaryInsights
                ? isId ? 'Sembunyikan' : 'Hide'
                : isId ? 'Lihat' : 'Show'}{' '}
              {secondaryInsights.length} {isId ? 'Saran Tambahan Lainnya' : 'Other Insights'}
            </span>
            {showSecondaryInsights ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showSecondaryInsights && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {secondaryInsights.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs space-y-2 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{sec.title}</span>
                    {sec.impactDays && (
                      <span className="font-mono text-[10px] text-slate-400">
                        {sec.impactDays > 0 ? `+${sec.impactDays}d` : `${sec.impactDays}d`}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed">{sec.message}</p>
                  <div className="pt-2 border-t border-white/5 flex items-start space-x-2 text-emerald-300 font-medium">
                    <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{sec.actionableTip}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
