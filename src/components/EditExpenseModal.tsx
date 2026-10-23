import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Calendar, Tag, DollarSign, Edit3 } from 'lucide-react';
import { CurrencyCode, ExpenseCategory, ExpenseRecord } from '../types';
import { formatNominal, parseNominal } from '../lib/currencies';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseRecord | null;
  currency: CurrencyCode;
  onSaveExpense: (updated: ExpenseRecord) => void;
  onDeleteExpense?: (id: string) => void;
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

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  currency,
  onSaveExpense,
  onDeleteExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Beverage');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmount(formatNominal(expense.amount));
      setCategory(expense.category);
      // Extract YYYY-MM-DD from ISO date
      setDate(expense.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setNotes(expense.notes || '');
    }
  }, [expense]);

  if (!isOpen || !expense) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNominal(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    onSaveExpense({
      ...expense,
      title: title.trim(),
      amount: numAmount,
      category,
      date: `${date}T12:00:00.000Z`,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (onDeleteExpense && confirm(`Are you sure you want to delete "${expense.title}"?`)) {
      onDeleteExpense(expense.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-emerald-500/25 bg-[#0b1013] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Edit3 className="h-4 w-4" />
            </div>
            <h3 className="font-display text-base font-bold text-white">
              Edit Transaction
            </h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-1 text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium">Merchant / Title</label>
            <input
              type="text"
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
                type="text"
                inputMode="numeric"
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            {onDeleteExpense ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110 transition-all"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
