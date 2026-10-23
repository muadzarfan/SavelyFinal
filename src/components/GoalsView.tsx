import React, { useState } from 'react';
import {
  Target,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Award,
  Shield,
  Plane,
  Home,
  Car,
  Heart,
  Briefcase,
  X,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsGoal, UserProfile } from '../types';
import {
  formatCurrency,
  formatCompactCurrency,
  formatHumanDate,
  formatRemainingTime,
  formatNominal,
  parseNominal,
} from '../lib/currencies';
import { translations, Language } from '../lib/i18n';

interface GoalsViewProps {
  userProfile: UserProfile;
  language: Language;
  hideBalances: boolean;
  onUpdateGoals: (goals: SavingsGoal[]) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  userProfile,
  language,
  hideBalances,
  onUpdateGoals,
}) => {
  const [goals, setGoals] = useState<SavingsGoal[]>(() => {
    if (userProfile.goals && userProfile.goals.length > 0) {
      return userProfile.goals;
    }
    return [userProfile.savingsGoal];
  });

  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contributionModalGoal, setContributionModalGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmountStr, setContributionAmountStr] = useState('');

  const t = translations[language];
  const currency = userProfile.currency || 'IDR';

  const handleOpenCreate = () => {
    const nextYear = new Date().getFullYear() + 1;
    setEditingGoal({
      id: `goal_${Date.now()}`,
      title: '',
      targetAmount: 10000000,
      currentSaved: 0,
      deadlineDate: `${nextYear}-12-31`,
      monthlyTargetContribution: 1000000,
      category: 'General',
      priority: 'medium',
      icon: 'Target',
      color: '#10b981',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setEditingGoal({ ...goal });
    setIsModalOpen(true);
  };

  const handleDeleteGoal = (id: string) => {
    if (goals.length <= 1) {
      alert(language === 'id' ? 'Minimal harus memiliki 1 target tabungan.' : 'You must have at least 1 savings goal.');
      return;
    }
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    onUpdateGoals(updated);
  };

  const handleSaveGoal = (goalToSave: SavingsGoal) => {
    if (!goalToSave.title.trim() || goalToSave.targetAmount <= 0) return;

    let updated: SavingsGoal[];
    const exists = goals.some((g) => g.id === goalToSave.id);
    if (exists) {
      updated = goals.map((g) => (g.id === goalToSave.id ? goalToSave : g));
    } else {
      updated = [...goals, goalToSave];
    }

    setGoals(updated);
    onUpdateGoals(updated);
    setIsModalOpen(false);
    setEditingGoal(null);

    // Milestone celebration
    const progress = Math.round((goalToSave.currentSaved / goalToSave.targetAmount) * 100);
    if (progress >= 25) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#059669', '#38bdf8'],
      });
    }
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionModalGoal) return;
    const addAmt = parseNominal(contributionAmountStr);
    if (addAmt <= 0) return;

    const oldProgress = Math.round((contributionModalGoal.currentSaved / contributionModalGoal.targetAmount) * 100);
    const newSaved = contributionModalGoal.currentSaved + addAmt;
    const newProgress = Math.round((newSaved / contributionModalGoal.targetAmount) * 100);

    const updatedGoal = {
      ...contributionModalGoal,
      currentSaved: newSaved,
    };

    const updated = goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g));
    setGoals(updated);
    onUpdateGoals(updated);

    // Celebration check for milestone cross
    const milestones = [25, 50, 75, 100];
    const crossedMilestone = milestones.find((m) => oldProgress < m && newProgress >= m);
    if (crossedMilestone) {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#fbbf24', '#f43f5e'],
      });
    }

    setContributionModalGoal(null);
    setContributionAmountStr('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t.goals}
          </h2>
          <p className="text-xs text-slate-300">
            {language === 'id'
              ? 'Rencanakan dan pantau berbagai target tabungan dengan setoran otomatis dan estimasi tanggal penyelesaian'
              : 'Track multiple milestones, auto-calculate monthly contributions, and celebrate targets'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-2.5 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>{t.addGoal}</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round(((goal.currentSaved || 0) / Math.max(1, goal.targetAmount)) * 100));
          const isComplete = progress >= 100;

          return (
            <div
              key={goal.id}
              className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 backdrop-blur-sm space-y-5 flex flex-col justify-between hover:border-emerald-500/30 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                      style={{
                        backgroundColor: `${goal.color || '#10b981'}20`,
                        borderColor: `${goal.color || '#10b981'}40`,
                        color: goal.color || '#10b981',
                      }}
                    >
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-white truncate max-w-[200px]">
                        {goal.title}
                      </h3>
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">
                        {goal.category || 'Milestone'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(goal)}
                      className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                      title={t.edit}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    {goals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="rounded-lg p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar and metrics */}
                <div className="mt-5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-2xl font-extrabold text-white">
                      {progress}%
                    </span>
                    <div className="text-right text-xs">
                      <span className="font-mono font-bold text-emerald-400">
                        {formatCurrency(goal.currentSaved, currency, hideBalances)}
                      </span>
                      <span className="text-slate-400"> / </span>
                      <span className="font-mono text-slate-300">
                        {formatCurrency(goal.targetAmount, currency, hideBalances)}
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/80 border border-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>
                      {language === 'id' ? 'Sisa Dana' : 'Remaining'}: {formatCurrency(Math.max(0, goal.targetAmount - goal.currentSaved), currency, hideBalances)}
                    </span>
                    <span>
                      {formatRemainingTime(goal.deadlineDate, language)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Goal Footer Details & Contribute Action */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    {t.monthlyContribution}
                  </span>
                  <span className="font-mono font-bold text-teal-300">
                    +{formatCurrency(goal.monthlyTargetContribution, currency, hideBalances)}/mo
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setContributionModalGoal(goal);
                    setContributionAmountStr('');
                  }}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{language === 'id' ? 'Setor Dana' : 'Fund Goal'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Goal Edit / Create Modal */}
      {isModalOpen && editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-emerald-500/25 bg-[#0b1013] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h3 className="font-display text-base font-bold text-white">
                {editingGoal.id.startsWith('goal_') && !goals.some((g) => g.id === editingGoal.id)
                  ? t.addGoal
                  : t.editGoal}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveGoal(editingGoal);
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="text-xs text-slate-400 font-medium">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dana Darurat / Japan Trip"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">{t.targetAmount} ({currency})</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNominal(editingGoal.targetAmount)}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, targetAmount: parseNominal(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium">{t.currentlySaved}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNominal(editingGoal.currentSaved)}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, currentSaved: parseNominal(e.target.value) })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">{t.targetDeadline}</label>
                  <input
                    type="date"
                    value={editingGoal.deadlineDate}
                    onChange={(e) =>
                      setEditingGoal({ ...editingGoal, deadlineDate: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium">{t.monthlyContribution}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNominal(editingGoal.monthlyTargetContribution)}
                    onChange={(e) =>
                      setEditingGoal({
                        ...editingGoal,
                        monthlyTargetContribution: parseNominal(e.target.value),
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono font-bold text-teal-300 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 hover:bg-white/[0.08]"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110"
                >
                  <Check className="h-4 w-4" />
                  <span>{t.save}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fund / Contribute Modal */}
      {contributionModalGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-emerald-500/25 bg-[#0b1013] p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <h3 className="font-display text-base font-bold text-white">
                {language === 'id' ? `Setor ke ${contributionModalGoal.title}` : `Contribute to ${contributionModalGoal.title}`}
              </h3>
              <button
                onClick={() => setContributionModalGoal(null)}
                className="rounded-xl p-1 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">
                  {language === 'id' ? 'Nominal Setoran' : 'Contribution Amount'} ({currency})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 1,000,000"
                  value={contributionAmountStr}
                  onChange={(e) => setContributionAmountStr(formatNominal(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-base font-mono font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setContributionModalGoal(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110"
                >
                  <Check className="h-4 w-4" />
                  <span>{language === 'id' ? 'Konfirmasi Setoran' : 'Confirm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
