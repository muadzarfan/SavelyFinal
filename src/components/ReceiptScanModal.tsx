import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, RefreshCw, Sparkles, Tag, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { CurrencyCode, ExpenseCategory, ExpenseRecord } from '../types';
import { formatCurrency, formatNominal, parseNominal } from '../lib/currencies';
import { translations, Language } from '../lib/i18n';

interface ReceiptScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  language: Language;
  onConfirmExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
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

export const ReceiptScanModal: React.FC<ReceiptScanModalProps> = ({
  isOpen,
  onClose,
  currency,
  language,
  onConfirmExpense,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted data state
  const [merchant, setMerchant] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Groceries');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = useState<{ name: string; price: number }[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      scanReceiptImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const scanReceiptImage = async (base64Data: string, mimeType: string) => {
    setIsScanning(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mimeType || 'image/jpeg',
          userCurrency: currency,
        }),
      });

      if (!res.ok) throw new Error('Receipt scan failed');

      const data = await res.json();
      setMerchant(data.merchant || 'Store Purchase');
      setAmountStr(formatNominal(data.totalAmount || 0));
      setCategory(data.category || 'Shopping & Lifestyle');
      setDate(data.date || new Date().toISOString().split('T')[0]);
      setLineItems(data.items || []);
      setHasScanned(true);
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMessage(
        language === 'id'
          ? 'Gagal membaca struk otomatis. Anda dapat mengisi nominal manual di bawah.'
          : 'Failed to auto-scan receipt. You can manually enter details below.'
      );
      setHasScanned(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseNominal(amountStr);
    if (!merchant.trim() || numAmount <= 0) return;

    onConfirmExpense({
      title: merchant.trim(),
      amount: numAmount,
      category,
      date: `${date}T12:00:00.000Z`,
      source: 'manual',
      notes: lineItems.length > 0 ? `Scanned receipt items: ${lineItems.map((i) => i.name).join(', ')}` : 'Scanned receipt',
    });

    handleClose();
  };

  const handleClose = () => {
    setImagePreview(null);
    setIsScanning(false);
    setHasScanned(false);
    setMerchant('');
    setAmountStr('');
    setLineItems([]);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-emerald-500/25 bg-[#0b1013] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                {language === 'id' ? 'Pindai Struk Belanja' : 'Scan Expense Receipt'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'id' ? 'Ekstraksi otomatis foto struk menggunakan Gemini Vision' : 'AI vision OCR receipt recognition'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-xl p-1.5 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload or Camera Capture Box */}
        {!hasScanned && !isScanning && (
          <div className="my-6 space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-2xl p-8 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-white">
                {language === 'id' ? 'Unggah Foto Struk Belanja' : 'Upload Receipt Photo'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PNG, JPG, or WebP up to 10MB
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20"
              >
                <Camera className="h-4 w-4" />
                <span>{language === 'id' ? 'Buka Kamera' : 'Use Camera'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 text-xs font-semibold hover:bg-white/[0.08]"
              >
                <Upload className="h-4 w-4" />
                <span>{language === 'id' ? 'Pilih Berkas' : 'Browse Files'}</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}

        {/* Scanning State */}
        {isScanning && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 animate-pulse">
                <Sparkles className="h-8 w-8" />
              </div>
              <span className="absolute -inset-2 rounded-2xl bg-emerald-400/20 blur-md animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-sm text-white">
                {language === 'id' ? 'Menganalisis Struk Belanja...' : 'Analyzing Receipt via Gemini Vision...'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'id' ? 'Membaca merchant, tanggal, dan total nominal' : 'Extracting merchant, items, and nominal'}
              </p>
            </div>
          </div>
        )}

        {/* Scanned Confirmation Form */}
        {hasScanned && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMessage && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 font-medium">{t.merchantOrTitle}</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g. Indomaret Point, Starbucks"
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">{t.amount} ({currency})</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amountStr}
                  onChange={(e) => setAmountStr(formatNominal(e.target.value))}
                  placeholder="e.g. 85,000"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">{t.date}</label>
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
              <label className="text-xs text-slate-400 font-medium">{t.category}</label>
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

            {/* Extracted Line Items Snippet if any */}
            {lineItems.length > 0 && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-1.5">
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  {language === 'id' ? 'Barang Terdeteksi' : 'Detected Items'}:
                </span>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {lineItems.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-slate-300">
                      <span className="truncate">{it.name}</span>
                      <span className="font-mono text-emerald-400 shrink-0 ml-2">
                        {formatCurrency(it.price, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 hover:bg-white/[0.08]"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-bold text-emerald-950 shadow-md hover:brightness-110"
              >
                <Check className="h-4 w-4" />
                <span>{language === 'id' ? 'Simpan Pengeluaran' : 'Record Expense'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
