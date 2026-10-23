import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Check,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Edit3,
  Volume2,
  Clock,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  CurrencyCode,
  ExpenseCategory,
  ParsedItemCandidate,
  ExpenseRecord,
} from '../types';
import { formatCurrency, formatNominal, parseNominal } from '../lib/currencies';
import { translations, Language } from '../lib/i18n';

interface VoiceExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: CurrencyCode;
  language: Language;
  learnedMappings?: Record<string, ExpenseCategory>;
  onLearnMapping?: (merchant: string, category: ExpenseCategory) => void;
  onConfirmExpenses: (newExpenses: Omit<ExpenseRecord, 'id'>[]) => void;
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

const PRESET_PHRASES = [
  {
    label: '🍜 "20 ribu buat mie ayam terus 50 ribu buat ongkos ojek"',
    text: '20 ribu buat mie ayam terus 50 ribu buat ongkos ojek',
  },
  {
    label: '☕ "Gue beli kopi ceban sama cemilan goceng"',
    text: 'Gue beli kopi ceban sama cemilan goceng',
  },
  {
    label: '🍱 "Tadi siang makan padang habis empat puluh lima rebu"',
    text: 'Tadi siang makan padang habis empat puluh lima rebu',
  },
  {
    label: '⛽ "Kemarin beli bensin seratus dua puluh ribu"',
    text: 'Kemarin beli bensin seratus dua puluh ribu',
  },
  {
    label: '⚡ "Bayar token listrik 300rb dan pulsa 50k"',
    text: 'Bayar token listrik 300rb dan pulsa 50k',
  },
  {
    label: '🥗 "Coffee 35k and lunch 45k yesterday"',
    text: 'Coffee 35k and lunch 45k yesterday',
  },
];

