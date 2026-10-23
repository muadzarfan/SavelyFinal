import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  X,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import {
  UserProfile,
  FinancialHealthMetrics,
  ExpenseRecord,
  DeepScenarioAnalysis,
} from '../types';
import { formatCurrency, formatCompactCurrency } from '../lib/currencies';

interface DeepScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  metrics: FinancialHealthMetrics;
  expenses: ExpenseRecord[];
}

const PRESET_QUERIES = [
  'Evaluate lifestyle creep in dining & coffee over the past month and impact on my target date',
  'What if I cut dining out by 30% and eliminate unused subscriptions?',
  'Can I afford an unexpected $500 travel expense next month without missing my deadline?',
  'Show me the fastest path to accelerate my savings goal by 45 days',
];

export const DeepScenarioModal: React.FC<DeepScenarioModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  metrics,
  expenses,
}) => {
  const [query, setQuery] = useState(PRESET_QUERIES[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DeepScenarioAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runScenario = async (promptQuery = query) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/analyze-finances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          currentMetrics: metrics,
          expenses: expenses.slice(0, 25),
          complexQuery: promptQuery,
        }),
      });

      if (!res.ok) {
        throw new Error('Analysis request failed');
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      console.error('Scenario run error:', err);
      setErrorMessage(err.message || 'Error running scenario analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0e1619] via-[#090f11] to-[#070b0d] p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.2)]">
        {/* Header with High Thinking Badge */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <BrainCircuit className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                  Strategic Thinking Advisor
                </h2>
                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                  Thinking Mode: HIGH
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Powered by Gemini 3.1 Pro reasoning engine for deep financial trajectory modeling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Query Input Section */}
        <div className="mt-6 space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Complex Financial Query or What-If Simulation:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Can I afford a $600 holiday next month without delaying my goal?"
              className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              id="submit-deep-scenario-btn"
              type="button"
              disabled={isLoading || !query.trim()}
              onClick={() => runScenario()}
              className="shrink-0 inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-5 py-3 text-xs font-bold text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Thinking Deeply...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Execute Simulation</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Prompts */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESET_QUERIES.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(preset);
                  runScenario(preset);
                }}
                className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-300 hover:border-emerald-500/30 hover:text-emerald-300 transition-colors text-left"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {errorMessage}
          </div>
        )}

        {/* Loading Skeleton during reasoning */}
        {isLoading && (
          <div className="my-8 flex flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-8 text-center space-y-3">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BrainCircuit className="h-7 w-7 animate-spin" />
            </div>
            <p className="font-display font-semibold text-sm text-white">
              Gemini 3.1 Pro Reasoning Engine is Modeling Trajectories...
            </p>
            <p className="text-xs text-slate-400 max-w-md">
              Evaluating multi-month cashflow velocity, fixed obligations, lifestyle creep patterns, and goal delay calculations.
            </p>
          </div>
        )}

        {/* Simulation Output */}
        {analysisResult && !isLoading && (
          <div className="mt-8 space-y-6">
            {/* Top Verdict & Trajectory Card */}
            <div
              className={`rounded-2xl border p-5 ${
                analysisResult.goalDelayOrAdvanceDays > 0
                  ? 'border-amber-500/30 bg-amber-950/15'
                  : 'border-emerald-500/30 bg-emerald-950/15'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  {analysisResult.goalDelayOrAdvanceDays > 0 ? (
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                  <span className="font-display text-sm font-bold uppercase tracking-wider text-white">
                    Strategic Trajectory Impact
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-mono font-bold ${
                    analysisResult.goalDelayOrAdvanceDays > 0
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {analysisResult.goalDelayOrAdvanceDays > 0
                    ? `Postpones Goal by ${analysisResult.goalDelayOrAdvanceDays} Days`
                    : `Accelerates Goal by ${Math.abs(analysisResult.goalDelayOrAdvanceDays)} Days`}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-white font-medium">
                {analysisResult.assessment}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs">
                <div>
                  <span className="text-slate-400">Revised Completion Date:</span>
                  <p className="font-mono font-bold text-white mt-0.5">
                    {analysisResult.revisedCompletionDate}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Monthly Savings Pace:</span>
                  <p className="font-mono font-bold text-emerald-300 mt-0.5">
                    {formatCurrency(analysisResult.monthlySavingsPace, userProfile.currency)} / mo
                  </p>
                </div>
              </div>
            </div>

            {/* Key Drivers & Concrete Tactics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Drivers */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Identified Lifestyle Drivers
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(analysisResult.keyLifestyleDrivers || []).map((driver, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Concrete Tactics */}
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3">
                  Target Recovery Levers
                </h4>
                <ul className="space-y-2 text-xs text-slate-200">
                  {(analysisResult.concreteTactics || []).map((tactic, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{tactic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Scenario Simulations */}
            {analysisResult.scenarioSimulations && analysisResult.scenarioSimulations.length > 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3">
                  Modeled Scenario Simulations
                </h4>
                <div className="space-y-2.5">
                  {analysisResult.scenarioSimulations.map((sim, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">{sim.scenario}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{sim.impactDescription}</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                        +{formatCurrency(sim.savingsDelta, userProfile.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
