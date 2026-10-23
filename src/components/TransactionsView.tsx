import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit3,
  Mic,
  Tag,
  Plus,
  Receipt,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ArrowUpDown,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { ExpenseRecord, ExpenseCategory, UserProfile } from '../types';
import {
  formatCurrency,
  formatHumanDate,
  formatHumanTime,
} from '../lib/currencies';
import { translations, Language } from '../lib/i18n';

interface TransactionsViewProps {
  expenses: ExpenseRecord[];
  userProfile: UserProfile;
  language: Language;
  hideBalances: boolean;
  onDeleteExpense: (id: string) => void;
  onBulkDeleteExpenses: (ids: string[]) => void;
  onEditExpense: (expense: ExpenseRecord) => void;
  onOpenAddManual: () => void;
  onOpenVoiceModal: () => void;
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

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  expenses,
  userProfile,
  language,
  hideBalances,
  onDeleteExpense,
  onBulkDeleteExpenses,
  onEditExpense,
  onOpenAddManual,
  onOpenVoiceModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSource, setSelectedSource] = useState<'all' | 'voice' | 'manual'>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [expandedTranscriptIds, setExpandedTranscriptIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const t = translations[language];

  // Filter logic
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return expenses.filter((exp) => {
      // Search check
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchesTitle = exp.title.toLowerCase().includes(query);
        const matchesCat = exp.category.toLowerCase().includes(query);
        const matchesTranscript = exp.rawVoiceTranscript?.toLowerCase().includes(query);
        const matchesNotes = exp.notes?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCat && !matchesTranscript && !matchesNotes) {
          return false;
        }
      }

      // Category check
      if (selectedCategory !== 'All' && exp.category !== selectedCategory) {
        return false;
      }

      // Source check
      if (selectedSource !== 'all' && exp.source !== selectedSource) {
        return false;
      }

      // Date Range check
      if (selectedDateRange !== 'all') {
        const expDate = new Date(exp.date);
        if (selectedDateRange === 'today') {
          if (exp.date.split('T')[0] !== todayStr) return false;
        } else if (selectedDateRange === 'week') {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          if (expDate < weekAgo) return false;
        } else if (selectedDateRange === 'month') {
          if (
            expDate.getFullYear() !== now.getFullYear() ||
            expDate.getMonth() !== now.getMonth()
          ) {
            return false;
          }
        }
      }

      return true;
    });
  }, [expenses, searchQuery, selectedCategory, selectedSource, selectedDateRange]);

  // Sort logic
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortBy === 'amount_desc') {
        return (b.amount || 0) - (a.amount || 0);
      }
      if (sortBy === 'amount_asc') {
        return (a.amount || 0) - (b.amount || 0);
      }
      return 0;
    });
  }, [filteredExpenses, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedExpenses.slice(start, start + itemsPerPage);
  }, [sortedExpenses, currentPage, itemsPerPage]);

  const toggleExpandTranscript = (id: string) => {
    setExpandedTranscriptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedExpenses.length && paginatedExpenses.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedExpenses.map((e) => e.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const confirmMsg =
      language === 'id'
        ? `Hapus ${selectedIds.size} transaksi terpilih?`
        : `Delete ${selectedIds.size} selected transactions?`;
    if (window.confirm(confirmMsg)) {
      onBulkDeleteExpenses(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Time', 'Merchant/Title', 'Category', 'Amount', 'Currency', 'Source', 'Transcript'];
    const rows = sortedExpenses.map((e) => [
      e.id,
      e.date.split('T')[0],
      formatHumanTime(e.date),
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      userProfile.currency,
      e.source,
      `"${(e.rawVoiceTranscript || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Savely_Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Bank-Grade PDF Statement
  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t.transactions}
          </h2>
          <p className="text-xs text-slate-300">
            {language === 'id'
              ? 'Daftar riwayat pembukuan lengkap, filter multi-dimensi, dan ekspor laporan'
              : 'Complete expense history, multi-dimensional filters, and statement exports'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Download CSV spreadsheet"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={exportToPDF}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all"
            title="Print or Save PDF Statement"
          >
            <Printer className="h-4 w-4 text-teal-400" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddManual}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{t.logManually}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'id' ? 'Cari nama merchant, memo...' : 'Search merchant, memo...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-[#090e11] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-[#090e11] py-2 px-3 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="All">{t.allCategories}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedDateRange}
              onChange={(e) => {
                setSelectedDateRange(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-white/10 bg-[#090e11] py-2 px-3 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">{t.allTime}</option>
              <option value="today">{t.today}</option>
              <option value="week">{t.thisWeek}</option>
              <option value="month">{t.thisMonth}</option>
            </select>
          </div>

          {/* Sort order */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full rounded-xl border border-white/10 bg-[#090e11] py-2 px-3 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="date_desc">{language === 'id' ? 'Terbaru' : 'Newest'}</option>
              <option value="date_asc">{language === 'id' ? 'Terlama' : 'Oldest'}</option>
              <option value="amount_desc">{language === 'id' ? 'Nominal Tertinggi' : 'Highest Amount'}</option>
              <option value="amount_asc">{language === 'id' ? 'Nominal Terendah' : 'Lowest Amount'}</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/30 p-2.5">
            <span className="text-xs font-semibold text-rose-300">
              {selectedIds.size} {language === 'id' ? 'transaksi dipilih' : 'transactions selected'}
            </span>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center space-x-1.5 rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{language === 'id' ? 'Hapus Terpilih' : 'Delete Selected'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Transactions List */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent p-4 sm:p-6">
        {/* Table Head / Select All */}
        {sortedExpenses.length > 0 && (
          <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs font-semibold text-slate-400 px-2">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-slate-400 hover:text-white"
                title="Select all on this page"
              >
                {selectedIds.size === paginatedExpenses.length && paginatedExpenses.length > 0 ? (
                  <CheckSquare className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </button>
              <span>
                {sortedExpenses.length} {language === 'id' ? 'total transaksi' : 'total items'}
              </span>
            </div>

            <span className="text-slate-400">
              {language === 'id' ? 'Halaman' : 'Page'} {currentPage} of {totalPages}
            </span>
          </div>
        )}

        {/* Empty States */}
        {expenses.length === 0 ? (
          // 1. Initial Empty State: Zero expenses exist
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
              <Receipt className="h-7 w-7" />
            </div>
            <h4 className="font-display text-base font-bold text-white">
              {language === 'id' ? 'Belum Ada Pengeluaran' : 'No Expenses Logged Yet'}
            </h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {language === 'id'
                ? 'Ketuk mikrofon untuk mencatat pengeluaran pertama Anda secara instan dengan suara.'
                : 'Tap the mic to add your first expense and start tracking your safe-to-spend allowance.'}
            </p>
            <div className="mt-5 flex items-center space-x-3">
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="inline-flex items-center space-x-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-emerald-950 shadow-lg shadow-emerald-500/30 hover:brightness-110"
              >
                <Mic className="h-4 w-4" />
                <span>{t.speakExpense}</span>
              </button>
              <button
                type="button"
                onClick={onOpenAddManual}
                className="inline-flex items-center space-x-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
              >
                <Plus className="h-4 w-4" />
                <span>{t.logManually}</span>
              </button>
            </div>
          </div>
        ) : sortedExpenses.length === 0 ? (
          // 2. Search / Filter Empty State: No results match
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 text-slate-400 mb-3">
              <Search className="h-6 w-6" />
            </div>
            <h4 className="font-display text-base font-semibold text-white">
              {language === 'id' ? 'Tidak Ada Hasil yang Cocok' : 'No Match for Your Search'}
            </h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm">
              {language === 'id'
                ? 'Coba ganti kata kunci pencarian atau sesuaikan filter kategori dan tanggal.'
                : 'Try adjusting your search query, category filter, or date range.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedDateRange('all');
                setSelectedSource('all');
              }}
              className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/[0.08]"
            >
              {language === 'id' ? 'Reset Semua Filter' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          // 3. Transactions List
          <div className="divide-y divide-white/5">
            {paginatedExpenses.map((exp) => {
              const isSelected = selectedIds.has(exp.id);
              const isTranscriptExpanded = expandedTranscriptIds.has(exp.id);

              return (
                <div
                  key={exp.id}
                  className={`group py-3.5 px-2 rounded-2xl transition-colors hover:bg-white/[0.015] ${
                    isSelected ? 'bg-emerald-500/[0.03]' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Left details */}
                    <div className="flex items-start space-x-3">
                      <button
                        type="button"
                        onClick={() => toggleSelectRow(exp.id)}
                        className="mt-1 text-slate-500 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          exp.source === 'voice'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {exp.source === 'voice' ? <Mic className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="font-semibold text-sm text-white">{exp.title}</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-300 font-medium">{exp.category}</span>
                          {exp.source === 'voice' && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="text-emerald-400 text-[11px] font-medium">Voice</span>
                            </>
                          )}
                        </div>

                        {/* Date and Time */}
                        <div className="mt-1 flex items-center space-x-2 text-xs text-slate-400">
                          <span>{formatHumanDate(exp.date, language)}</span>
                          <span className="text-slate-600">·</span>
                          <span>{formatHumanTime(exp.date)}</span>
                          {exp.notes && (
                            <>
                              <span className="text-slate-600">·</span>
                              <span className="text-slate-300">{exp.notes}</span>
                            </>
                          )}
                        </div>

                        {/* Expandable transcript accordion */}
                        {exp.rawVoiceTranscript && (
                          <div className="mt-1.5">
                            <button
                              type="button"
                              onClick={() => toggleExpandTranscript(exp.id)}
                              className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 hover:underline"
                            >
                              <span>{isTranscriptExpanded ? (language === 'id' ? 'Sembunyikan ucapan asli' : 'Hide transcript') : (language === 'id' ? 'Lihat ucapan asli suara' : 'View voice transcript')}</span>
                              {isTranscriptExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </button>
                            {isTranscriptExpanded && (
                              <p className="mt-1 text-xs text-slate-300 italic bg-white/[0.02] border border-white/5 p-2 rounded-lg">
                                "{exp.rawVoiceTranscript}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0">
                      <span className="font-mono text-base font-bold text-white">
                        {formatCurrency(exp.amount, userProfile.currency, hideBalances)}
                      </span>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => onEditExpense(exp)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
                          title={t.edit}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteExpense(exp.id)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                          title={t.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
