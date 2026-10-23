import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  User,
  Clock,
  ShieldCheck,
  Database,
  RefreshCw,
  Calendar,
  CheckCircle2,
  LogIn,
  LogOut,
  FolderSync,
} from 'lucide-react';
import { AuthUser, UserSessionHistoryItem, apiFetchUserHistory } from '../lib/auth';

interface UserHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
}

export const UserHistoryModal: React.FC<UserHistoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
}) => {
  const [historyData, setHistoryData] = useState<{
    user: AuthUser;
    loginHistory: UserSessionHistoryItem[];
    expensesCount: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetchUserHistory();
      if (data) {
        setHistoryData(data);
      }
    } catch (e) {
      console.error('Failed to load user history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-emerald-500/25 bg-gradient-to-b from-[#0e1619] via-[#0a1012] to-[#070b0d] p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">
                User Database & Session History
              </h3>
              <p className="text-xs text-slate-400">
                Audited server database records & authenticated session activity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Account Overview Card */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-300 font-display font-bold text-lg">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-white text-base">{currentUser.name}</h4>
                <p className="text-xs text-slate-400 font-mono">{currentUser.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-mono text-emerald-300 font-bold">
                {currentUser.currency}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 font-mono">
                {historyData?.expensesCount ?? 0} Transactions
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/5 text-xs text-slate-400">
            <div>
              <span className="block text-[10px] uppercase font-semibold text-slate-500">Account Created</span>
              <span className="text-slate-300 font-mono">
                {new Date(currentUser.createdAt).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-semibold text-slate-500">Last Login Timestamp</span>
              <span className="text-emerald-400 font-mono">
                {new Date(currentUser.lastLoginAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Activity & Session Logs Timeline */}
        <div className="mt-6">
          <div className="flex items-center justify-between pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <History className="h-4 w-4 text-emerald-400" />
              <span>Session & Audit History</span>
            </h4>
            <button
              type="button"
              onClick={loadHistory}
              disabled={isLoading}
              className="inline-flex items-center space-x-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {historyData?.loginHistory && historyData.loginHistory.length > 0 ? (
              historyData.loginHistory.map((item) => {
                const isLogin = item.action === 'login';
                const isRegister = item.action === 'register';
                const isLogout = item.action === 'logout';

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between rounded-xl border border-white/5 bg-white/[0.015] p-3 text-xs"
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="mt-0.5">
                        {isRegister && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                        {isLogin && <LogIn className="h-4 w-4 text-teal-400" />}
                        {isLogout && <LogOut className="h-4 w-4 text-slate-400" />}
                        {!isRegister && !isLogin && !isLogout && (
                          <FolderSync className="h-4 w-4 text-emerald-300" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white capitalize">
                            {item.action.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        {item.details && (
                          <p className="mt-0.5 text-[11px] text-slate-400">{item.details}</p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(item.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-xs text-slate-500">
                {isLoading ? 'Loading history logs...' : 'No activity logs found.'}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
          >
            Log Out Account
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-5 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
