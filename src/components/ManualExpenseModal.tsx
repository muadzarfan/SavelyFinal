import React, { useState } from 'react';
import { Plus, X, Check, Calendar, Tag, DollarSign } from 'lucide-react';
import { CurrencyCode, ExpenseCategory, ExpenseRecord } from '../types';
import { formatNominal, parseNominal } from '../lib/currencies';

interface ManualExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  language?: 'id' | 'en';
  onAddExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
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

export const ManualExpenseModal: React.FC<ManualExpenseModalProps> = ({
  isOpen,
  onClose,
  currency,
  language = 'id',
  onAddExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Beverage');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNominal(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    onAddExpense({
      title: title.trim(),
      amount: numAmount,
      category,
      date: `${date}T12:00:00.000Z`,
      source: 'manual',
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setAmount('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-emerald-500/25 bg-[#0b1013] p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <h3 className="font-display text-base font-bold text-white">
            {language === 'id' ? 'Catat Pengeluaran Manual' : 'Log Manual Expense'}
          </h3>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-slate-300 font-semibold">
              {language === 'id' ? 'Item / Merchant' : 'Merchant / Title'}
            </label>
            <input
              type="text"
              placeholder="e.g., Warung Kopi / Grocery Run"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Amount ({currency})</label>
              <input
                id="manual-expense-amount-input"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 50,000"
                value={amount}
                onChange={(e) => setAmount(formatNominal(e.target.value))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium">Notes (optional)</label>
            <input
              type="text"
              placeholder="Context or memo"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110"
            >
              <Check className="h-4 w-4" />
              <span>Record Expense</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
