import React, { useState } from 'react';
import { Database, X, Check, Cloud, Download, Upload, ShieldCheck, Key } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, getSupabaseClient } from '../lib/supabase';
import { ExpenseRecord, UserProfile } from '../types';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  expenses: ExpenseRecord[];
  onImportData: (profile: UserProfile, expenses: ExpenseRecord[]) => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  expenses,
  onImportData,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = async () => {
    setIsTesting(true);
    setStatusMessage(null);
    saveSupabaseConfig(url, anonKey);

    const client = getSupabaseClient();
    if (client) {
      try {
        // Quick ping
        const { error } = await client.from('user_profiles').select('id').limit(1);
        if (error && !error.message.includes('relation "user_profiles" does not exist')) {
          setStatusMessage(`Connected with notice: ${error.message}`);
        } else {
          setStatusMessage('Supabase credentials verified successfully! Cloud persistence active.');
        }
      } catch (err: any) {
        setStatusMessage('Saved locally. Will sync whenever remote tables are available.');
      }
    } else {
      setStatusMessage('Credentials saved.');
    }
    setIsTesting(false);
  };

  const handleExportBackup = () => {
    const data = {
      userProfile,
      expenses,
      exportedAt: new Date().toISOString(),
      app: 'Savely',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `savely-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(href);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.userProfile && parsed.expenses) {
          onImportData(parsed.userProfile, parsed.expenses);
          setStatusMessage('Backup imported successfully!');
        } else {
          setStatusMessage('Invalid backup format.');
        }
      } catch (err) {
        setStatusMessage('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-teal-500/30 bg-gradient-to-b from-[#0e1619] to-[#070b0d] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                Supabase & Cloud Storage
              </h3>
              <p className="text-xs text-slate-400">
                Configure real-time PostgreSQL database & authentication sync
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Supabase Project URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Supabase Anon Public Key</label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono text-white focus:border-teal-500 focus:outline-none"
            />
          </div>

          {statusMessage && (
            <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-3 text-xs text-teal-300">
              {statusMessage}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleSaveConfig}
              className="inline-flex items-center space-x-2 rounded-xl bg-teal-500 px-5 py-2.5 text-xs font-bold text-teal-950 shadow-md hover:brightness-110"
            >
              <Check className="h-4 w-4" />
              <span>{isTesting ? 'Connecting...' : 'Save & Connect Supabase'}</span>
            </button>
          </div>

          {/* Backup & Restore Utility */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Offline Persistence & Data Portability
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex-1 inline-flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-xs text-slate-300 hover:bg-white/[0.06]"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400" />
                <span>Export JSON</span>
              </button>

              <label className="flex-1 inline-flex items-center justify-center space-x-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-xs text-slate-300 hover:bg-white/[0.06] cursor-pointer">
                <Upload className="h-3.5 w-3.5 text-teal-400" />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
