import React from 'react';
import { X, Calculator, HelpCircle, CheckCircle, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { UserProfile, FinancialHealthMetrics } from '../types';
import { formatCurrency } from '../lib/currencies';

interface CalculationInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  metrics: FinancialHealthMetrics;
}

export const CalculationInspectorModal: React.FC<CalculationInspectorModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  metrics,
}) => {
  if (!isOpen) return null;

  const { breakdown } = metrics;
  const currency = userProfile.currency || 'IDR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-[#0c1417] p-6 sm:p-7 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-white">
                How Daily Safe-to-Spend is Calculated
              </h3>
              <p className="text-xs text-slate-400">
                Deterministic mathematical audit for {userProfile.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5 text-xs">
          {/* Summary Box */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              Mathematical Formula
            </span>
            <p className="mt-1 font-mono text-xs text-slate-200 leading-relaxed">
              Daily Safe = max(0, Discretionary Budget - Month Spend) ÷ Days Remaining
            </p>
          </div>

          {/* Line-item Reconciliation Table */}
          <div className="space-y-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            <div className="flex justify-between items-center py-1 border-b border-white/5 text-slate-300">
              <span className="font-medium">1. Monthly Take-Home Income</span>
              <span className="font-mono font-semibold text-emerald-400">
                +{formatCurrency(breakdown.monthlyIncome, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-white/5 text-slate-300">
              <div>
                <span className="font-medium">2. Fixed Recurring Bills</span>
                <span className="block text-[10px] text-slate-400">
                  {userProfile.fixedBills?.length || 0} essential bills reserved
                </span>
              </div>
              <span className="font-mono font-semibold text-rose-400">
                -{formatCurrency(breakdown.totalFixedBills, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-white/5 text-slate-300">
              <div>
                <span className="font-medium">3. Planned Savings Contribution</span>
                <span className="block text-[10px] text-slate-400">
                  Reserved for '{userProfile.savingsGoal?.title || 'Goal'}'
                </span>
              </div>
              <span className="font-mono font-semibold text-teal-400">
                -{formatCurrency(breakdown.monthlySavingsTarget, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-white/10 bg-white/[0.03] px-2 rounded-lg text-white">
              <span className="font-semibold">Discretionary Allocation</span>
              <span className="font-mono font-bold text-white">
                ={formatCurrency(breakdown.discretionaryAllocation, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-white/5 text-slate-300">
              <div>
                <span className="font-medium">4. Discretionary Spent This Month</span>
                <span className="block text-[10px] text-slate-400">
                  Actual recorded transactions
                </span>
              </div>
              <span className="font-mono font-semibold text-amber-400">
                -{formatCurrency(breakdown.discretionarySpentThisMonth, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-white/10 bg-emerald-950/30 px-2 rounded-lg text-emerald-300">
              <span className="font-semibold">Remaining Discretionary Pool</span>
              <span className="font-mono font-bold">
                ={formatCurrency(breakdown.remainingDiscretionaryBudget, currency)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 text-slate-300">
              <span className="font-medium">5. Spending Days Remaining (inc. today)</span>
              <span className="font-mono font-semibold text-slate-200">
                ÷ {breakdown.daysRemainingInMonth} days
              </span>
            </div>
          </div>

          {/* Today's Breakdown */}
          <div className="rounded-2xl border border-white/10 bg-[#090f12] p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Daily Safe Allowance</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {formatCurrency(breakdown.dailySafeToSpend, currency)} / day
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-400">
              <span>Discretionary Spent Today</span>
              <span className="font-mono font-semibold text-rose-300">
                -{formatCurrency(breakdown.spentToday, currency)}
              </span>
            </div>

            <div className="pt-2 border-t border-white/5 flex justify-between items-center">
              <span className="text-white font-semibold">Remaining Safe Today</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">
                {formatCurrency(breakdown.remainingToday, currency)}
              </span>
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="flex items-start space-x-2 text-[11px] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              Zero floating-point rounding errors. Integer calculation preserves exact single-rupiah accuracy. Every expense logged via voice or manual entry updates this figure in real time.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110 transition-all"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
