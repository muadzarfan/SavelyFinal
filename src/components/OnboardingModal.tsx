import React, { useState } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  Check,
  Target,
  DollarSign,
  Mic,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { UserProfile, SavingsGoal, CurrencyCode } from '../types';
import { formatCurrency, formatNominal, parseNominal } from '../lib/currencies';
import { translations, Language } from '../lib/i18n';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  language: Language;
  onSaveProfile: (profile: UserProfile) => void;
  onOpenVoiceTest?: () => void;
  isInitialOnboarding?: boolean;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  language,
  onSaveProfile,
  onOpenVoiceTest,
  isInitialOnboarding = false,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(currentProfile.name || 'Member');
  const [currency, setCurrency] = useState<CurrencyCode>(currentProfile.currency || 'IDR');
  const [monthlyIncomeStr, setMonthlyIncomeStr] = useState<string>(
    formatNominal(currentProfile.monthlyIncome || 15000000)
  );

  // Goal
  const [goalTitle, setGoalTitle] = useState(currentProfile.savingsGoal?.title || 'Dana Darurat');
  const [goalTargetStr, setGoalTargetStr] = useState<string>(
    formatNominal(currentProfile.savingsGoal?.targetAmount || 50000000)
  );
  const [goalContributionStr, setGoalContributionStr] = useState<string>(
    formatNominal(currentProfile.savingsGoal?.monthlyTargetContribution || 2500000)
  );

  const t = translations[language];

  if (!isOpen) return null;

  const numericMonthlyIncome = parseNominal(monthlyIncomeStr);
  const numericGoalTarget = parseNominal(goalTargetStr);
  const numericGoalContribution = parseNominal(goalContributionStr);

  const handleFinish = () => {
    const nextYear = new Date().getFullYear() + 1;
    const baseGoal: SavingsGoal = {
      id: currentProfile.savingsGoal?.id || 'goal_1',
      title: goalTitle.trim() || 'Emergency Reserve',
      targetAmount: numericGoalTarget,
      currentSaved: currentProfile.savingsGoal?.currentSaved || 0,
      deadlineDate: currentProfile.savingsGoal?.deadlineDate || `${nextYear}-12-31`,
      monthlyTargetContribution: numericGoalContribution,
      category: 'Milestone',
      priority: 'high',
      color: '#10b981',
    };

    const updated: UserProfile = {
      ...currentProfile,
      name: name.trim() || 'Savely User',
      currency,
      monthlyIncome: numericMonthlyIncome,
      savingsGoal: baseGoal,
      goals: currentProfile.goals?.length ? currentProfile.goals : [baseGoal],
      onboarded: true,
    };

    onSaveProfile(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0e1619] via-[#090f11] to-[#070b0d] p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.2)]">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-emerald-500 text-emerald-950 font-extrabold shadow-md'
                    : step > s
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-white/5 text-slate-500'
                }`}
              >
                {step > s ? <Check className="h-3.5 w-3.5" /> : s}
              </div>
            ))}
            <span className="text-xs text-slate-400 font-medium ml-2">
              Step {step} of 3
            </span>
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
            Savely Setup
          </span>
        </div>

        {/* Step 1: Set Monthly Income */}
        {step === 1 && (
          <div className="mt-6 space-y-5">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                {language === 'id' ? 'Berapa Penghasilan Bulanan Anda?' : 'What is your monthly income?'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {language === 'id'
                  ? 'Ini menjadi fondasi perhitungan batas belanja aman harian (Safe-to-Spend).'
                  : 'This calibrates your daily discretionary safe-to-spend allowance.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">
                  {language === 'id' ? 'Nama Panggilan' : 'Your Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">
                  {t.monthlyIncome} ({currency})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={monthlyIncomeStr}
                  onChange={(e) => setMonthlyIncomeStr(formatNominal(e.target.value))}
                  placeholder="e.g. 15,000,000"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-lg font-mono font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-2.5 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110"
              >
                <span>{language === 'id' ? 'Lanjut ke Target Tabungan' : 'Next: Savings Goal'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Set Savings Goal */}
        {step === 2 && (
          <div className="mt-6 space-y-5">
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                {language === 'id' ? 'Tentukan Target Tabungan Utama' : 'Set your primary savings goal'}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {language === 'id'
                  ? 'Savely akan secara otomatis menyisihkan setoran bulanan agar target tercapai tepat waktu.'
                  : 'Savely automatically protects your monthly savings allocation from being overspent.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-medium">
                  {language === 'id' ? 'Nama Target' : 'Goal Name'}
                </label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Dana Darurat / Japan Trip"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">{t.targetAmount}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={goalTargetStr}
                    onChange={(e) => setGoalTargetStr(formatNominal(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono font-bold text-white focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">{t.monthlyContribution}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={goalContributionStr}
                    onChange={(e) => setGoalContributionStr(formatNominal(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono font-bold text-teal-300 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-2.5 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110"
              >
                <span>{language === 'id' ? 'Lanjut: Coba Suara' : 'Next: Try Voice'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Try a Voice Expense */}
        {step === 3 && (
          <div className="mt-6 space-y-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto">
              <Mic className="h-7 w-7" />
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-white">
                {language === 'id' ? 'Siap Mencoba Suara' : 'Try Logging by Voice'}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                {language === 'id'
                  ? 'Ucapkan pengeluaran harian Anda dengan bahasa sehari-hari. Savely akan langsung menghitung sisa aman belanja hari ini.'
                  : 'Speak naturally in Indonesian slang or English. Savely instantly recalculates your safe-to-spend allowance.'}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-xs font-mono text-emerald-300 text-left space-y-1">
              <p>💡 {language === 'id' ? 'Contoh kalimat:' : 'Example speech:'}</p>
              <p className="text-white">"20 ribu buat mie ayam terus 50 ribu buat ongkos ojek"</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => {
                  handleFinish();
                  if (onOpenVoiceTest) onOpenVoiceTest();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3 text-xs font-bold text-emerald-950 shadow-lg shadow-emerald-500/30 hover:brightness-110"
              >
                <Mic className="h-4 w-4" />
                <span>{language === 'id' ? 'Selesai & Buka Rekam Suara' : 'Finish & Open Voice Recorder'}</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 hover:text-white"
              >
                {language === 'id' ? 'Masuk ke Dashboard' : 'Enter Dashboard'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
