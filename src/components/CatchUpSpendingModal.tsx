import React, { useState } from 'react';
import {
  History,
  X,
  Check,
  Plus,
  AlertTriangle,
  Receipt,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  UserProfile,
  ExpenseRecord,
  ExpenseCategory,
  FinancialPeriodInfo,
} from '../types';
import {
  formatCurrency,
  formatNominal,
  parseNominal,
  formatHumanDate,
} from '../lib/currencies';
import { Language } from '../lib/i18n';

interface CatchUpSpendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  periodInfo: FinancialPeriodInfo;
  existingExpenses: ExpenseRecord[];
  language: Language;
  onAddPriorSpending: (record: Omit<ExpenseRecord, 'id'>) => void;
  onCompleteCatchup: () => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Food & Beverage',
  'Groceries',
  'Transit & Commute',
  'Shopping & Lifestyle',
  'Utilities & Bills',
  'Housing',
  'Health & Wellness',
  'Entertainment & Leisure',
  'Personal Care',
  'Education & Work',
  'Other',
];

export const CatchUpSpendingModal: React.FC<CatchUpSpendingModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  periodInfo,
  existingExpenses,
  language,
  onAddPriorSpending,
  onCompleteCatchup,
}) => {
  const [activeTab, setActiveTab] = useState<'quick_total' | 'detailed'>('quick_total');
  const isId = language === 'id';
  const currency = userProfile.currency || 'IDR';

  // Method 1: Quick Total
  const [quickAmountStr, setQuickAmountStr] = useState('');
  const [quickCategory, setQuickCategory] = useState<ExpenseCategory>('Other');
  const [quickNote, setQuickNote] = useState('');
  const [quickSavedSuccess, setQuickSavedSuccess] = useState(false);

  // Method 2: Detailed Backfill
  const [backfillTitle, setBackfillTitle] = useState('');
  const [backfillAmountStr, setBackfillAmountStr] = useState('');
  const [backfillDate, setBackfillDate] = useState(() => {
    // Default to yesterday or period start
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    return yest.toISOString().split('T')[0];
  });
  const [backfillCategory, setBackfillCategory] = useState<ExpenseCategory>('Food & Beverage');
  const [backfillNote, setBackfillNote] = useState('');
  const [backfillSuccessMessage, setBackfillSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Check if prior spending or backfilled items already exist in this period to warn against double counting
  const priorSpendingItems = existingExpenses.filter(
    (e) => e.isPriorSpending || e.source === 'prior_spending'
  );
  const backfilledItems = existingExpenses.filter(
    (e) => e.isBackfilled || e.source === 'backfill'
  );

  const hasPriorQuickTotal = priorSpendingItems.length > 0;
  const hasBackfilled = backfilledItems.length > 0;
  const showDoubleCountingWarning = hasPriorQuickTotal && activeTab === 'detailed';

  // Handle Quick Total Submit
  const handleSaveQuickTotal = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseNominal(quickAmountStr);
    if (amount <= 0) return;

    onAddPriorSpending({
      title: isId
        ? `Pengeluaran Sebelumnya (${formatHumanDate(periodInfo.startDate, 'id')})`
        : `Prior Spending (${formatHumanDate(periodInfo.startDate, 'en')})`,
      amount,
      category: quickCategory,
      date: new Date(periodInfo.startDate + 'T12:00:00').toISOString(),
      source: 'prior_spending',
      isPriorSpending: true,
      notes: quickNote.trim() || (isId ? 'Catatan total pengeluaran sebelum mulai pakai Savely' : 'Quick total prior spending before Savely tracking'),
    });

    setQuickSavedSuccess(true);
    setTimeout(() => {
      onCompleteCatchup();
      onClose();
    }, 900);
  };

  // Handle Detailed Backfill Submit
  const handleSaveDetailedBackfill = (addAnother: boolean = false) => {
    const amount = parseNominal(backfillAmountStr);
    if (!backfillTitle.trim() || amount <= 0) return;

    onAddPriorSpending({
      title: backfillTitle.trim(),
      amount,
      category: backfillCategory,
      date: new Date(backfillDate + 'T12:00:00').toISOString(),
      source: 'backfill',
      isBackfilled: true,
      notes: backfillNote.trim() || undefined,
    });

    setBackfillSuccessMessage(
      isId ? `"${backfillTitle}" berhasil dicatat!` : `"${backfillTitle}" logged successfully!`
    );

    // Reset inputs
    setBackfillTitle('');
    setBackfillAmountStr('');
    setBackfillNote('');

    if (!addAnother) {
      setTimeout(() => {
        onCompleteCatchup();
        onClose();
      }, 700);
    } else {
      setTimeout(() => setBackfillSuccessMessage(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="relative z-10 w-full max-w-xl rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#0e1619] via-[#090f11] to-[#070b0d] p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.2)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                {isId ? 'Catat Pengeluaran Lalu (Catch Up)' : 'Catch Up Past Spending'}
              </h3>
              <p className="text-xs text-slate-400">
                {isId
                  ? `Sinkronkan uang yang sudah terpakai sejak ${formatHumanDate(periodInfo.startDate, 'id')}`
                  : `Account for money spent since ${formatHumanDate(periodInfo.startDate, 'en')}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mt-5 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#080d0f] border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('quick_total')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'quick_total'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isId ? '1. Total Cepat (Satu Angka)' : '1. Quick Total'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('detailed')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'detailed'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isId ? '2. Rinci per Tanggal (Backfill)' : '2. Detailed Backfill'}
          </button>
        </div>

        {/* Warning if user is combining both methods to avoid double counting */}
        {showDoubleCountingWarning && (
          <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs text-amber-200 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                {isId ? 'Peringatan Double Counting' : 'Double Counting Caution'}
              </span>
              <span>
                {isId
                  ? 'Kamu sudah memasukkan Total Cepat sebelumnya. Menambahkan transaksi rinci untuk periode yang sama bisa menghitung pengeluaran dua kali.'
                  : 'You already entered a Quick Total prior spending entry. Adding detailed transactions for the same period may count spending twice.'}
              </span>
            </div>
          </div>
        )}

        {/* Method 1: Quick Total */}
        {activeTab === 'quick_total' && (
          <form onSubmit={handleSaveQuickTotal} className="mt-5 space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-white block">
                {isId ? '💡 Cara Kerja Total Cepat:' : '💡 How Quick Total Works:'}
              </span>
              <p>
                {isId
                  ? `Cukup masukkan perkiraan total uang yang sudah kamu belanjakan dari ${formatHumanDate(periodInfo.startDate, 'id')} sampai kemarin. Savely langsung menghitung ulang jatah belanja harianmu agar akurat!`
                  : `Enter your estimated spending from ${formatHumanDate(periodInfo.startDate, 'en')} until yesterday. Savely will immediately rebalance your daily safe limit!`}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {isId
                  ? `Total uang yang sudah terpakai (${currency}):`
                  : `Total spent so far (${currency}):`}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={quickAmountStr}
                onChange={(e) => setQuickAmountStr(formatNominal(e.target.value))}
                placeholder={isId ? 'Contoh: 1.500.000' : 'e.g. 1,500,000'}
                className="w-full rounded-2xl border border-white/10 bg-[#080d0f] p-3.5 text-base font-mono font-bold text-emerald-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {isId ? 'Kategori Dominan:' : 'Primary Category:'}
                </label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value as ExpenseCategory)}
                  className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs text-white focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {isId ? 'Catatan (Opsional):' : 'Note (Optional):'}
                </label>
                <input
                  type="text"
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  placeholder={isId ? 'Belanja awal bulan' : 'Prior spending'}
                  className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-400 hover:text-white"
              >
                {isId ? 'Nanti Saja' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={parseNominal(quickAmountStr) <= 0 || quickSavedSuccess}
                className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-emerald-950 shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                {quickSavedSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>{isId ? 'Tersimpan!' : 'Saved!'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>{isId ? 'Simpan Total Pengeluaran' : 'Save Quick Total'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Method 2: Detailed Backfill */}
        {activeTab === 'detailed' && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-white block">
                {isId ? '📝 Catat Transaksi Lampau Satu per Satu:' : '📝 Log Past Transactions Individually:'}
              </span>
              <p>
                {isId
                  ? 'Pilih tanggal di masa lalu, masukkan nama dan nominal. Tekan "Tambah Lagi" untuk mencatat beberapa transaksi sekaligus.'
                  : 'Pick any date in the past, enter title and amount. Click "Add Another" to rapidly backfill multiple items.'}
              </p>
            </div>

            {backfillSuccessMessage && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300 flex items-center space-x-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>{backfillSuccessMessage}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {isId ? 'Nama Pengeluaran / Merchant:' : 'Title / Merchant:'}
                </label>
                <input
                  type="text"
                  value={backfillTitle}
                  onChange={(e) => setBackfillTitle(e.target.value)}
                  placeholder={isId ? 'mis. Belanja Superindo, Bensin, Kopi' : 'e.g. Groceries, Gas, Coffee'}
                  className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {isId ? `Nominal (${currency}):` : `Amount (${currency}):`}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={backfillAmountStr}
                    onChange={(e) => setBackfillAmountStr(formatNominal(e.target.value))}
                    placeholder="50.000"
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs font-mono font-bold text-emerald-300 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {isId ? 'Tanggal Transaksi:' : 'Transaction Date:'}
                  </label>
                  <input
                    type="date"
                    value={backfillDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBackfillDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {isId ? 'Kategori:' : 'Category:'}
                  </label>
                  <select
                    value={backfillCategory}
                    onChange={(e) => setBackfillCategory(e.target.value as ExpenseCategory)}
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs text-white focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    {isId ? 'Catatan (Opsional):' : 'Note (Optional):'}
                  </label>
                  <input
                    type="text"
                    value={backfillNote}
                    onChange={(e) => setBackfillNote(e.target.value)}
                    placeholder={isId ? 'Keterangan tambahan' : 'Optional note'}
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                {isId ? 'Selesai' : 'Done'}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={!backfillTitle.trim() || parseNominal(backfillAmountStr) <= 0}
                  onClick={() => handleSaveDetailedBackfill(true)}
                  className="inline-flex items-center space-x-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-50"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isId ? 'Simpan & Tambah Lagi' : 'Save & Add Another'}</span>
                </button>

                <button
                  type="button"
                  disabled={!backfillTitle.trim() || parseNominal(backfillAmountStr) <= 0}
                  onClick={() => handleSaveDetailedBackfill(false)}
                  className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{isId ? 'Simpan' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