export const VoiceExpenseModal: React.FC<VoiceExpenseModalProps> = ({
  isOpen,
  onClose,
  currency,
  language,
  learnedMappings,
  onLearnMapping,
  onConfirmExpenses,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [listenSeconds, setListenSeconds] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItemCandidate[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string>('');
  const [parsingNotes, setParsingNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const [waveformData, setWaveformData] = useState<number[]>([15, 25, 45, 60, 40, 20, 35, 55, 75, 50, 30, 20]);
  const t = translations[language];

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'id' ? 'id-ID' : 'en-US';

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalStr += event.results[i][0].transcript;
          } else {
            interimStr += event.results[i][0].transcript;
          }
        }
        if (finalStr) {
          setTranscript((prev) => (prev ? `${prev} ${finalStr}` : finalStr));
        }
        setInterimTranscript(interimStr);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage(
            language === 'id'
              ? 'Izin mikrofon belum diberikan. Silakan aktifkan mikrofon di browser atau ketik teks di bawah.'
              : 'Microphone permission denied. Please allow microphone access or type below.'
          );
        } else if (event.error === 'no-speech') {
          setErrorMessage(
            language === 'id'
              ? 'Suara tidak terdeteksi. Silakan coba bicara lagi lebih dekat ke mikrofon.'
              : 'No speech detected. Please speak closer to the microphone.'
          );
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  // Timer counter when listening
  useEffect(() => {
    if (isListening) {
      setListenSeconds(0);
      timerRef.current = setInterval(() => {
        setListenSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening]);

  // Waveform visualization loop
  useEffect(() => {
    if (!isListening) {
      setWaveformData([15, 25, 45, 60, 40, 20, 35, 55, 75, 50, 30, 20]);
      return;
    }

    const interval = setInterval(() => {
      setWaveformData(
        Array.from({ length: 14 }, () => Math.floor(Math.random() * 65) + 20)
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isListening]);

  const toggleListening = () => {
    setErrorMessage(null);
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setTranscript('');
      setInterimTranscript('');
      setParsedItems([]);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.warn('Could not start recognition:', e);
          setIsListening(true);
        }
      } else {
        setIsListening(true);
      }
    }
  };

  const handleParseTranscript = async (textToParse = transcript || interimTranscript) => {
    const text = textToParse.trim();
    if (!text) {
      setErrorMessage(
        language === 'id'
          ? 'Silakan bicara atau ketik pengeluaran Anda terlebih dahulu.'
          : 'Please speak or enter an expense statement first.'
      );
      return;
    }

    setIsParsing(true);
    setErrorMessage(null);

    // Stop listening if active
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    }

    try {
      const res = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userCurrency: currency,
          referenceDate: new Date().toISOString().split('T')[0],
          learnedMappings,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to deconstruct expenses');
      }

      const data = await res.json();
      let items: ParsedItemCandidate[] = data.parsedItems || [];

      // Apply client-side learned mappings if available
      if (learnedMappings) {
        items = items.map((it) => {
          const matchKey = Object.keys(learnedMappings).find((k) =>
            it.title.toLowerCase().includes(k.toLowerCase())
          );
          if (matchKey) {
            return { ...it, category: learnedMappings[matchKey] };
          }
          return it;
        });
      }

      setParsedItems(items);
      setDetectedLanguage(data.languageDetected || 'Mixed');
      setParsingNotes(data.parsingNotes || '');

      if (!items || items.length === 0) {
        setErrorMessage(
          language === 'id'
            ? 'Nominal belum terdeteksi. Coba katakan: "35 ribu buat mie ayam" atau "kopi ceban".'
            : 'No clear amount detected. Try saying: "25k for coffee" or "50 thousand for groceries".'
        );
      }
    } catch (err: any) {
      console.error('Parse failed:', err);
      setErrorMessage(err.message || 'Error deconstructing voice items.');
    } finally {
      setIsParsing(false);
    }
  };

  const updateItemField = (index: number, field: keyof ParsedItemCandidate, val: any) => {
    setParsedItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });

    // If user corrected category, learn this mapping
    if (field === 'category' && onLearnMapping && parsedItems[index]) {
      const merchant = parsedItems[index].title.trim();
      if (merchant && merchant.length > 2) {
        onLearnMapping(merchant, val);
      }
    }
  };

  const removeItem = (index: number) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirmAll = () => {
    if (parsedItems.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const fullTranscript = transcript || interimTranscript;
      const nowIso = new Date().toISOString();

      const formattedRecords: Omit<ExpenseRecord, 'id'>[] = parsedItems.map((item) => ({
        title: item.title,
        amount: Number(item.amount) || 0,
        category: item.category,
        date: item.date ? `${item.date}T12:00:00.000Z` : nowIso,
        rawVoiceTranscript: fullTranscript,
        source: 'voice',
        notes: item.notes || `AI: ${item.title}`,
        confidence: item.confidence ?? 0.95,
        detectedLanguage,
      }));

      onConfirmExpenses(formattedRecords);

      // Trigger celebratory confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#34d399', '#059669', '#6ee7b7'],
      });

      handleResetAndClose();
    } catch (err: any) {
      console.error('Save failed:', err);
      setErrorMessage('Failed to save expenses. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
    setTranscript('');
    setInterimTranscript('');
    setParsedItems([]);
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  const totalParsedAmount = parsedItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const formattedTimer = `${String(Math.floor(listenSeconds / 60)).padStart(2, '0')}:${String(
    listenSeconds % 60
  ).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={handleResetAndClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#0f171a] via-[#0b1013] to-[#080d0f] p-6 sm:p-8 shadow-[0_0_60px_rgba(16,185,129,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                {language === 'id' ? 'Catat Pengeluaran Suara Pintar' : 'Smart Voice Expense Engine'}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'id' ? 'Mendukung bahasa gaul (ceban, goceng, rebu) & gabungan banyak transaksi' : 'Supports slang (ceban, 25k, yesterday) & compound multi-item speech'}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Central Voice Recording Hub */}
        <div className="my-6 flex flex-col items-center justify-center rounded-2xl border border-emerald-500/15 bg-gradient-to-b from-emerald-950/20 to-transparent p-6 text-center">
          {/* Glowing Emerald Microphone Button */}
          <button
            id="modal-voice-record-btn"
            type="button"
            onClick={toggleListening}
            className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 ${
              isListening
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-300 text-emerald-950 shadow-[0_0_50px_rgba(52,211,153,0.8)] scale-105'
                : 'bg-emerald-950/70 border-2 border-emerald-500/40 text-emerald-400 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/40" />
            )}
            {isListening ? (
              <MicOff className="h-10 w-10 relative z-10" />
            ) : (
              <Mic className="h-10 w-10 relative z-10" />
            )}
          </button>

          {/* Listening Timer and Live Waveform */}
          {isListening && (
            <div className="mt-3 flex items-center space-x-1.5 text-xs font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-full">
              <Clock className="h-3.5 w-3.5 animate-spin" />
              <span>{formattedTimer}</span>
            </div>
          )}

          <div className="mt-4 flex h-8 items-center justify-center space-x-1.5 px-4">
            {waveformData.map((height, idx) => (
              <div
                key={idx}
                className="w-1.5 rounded-full transition-all duration-150"
                style={{
                  height: `${isListening ? height : 6}px`,
                  backgroundColor: isListening ? '#34d399' : 'rgba(16, 185, 129, 0.25)',
                  boxShadow: isListening ? '0 0 8px rgba(52,211,153,0.6)' : 'none',
                }}
              />
            ))}
          </div>

          <p className="mt-3 text-xs font-medium text-slate-200">
            {isListening
              ? language === 'id' ? 'Mendengarkan ucapan Anda secara langsung...' : 'Listening in real-time... Speak naturally'
              : t.tapToSpeak}
          </p>
        </div>

        {/* Live Transcript Box */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center space-x-1.5">
              <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>{language === 'id' ? 'Pratinjau Suara / Teks' : 'Transcribed Speech Preview'}</span>
            </span>
            {transcript && (
              <button
                type="button"
                onClick={() => setTranscript('')}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <textarea
            rows={2}
            value={transcript || interimTranscript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={t.speechTip}
            className="w-full resize-none rounded-xl border border-white/10 bg-[#080d0f] p-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />

          {/* Preset Quick Chips */}
          <div className="mt-3">
            <p className="text-[11px] font-medium text-slate-400 mb-2">
              {language === 'id' ? 'Coba Contoh Frasa Cepat:' : 'Try Preset Phrases:'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PHRASES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setTranscript(preset.text);
                    handleParseTranscript(preset.text);
                  }}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 px-2.5 py-1 text-[11px] text-emerald-300 hover:border-emerald-400/40 hover:bg-emerald-900/30 transition-all text-left"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parse Button */}
          <div className="mt-4 flex justify-end">
            <button
              id="deconstruct-speech-btn"
              type="button"
              disabled={isParsing || (!transcript && !interimTranscript)}
              onClick={() => handleParseTranscript()}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-semibold text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isParsing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{language === 'id' ? 'Menganalisis Suara...' : 'Deconstructing Speech...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>{language === 'id' ? 'Ekstrak Menjadi Transaksi' : 'Extract into Expenses'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Multi-Item Confirmation Sheet before saving */}
        {parsedItems.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  {parsedItems.length}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  {t.reviewBeforeSave}
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400">
                Total: {formatCurrency(totalParsedAmount, currency)}
              </span>
            </div>

            {/* Item Confirmation Cards */}
            <div className="space-y-3">
              {parsedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:border-emerald-500/30"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    {/* Merchant / Title */}
                    <div className="sm:col-span-4">
                      <label className="text-[10px] uppercase font-semibold text-slate-400">
                        {t.merchantOrTitle}
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItemField(idx, 'title', e.target.value)}
                        className="w-full bg-transparent font-semibold text-sm text-white focus:outline-none border-b border-transparent focus:border-emerald-500/50"
                      />
                    </div>

                    {/* Amount */}
                    <div className="sm:col-span-3">
                      <label className="text-[10px] uppercase font-semibold text-slate-400">
                        {t.amount} ({currency})
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatNominal(item.amount)}
                        onChange={(e) => updateItemField(idx, 'amount', parseNominal(e.target.value))}
                        className="w-full bg-transparent font-mono font-bold text-sm text-emerald-300 focus:outline-none border-b border-transparent focus:border-emerald-500/50"
                      />
                    </div>

                    {/* Category */}
                    <div className="sm:col-span-4">
                      <label className="text-[10px] uppercase font-semibold text-slate-400">
                        {t.category}
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => updateItemField(idx, 'category', e.target.value as ExpenseCategory)}
                        className="w-full rounded-lg border border-white/10 bg-[#080d0f] px-2 py-1 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Remove button */}
                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Date and Confidence badge */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <input
                        type="date"
                        value={item.date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => updateItemField(idx, 'date', e.target.value)}
                        className="bg-transparent text-slate-300 text-xs font-mono focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.confidence && item.confidence < 0.8 ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <HelpCircle className="h-3 w-3" />
                          <span>{t.confidenceLow}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Check className="h-3 w-3" />
                          <span>{t.confidenceHigh}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Bar: Save / Cancel Confirmation Sheet */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 hover:bg-white/[0.08]"
              >
                {t.cancel}
              </button>

              <button
                id="confirm-parsed-expenses-btn"
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmAll}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 px-6 py-2.5 text-xs font-bold text-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{language === 'id' ? 'Menyimpan...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>
                      {language === 'id'
                        ? `Simpan ${parsedItems.length} Pengeluaran (${formatCurrency(totalParsedAmount, currency)})`
                        : `Confirm & Save ${parsedItems.length} Items (${formatCurrency(totalParsedAmount, currency)})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
