import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  DollarSign,
  Plus,
  Trash2,
  Check,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Flame,
  Shield,
  Moon,
  Sun,
  Globe,
  Coins,
  AlertTriangle,
  Smartphone,
  PieChart,
  Calendar,
  Save,
  RotateCcw,
  Edit2,
  CheckCircle2,
  Clock,
  History,
  X,
  Zap,
} from 'lucide-react';
import {
  UserProfile,
  FixedBill,
  CategoryBudget,
  ExpenseCategory,
  CurrencyCode,
  PaydayScheduleType,
  PaydayConfig,
  IncomeSource,
  FinancialPeriodType,
} from '../types';
import {
  formatCurrency,
  formatNominal,
  parseNominal,
  formatHumanDate,
} from '../lib/currencies';
import { translations, Language } from '../lib/i18n';
import { calculateNextPayday } from '../lib/payday';

interface SettingsViewProps {
  userProfile: UserProfile;
  language: Language;
  theme: 'dark' | 'light';
  hideBalances: boolean;
  onLanguageChange: (lang: Language) => void;
  onCurrencyChange: (code: CurrencyCode) => void;
  onToggleTheme: () => void;
  onToggleHideBalances: () => void;
  onSaveProfile: (profile: UserProfile) => void;
  onOpenCatchUpModal?: () => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Food & Beverage',
  'Transit & Commute',
  'Utilities & Bills',
  'Shopping & Lifestyle',
  'Groceries',
  'Housing',
  'Entertainment & Leisure',
  'Health & Wellness',
  'Personal Care',
  'Education & Work',
  'Other',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  userProfile,
  language,
  theme,
  hideBalances,
  onLanguageChange,
  onCurrencyChange,
  onToggleTheme,
  onToggleHideBalances,
  onSaveProfile,
  onOpenCatchUpModal,
}) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const isId = language === 'id';
  const currency = profile.currency || 'IDR';
  const t = translations[language];

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync profile if userProfile prop changes externally
  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ----------------------------------------------------
  // ISSUE 1: Fixed Monthly Expenses State & Logic
  // ----------------------------------------------------
  const [fixedBillsList, setFixedBillsList] = useState<FixedBill[]>(
    userProfile.fixedBills?.map((b) => ({ ...b, active: b.active !== false })) || []
  );
  const [hasUnsavedBills, setHasUnsavedBills] = useState(false);
  const [isSavingBills, setIsSavingBills] = useState(false);
  const [billToDelete, setBillToDelete] = useState<FixedBill | null>(null);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  // New bill input state
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillCategory, setNewBillCategory] = useState<ExpenseCategory>('Housing');
  const [newBillDueDay, setNewBillDueDay] = useState('1');
  const [newBillAutoLog, setNewBillAutoLog] = useState(false);

  // Edit bill input state
  const [editBillName, setEditBillName] = useState('');
  const [editBillAmount, setEditBillAmount] = useState('');
  const [editBillCategory, setEditBillCategory] = useState<ExpenseCategory>('Housing');
  const [editBillDueDay, setEditBillDueDay] = useState('1');
  const [editBillAutoLog, setEditBillAutoLog] = useState(false);

  // Track changes to fixed bills
  const markBillsChanged = (newList: FixedBill[]) => {
    setFixedBillsList(newList);
    setHasUnsavedBills(true);
  };

  // Add a new bill item
  const handleAddBill = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseNominal(newBillAmount);
    const day = parseInt(newBillDueDay, 10);

    if (!newBillName.trim()) {
      showToast(isId ? 'Nama pengeluaran rutin wajib diisi' : 'Name is required', 'error');
      return;
    }
    if (amt <= 0) {
      showToast(isId ? 'Nominal harus lebih dari 0' : 'Amount must be greater than 0', 'error');
      return;
    }
    if (isNaN(day) || day < 1 || day > 31) {
      showToast(isId ? 'Tanggal jatuh tempo harus antara 1 sampai 31' : 'Due day must be between 1 and 31', 'error');
      return;
    }

    const newBill: FixedBill = {
      id: `bill_${Date.now()}`,
      name: newBillName.trim(),
      amount: amt,
      dueDay: day,
      category: newBillCategory,
      active: true,
      autoLogOnDue: newBillAutoLog,
      isPaidThisMonth: false,
    };

    const updatedList = [...fixedBillsList, newBill];
    markBillsChanged(updatedList);

    // Reset inputs
    setNewBillName('');
    setNewBillAmount('');
    setNewBillDueDay('1');
    setNewBillAutoLog(false);
    showToast(isId ? `"${newBill.name}" ditambahkan. Klik Simpan untuk mempermanenkan.` : `"${newBill.name}" added. Click Save to persist.`);
  };

  // Start inline editing
  const startEditingBill = (bill: FixedBill) => {
    setEditingBillId(bill.id);
    setEditBillName(bill.name);
    setEditBillAmount(formatNominal(bill.amount));
    setEditBillCategory(bill.category);
    setEditBillDueDay(String(bill.dueDay));
    setEditBillAutoLog(bill.autoLogOnDue || false);
  };

  const saveEditedBill = () => {
    const amt = parseNominal(editBillAmount);
    const day = parseInt(editBillDueDay, 10);

    if (!editBillName.trim() || amt <= 0 || isNaN(day) || day < 1 || day > 31) {
      showToast(isId ? 'Periksa kembali input yang kamu isi' : 'Please check your inputs', 'error');
      return;
    }

    const updated = fixedBillsList.map((b) =>
      b.id === editingBillId
        ? {
            ...b,
            name: editBillName.trim(),
            amount: amt,
            category: editBillCategory,
            dueDay: day,
            autoLogOnDue: editBillAutoLog,
          }
        : b
    );

    markBillsChanged(updated);
    setEditingBillId(null);
    showToast(isId ? 'Perubahan diperbarui. Jangan lupa klik Simpan.' : 'Item updated. Click Save to persist.');
  };

  const handleToggleBillActive = (id: string) => {
    const updated = fixedBillsList.map((b) => (b.id === id ? { ...b, active: !b.active } : b));
    markBillsChanged(updated);
  };

  const confirmDeleteBill = () => {
    if (!billToDelete) return;
    const updated = fixedBillsList.filter((b) => b.id !== billToDelete.id);
    markBillsChanged(updated);
    showToast(isId ? `"${billToDelete.name}" dihapus.` : `"${billToDelete.name}" deleted.`);
    setBillToDelete(null);
  };

  // Sticky Save Fixed Bills
  const handleSaveFixedBills = () => {
    setIsSavingBills(true);
    try {
      const updatedProfile: UserProfile = {
        ...profile,
        fixedBills: fixedBillsList,
      };
      setProfile(updatedProfile);
      onSaveProfile(updatedProfile);
      setHasUnsavedBills(false);
      showToast(isId ? 'Semua pengeluaran rutin berhasil disimpan!' : 'All fixed expenses saved successfully!');
    } catch (err) {
      showToast(isId ? 'Gagal menyimpan pengeluaran rutin' : 'Failed to save fixed expenses', 'error');
    } finally {
      setIsSavingBills(false);
    }
  };

  const totalActiveFixedExpenses = fixedBillsList
    .filter((b) => b.active !== false)
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  // ----------------------------------------------------
  // ISSUE 2: Payday & Income Setting State & Logic
  // ----------------------------------------------------
  const [paydaySchedule, setPaydaySchedule] = useState<PaydayScheduleType>(
    profile.paydayConfig?.scheduleType || 'monthly_date'
  );
  const [paydayDayOfMonth, setPaydayDayOfMonth] = useState<string>(
    String(profile.paydayConfig?.dayOfMonth || 25)
  );
  const [paydayCustomDate, setPaydayCustomDate] = useState<string>(
    profile.paydayConfig?.customDate || ''
  );
  const [paydayWeekendAdjust, setPaydayWeekendAdjust] = useState<boolean>(
    profile.paydayConfig?.adjustForWeekend !== false
  );
  const [primaryIncomeStr, setPrimaryIncomeStr] = useState<string>(
    formatNominal(profile.monthlyIncome || 15000000)
  );
  const [hasUnsavedPayday, setHasUnsavedPayday] = useState(false);

  // Next payday preview calculation
  const currentPaydayPreview = calculateNextPayday(
    {
      scheduleType: paydaySchedule,
      dayOfMonth: parseInt(paydayDayOfMonth, 10) || 25,
      customDate: paydayCustomDate || undefined,
      adjustForWeekend: paydayWeekendAdjust,
    },
    new Date()
  );

  const handleSavePaydayConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const day = parseInt(paydayDayOfMonth, 10);
    const inc = parseNominal(primaryIncomeStr);

    if (paydaySchedule === 'monthly_date' && (isNaN(day) || day < 1 || day > 31)) {
      showToast(isId ? 'Tanggal gajian harus antara 1 sampai 31' : 'Payday must be between 1 and 31', 'error');
      return;
    }
    if (inc <= 0) {
      showToast(isId ? 'Pemasukan bulanan harus lebih dari 0' : 'Income must be greater than 0', 'error');
      return;
    }

    const updatedConfig: PaydayConfig = {
      scheduleType: paydaySchedule,
      dayOfMonth: isNaN(day) ? 25 : day,
      customDate: paydayCustomDate || undefined,
      adjustForWeekend: paydayWeekendAdjust,
    };

    const updatedProfile: UserProfile = {
      ...profile,
      monthlyIncome: inc,
      paydayConfig: updatedConfig,
      incomeSources: [
        {
          id: 'primary_income',
          name: isId ? 'Pemasukan Utama' : 'Primary Income',
          amount: inc,
          scheduleType: paydaySchedule,
          dayOfMonth: isNaN(day) ? 25 : day,
          isPrimary: true,
        },
      ],
    };

    setProfile(updatedProfile);
    onSaveProfile(updatedProfile);
    setHasUnsavedPayday(false);
    showToast(isId ? 'Pengaturan gajian & pemasukan berhasil disimpan!' : 'Payday & income saved successfully!');
  };

  // ----------------------------------------------------
  // Financial Period Setting (Payday Cycle vs Calendar Month)
  // ----------------------------------------------------
  const [periodType, setPeriodType] = useState<FinancialPeriodType>(
    profile.financialPeriodType || 'payday_cycle'
  );
  const [showPeriodSwitchModal, setShowPeriodSwitchModal] = useState<FinancialPeriodType | null>(null);

  const confirmPeriodSwitch = (newType: FinancialPeriodType) => {
    const updatedProfile: UserProfile = {
      ...profile,
      financialPeriodType: newType,
    };
    setPeriodType(newType);
    setProfile(updatedProfile);
    onSaveProfile(updatedProfile);
    setShowPeriodSwitchModal(null);
    showToast(
      isId
        ? `Periode keuangan diubah ke ${newType === 'payday_cycle' ? 'Siklus Gajian' : 'Bulan Kalender'}.`
        : `Financial period switched to ${newType === 'payday_cycle' ? 'Payday Cycle' : 'Calendar Month'}.`
    );
  };

  // ----------------------------------------------------
  // Category Budget update
  // ----------------------------------------------------
  const handleUpdateCategoryBudget = (category: ExpenseCategory, limit: number) => {
    const current = profile.categoryBudgets || [];
    const exists = current.some((b) => b.category === category);
    let updated: CategoryBudget[];
    if (exists) {
      updated = current.map((b) => (b.category === category ? { ...b, monthlyLimit: limit } : b));
    } else {
      updated = [...current, { category, monthlyLimit: limit }];
    }

    const updatedProfile = { ...profile, categoryBudgets: updated };
    setProfile(updatedProfile);
    onSaveProfile(updatedProfile);
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t.settings}
          </h2>
          <p className="text-xs text-slate-300">
            {isId
              ? 'Kelola hari gajian, pengeluaran rutin, periode keuangan, dan preferensi aplikasi'
              : 'Manage payday schedule, fixed recurring expenses, financial period, and preferences'}
          </p>
        </div>

        {/* Catch Up Past Spending Launch Button */}
        {onOpenCatchUpModal && (
          <button
            type="button"
            onClick={onOpenCatchUpModal}
            className="inline-flex items-center space-x-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 transition-all shadow-sm"
          >
            <History className="h-4 w-4 text-emerald-400" />
            <span>{isId ? 'Catat Pengeluaran Lalu (Catch Up)' : 'Catch Up Past Spending'}</span>
          </button>
        )}
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center space-x-2 rounded-2xl px-4 py-3 text-xs font-semibold shadow-2xl transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500 text-emerald-950 border border-emerald-400'
              : 'bg-rose-500 text-white border border-rose-400'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ====================================================
          ISSUE 2 & FINANCIAL PERIOD: Payday & Cycle Setting
          ==================================================== */}
      <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#0c1517] via-[#091113] to-[#070b0d] p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                {isId ? 'Pengaturan Hari Gajian & Periode Keuangan' : 'Payday & Financial Period Schedule'}
              </h3>
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Tentukan siklus gaji agar perhitungan batas aman harian selalu akurat'
                  : 'Configure your income cycle to calibrate daily safe-to-spend tracking'}
              </p>
            </div>
          </div>

          {/* Current Payday Badge Preview */}
          <div className="flex items-center space-x-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1.5 text-xs text-emerald-300">
            <Clock className="h-4 w-4 text-emerald-400" />
            <span className="font-medium">
              {isId ? 'Gajian Berikutnya:' : 'Next Payday:'}
            </span>
            <span className="font-bold text-white">
              {formatHumanDate(currentPaydayPreview.nextPayday.toISOString().split('T')[0], language)} ({currentPaydayPreview.daysRemaining} {isId ? 'hari lagi' : 'days left'})
            </span>
          </div>
        </div>

        {/* Financial Period Mode Selector (Payday Cycle vs Calendar Month) */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-200 block">
            {isId ? 'Format Periode Perhitungan:' : 'Calculation Period Format:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                if (periodType !== 'payday_cycle') setShowPeriodSwitchModal('payday_cycle');
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                periodType === 'payday_cycle'
                  ? 'border-emerald-500/60 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white">
                  {isId ? 'Siklus Gajian (Payday Cycle)' : 'Payday Cycle'}
                </span>
                {periodType === 'payday_cycle' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isId
                  ? 'Dari tanggal gajian ke gajian berikutnya (mis. 25 Sep - 24 Okt). Direkomendasikan untuk pekerja berpenghasilan bulanan.'
                  : 'From one payday to the next (e.g. Sep 25 - Oct 24). Recommended for monthly salaried earners.'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                if (periodType !== 'calendar_month') setShowPeriodSwitchModal('calendar_month');
              }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                periodType === 'calendar_month'
                  ? 'border-emerald-500/60 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-white">
                  {isId ? 'Bulan Kalender (1 - Akhir Bulan)' : 'Calendar Month (1st - End)'}
                </span>
                {periodType === 'calendar_month' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isId
                  ? 'Mulai tanggal 1 sampai akhir bulan kalender (mis. 1 Okt - 31 Okt).'
                  : 'From the 1st of the month to the last day of the calendar month.'}
              </p>
            </button>
          </div>
        </div>

        {/* Payday Schedule Details Form */}
        <form onSubmit={handleSavePaydayConfig} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Primary Income Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {isId ? `Gaji / Pemasukan per Gajian (${currency}):` : `Income per Payday (${currency}):`}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={primaryIncomeStr}
                onChange={(e) => {
                  setPrimaryIncomeStr(formatNominal(e.target.value));
                  setHasUnsavedPayday(true);
                }}
                className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs font-mono font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {/* Schedule Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {isId ? 'Jadwal Gajian:' : 'Payday Schedule:'}
              </label>
              <select
                value={paydaySchedule}
                onChange={(e) => {
                  setPaydaySchedule(e.target.value as PaydayScheduleType);
                  setHasUnsavedPayday(true);
                }}
                className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="monthly_date">{isId ? 'Bulanan pada tanggal tertentu' : 'Monthly on specific day'}</option>
                <option value="last_working_day">{isId ? 'Hari kerja terakhir setiap bulan' : 'Last working day of the month'}</option>
                <option value="biweekly">{isId ? 'Setiap 2 minggu (Biweekly)' : 'Every 2 weeks'}</option>
                <option value="weekly">{isId ? 'Setiap minggu (Weekly)' : 'Every week'}</option>
                <option value="custom_date">{isId ? 'Tanggal khusus berikutnya' : 'Custom next payday date'}</option>
              </select>
            </div>

            {/* Day of Month / Specific Date */}
            {paydaySchedule === 'monthly_date' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {isId ? 'Tanggal Gajian (1-31):' : 'Payday Day of Month (1-31):'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={paydayDayOfMonth}
                  onChange={(e) => {
                    setPaydayDayOfMonth(e.target.value);
                    setHasUnsavedPayday(true);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            )}

            {paydaySchedule === 'custom_date' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {isId ? 'Pilih Tanggal Gajian Berikutnya:' : 'Select Next Payday Date:'}
                </label>
                <input
                  type="date"
                  value={paydayCustomDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => {
                    setPaydayCustomDate(e.target.value);
                    setHasUnsavedPayday(true);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Weekend adjustment toggle */}
          <div className="flex items-center space-x-3 pt-1">
            <input
              type="checkbox"
              id="weekendAdjust"
              checked={paydayWeekendAdjust}
              onChange={(e) => {
                setPaydayWeekendAdjust(e.target.checked);
                setHasUnsavedPayday(true);
              }}
              className="rounded text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-[#080d0f] border-white/20"
            />
            <label htmlFor="weekendAdjust" className="text-xs text-slate-300 cursor-pointer">
              {isId
                ? 'Jika hari gajian jatuh pada akhir pekan (Sabtu/Minggu), majukan otomatis ke hari Jumat sebelumnya'
                : 'If payday falls on a weekend, shift to the preceding Friday automatically'}
            </label>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={!hasUnsavedPayday}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110 disabled:opacity-50 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{isId ? 'Simpan Pengaturan Gajian' : 'Save Payday Settings'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* ====================================================
          ISSUE 1: Fixed Monthly Expenses (Rent, Bills, Installments)
          ==================================================== */}
      <section className="rounded-3xl border border-white/5 bg-gradient-to-br from-[#0c1417] via-[#091012] to-[#070b0d] p-6 space-y-6 relative shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-display text-base font-bold text-white">
                  {isId ? 'Pengeluaran Rutin Bulanan (Fixed Expenses)' : 'Fixed Monthly Expenses'}
                </h3>
                {hasUnsavedBills && (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    {isId ? 'Belum Disimpan' : 'Unsaved Changes'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isId
                  ? 'Sewa rumah, tagihan listrik, wifi, cicilan, dan langganan wajib. Otomatis mengurangi anggaran sebelum batas aman harian dihitung.'
                  : 'Rent, electricity, internet, loans, and subscriptions. Subtracted before daily safe allowance is calibrated.'}
              </p>
            </div>
          </div>

          {/* Total Fixed Monthly Expenses Summary Chip */}
          <div className="flex items-center space-x-2 rounded-2xl border border-teal-500/30 bg-teal-950/40 px-4 py-2 text-xs">
            <span className="text-slate-400 font-medium">
              {isId ? 'Total Rutin Aktif:' : 'Total Active Bills:'}
            </span>
            <span className="font-mono font-bold text-teal-300 text-sm">
              {formatCurrency(totalActiveFixedExpenses, currency, hideBalances)} / {isId ? 'bln' : 'mo'}
            </span>
          </div>
        </div>

        {/* Existing Fixed Bills List */}
        <div className="space-y-2.5">
          {fixedBillsList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-slate-500 text-xs">
              {isId
                ? 'Belum ada pengeluaran rutin yang dicatat. Tambahkan di bawah agar perhitungan uang aman harianmu lebih presisi.'
                : 'No fixed expenses recorded yet. Add your recurring bills below to calibrate your safe spending limit.'}
            </div>
          ) : (
            fixedBillsList.map((bill) => {
              const isEditing = editingBillId === bill.id;

              if (isEditing) {
                return (
                  <div
                    key={bill.id}
                    className="rounded-2xl border border-emerald-500/50 bg-[#080d0f] p-4 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-4">
                        <label className="text-[11px] text-slate-400 block mb-1">
                          {isId ? 'Nama Tagihan:' : 'Name:'}
                        </label>
                        <input
                          type="text"
                          value={editBillName}
                          onChange={(e) => setEditBillName(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-[#0c1417] px-3 py-2 text-xs text-white focus:outline-none"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[11px] text-slate-400 block mb-1">
                          {isId ? `Nominal (${currency}):` : `Amount (${currency}):`}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editBillAmount}
                          onChange={(e) => setEditBillAmount(formatNominal(e.target.value))}
                          className="w-full rounded-xl border border-white/10 bg-[#0c1417] px-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:outline-none"
                          required
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="text-[11px] text-slate-400 block mb-1">
                          {isId ? 'Kategori:' : 'Category:'}
                        </label>
                        <select
                          value={editBillCategory}
                          onChange={(e) => setEditBillCategory(e.target.value as ExpenseCategory)}
                          className="w-full rounded-xl border border-white/10 bg-[#0c1417] px-2 py-2 text-xs text-white focus:outline-none"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-slate-400 block mb-1">
                          {isId ? 'Tgl Jatuh Tempo:' : 'Due Day:'}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editBillDueDay}
                          onChange={(e) => setEditBillDueDay(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-[#0c1417] px-2 py-2 text-xs font-mono text-white focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editBillAutoLog}
                          onChange={(e) => setEditBillAutoLog(e.target.checked)}
                          className="rounded text-emerald-500 h-4 w-4 bg-[#0c1417] border-white/20"
                        />
                        <span>{isId ? 'Tawarkan catat otomatis saat jatuh tempo' : 'Offer auto-log on due day'}</span>
                      </label>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingBillId(null)}
                          className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:text-white"
                        >
                          {isId ? 'Batal' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          onClick={saveEditedBill}
                          className="px-4 py-1.5 rounded-lg bg-emerald-500 text-emerald-950 font-bold text-xs hover:bg-emerald-400"
                        >
                          {isId ? 'Perbarui' : 'Update'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={bill.id}
                  className={`flex items-center justify-between rounded-2xl border p-4 transition-all ${
                    bill.active !== false
                      ? 'border-white/10 bg-white/[0.02] hover:border-emerald-500/20'
                      : 'border-white/5 bg-white/[0.01] opacity-50'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <input
                      type="checkbox"
                      checked={bill.active !== false}
                      onChange={() => handleToggleBillActive(bill.id)}
                      className="rounded text-emerald-500 focus:ring-emerald-400 h-4 w-4 bg-[#080d0f] border-white/20 cursor-pointer"
                      title={bill.active !== false ? 'Nonaktifkan' : 'Aktifkan'}
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-xs text-white">{bill.name}</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-300">
                          {bill.category}
                        </span>
                        {bill.autoLogOnDue && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                            Auto-Log
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {isId ? `Jatuh tempo tanggal ${bill.dueDay} setiap bulan` : `Due on day ${bill.dueDay} each month`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs sm:text-sm font-bold text-white">
                      {formatCurrency(bill.amount, currency, hideBalances)}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEditingBill(bill)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-white/5 transition-colors"
                      title={isId ? 'Ubah' : 'Edit'}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillToDelete(bill)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title={isId ? 'Hapus' : 'Delete'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add New Fixed Bill Form */}
        <form onSubmit={handleAddBill} className="rounded-2xl border border-white/10 bg-white/[0.015] p-4 space-y-3">
          <span className="text-xs font-bold text-white block">
            {isId ? '➕ Tambah Pengeluaran Rutin Baru:' : '➕ Add New Fixed Expense:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <input
              type="text"
              placeholder={isId ? 'Nama tagihan (mis. Sewa Kost, Wifi, PLN)' : 'Title (e.g. Rent, Internet)'}
              value={newBillName}
              onChange={(e) => setNewBillName(e.target.value)}
              className="sm:col-span-4 rounded-xl border border-white/10 bg-[#080d0f] px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              required
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder={isId ? 'Nominal' : 'Amount'}
              value={newBillAmount}
              onChange={(e) => setNewBillAmount(formatNominal(e.target.value))}
              className="sm:col-span-3 rounded-xl border border-white/10 bg-[#080d0f] px-3 py-2.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500/50"
              required
            />
            <select
              value={newBillCategory}
              onChange={(e) => setNewBillCategory(e.target.value as ExpenseCategory)}
              className="sm:col-span-3 rounded-xl border border-white/10 bg-[#080d0f] px-2 py-2.5 text-xs text-slate-200 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="31"
              placeholder={isId ? 'Tgl (1-31)' : 'Day (1-31)'}
              value={newBillDueDay}
              onChange={(e) => setNewBillDueDay(e.target.value)}
              className="sm:col-span-2 rounded-xl border border-white/10 bg-[#080d0f] px-2 py-2.5 text-xs font-mono text-white focus:outline-none"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newBillAutoLog}
                onChange={(e) => setNewBillAutoLog(e.target.checked)}
                className="rounded text-emerald-500 h-4 w-4 bg-[#080d0f] border-white/20"
              />
              <span>{isId ? 'Tawarkan catat otomatis saat tanggal tiba' : 'Offer auto-log when due day arrives'}</span>
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center space-x-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isId ? 'Tambahkan ke Daftar' : 'Add to List'}</span>
            </button>
          </div>
        </form>

        {/* STICKY SAVE BAR AT THE BOTTOM OF FIXED EXPENSES SECTION */}
        <div className="sticky bottom-4 z-20 rounded-2xl border border-emerald-500/40 bg-[#091113]/95 backdrop-blur-md p-4 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs">
            {hasUnsavedBills ? (
              <span className="flex items-center space-x-1.5 text-amber-300 font-semibold">
                <AlertTriangle className="h-4 w-4" />
                <span>{isId ? 'Ada perubahan pengeluaran rutin yang belum disimpan!' : 'You have unsaved changes in fixed expenses!'}</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                <span>{isId ? 'Semua pengeluaran rutin tersimpan rapi.' : 'All fixed expenses are saved.'}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {hasUnsavedBills && (
              <button
                type="button"
                onClick={() => {
                  setFixedBillsList(userProfile.fixedBills || []);
                  setHasUnsavedBills(false);
                  showToast(isId ? 'Perubahan dibatalkan' : 'Changes discarded');
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isId ? 'Batal' : 'Reset'}</span>
              </button>
            )}

            <button
              type="button"
              disabled={isSavingBills || !hasUnsavedBills}
              onClick={handleSaveFixedBills}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-emerald-950 shadow-lg hover:brightness-110 disabled:opacity-50 transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{isSavingBills ? (isId ? 'Menyimpan...' : 'Saving...') : (isId ? 'Simpan Pengeluaran Rutin' : 'Save Fixed Expenses')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal for Fixed Bills */}
      {billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/40 bg-[#0e1619] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h4 className="font-display text-base font-bold text-white">
                {isId ? 'Hapus Pengeluaran Rutin?' : 'Delete Fixed Expense?'}
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isId
                ? `Yakin ingin menghapus "${billToDelete.name}" (${formatCurrency(billToDelete.amount, currency)})? Perhitungan jatah belanja harianmu akan otomatis disesuaikan.`
                : `Are you sure you want to delete "${billToDelete.name}" (${formatCurrency(billToDelete.amount, currency)})?`}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setBillToDelete(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmDeleteBill}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600"
              >
                {isId ? 'Ya, Hapus' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal when switching Financial Period */}
      {showPeriodSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-emerald-500/40 bg-[#0e1619] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-emerald-400">
              <Zap className="h-6 w-6" />
              <h4 className="font-display text-base font-bold text-white">
                {isId ? 'Ubah Format Periode Keuangan?' : 'Switch Financial Period?'}
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isId
                ? `Mengubah periode ke ${
                    showPeriodSwitchModal === 'payday_cycle' ? 'Siklus Gajian' : 'Bulan Kalender'
                  } akan langsung menghitung ulang jatah belanja harian, grafik pengeluaran, target mingguan, dan analitik kamu secara real-time.`
                : `Switching to ${
                    showPeriodSwitchModal === 'payday_cycle' ? 'Payday Cycle' : 'Calendar Month'
                  } will immediately re-calibrate your daily safe-to-spend, trajectory charts, and analytics.`}
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPeriodSwitchModal(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-400 hover:text-white"
              >
                {isId ? 'Batal' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => confirmPeriodSwitch(showPeriodSwitchModal)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 font-bold text-xs hover:brightness-110"
              >
                {isId ? 'Terapkan Sekarang' : 'Apply Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section: Per-Category Budgets */}
      <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400">
            <PieChart className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white">
              {language === 'id' ? 'Anggaran per Kategori' : 'Per-Category Budgets'}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'id' ? 'Peringatan otomatis pada penggunaan 80% dan 100%' : 'Smart alerts trigger at 80% and 100% consumption'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.slice(0, 6).map((cat) => {
            const currentLimit = (profile.categoryBudgets || []).find((b) => b.category === cat)?.monthlyLimit || 0;
            return (
              <div key={cat} className="rounded-2xl border border-white/5 bg-white/[0.015] p-3.5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{cat}</span>
                  <span className="font-mono text-emerald-400 text-xs">
                    {formatCurrency(currentLimit, currency, hideBalances)}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Set limit e.g. 2,000,000"
                  value={currentLimit > 0 ? formatNominal(currentLimit) : ''}
                  onChange={(e) => handleUpdateCategoryBudget(cat, parseNominal(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-[#080d0f] px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Section: Privacy Lock & App Security */}
      <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-white/5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-white">
              {t.privacyLock}
            </h3>
            <p className="text-xs text-slate-400">
              {language === 'id' ? 'Kunci aplikasi dengan PIN 4-digit untuk keamanan ekstra' : 'Protect your ledger with an optional 4-digit PIN'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                const updatedProfile = {
                  ...profile,
                  settings: {
                    ...(profile.settings || {}),
                    pinLockEnabled: !profile.settings?.pinLockEnabled,
                  } as any,
                };
                setProfile(updatedProfile);
                onSaveProfile(updatedProfile);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                profile.settings?.pinLockEnabled ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  profile.settings?.pinLockEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-xs text-slate-300 font-medium">
              {profile.settings?.pinLockEnabled
                ? language === 'id' ? 'Kunci PIN Aktif' : 'PIN Lock Active'
                : language === 'id' ? 'Kunci PIN Nonaktif' : 'PIN Lock Disabled'}
            </span>
          </div>

          {profile.settings?.pinLockEnabled && (
            <div className="flex items-center space-x-2">
              <label className="text-xs text-slate-400">PIN (4-digits):</label>
              <input
                type="password"
                maxLength={4}
                value={profile.settings?.pinCode || '1234'}
                onChange={(e) => {
                  const updatedProfile = {
                    ...profile,
                    settings: {
                      ...(profile.settings || {}),
                      pinCode: e.target.value,
                    } as any,
                  };
                  setProfile(updatedProfile);
                  onSaveProfile(updatedProfile);
                }}
                className="w-20 text-center rounded-xl border border-white/10 bg-[#080d0f] py-1 text-sm font-mono tracking-widest text-emerald-400 focus:outline-none"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
