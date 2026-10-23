import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Mic,
  Compass,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CurrencyCode, UserProfile, ExpenseRecord } from '../types';
import { apiLogin, apiRegister, AuthResponse } from '../lib/auth';
import { formatNominal, parseNominal } from '../lib/currencies';

interface AuthScreenProps {
  onAuthenticated: (authData: AuthResponse) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('IDR');
  const [monthlyIncome, setMonthlyIncome] = useState<string>('12,000,000');
  const [goalTitle, setGoalTitle] = useState('Emergency Reserve');
  const [goalTarget, setGoalTarget] = useState<string>('30,000,000');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await apiLogin({ email: email.trim(), password });
      onAuthenticated(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await apiRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        currency,
        monthlyIncome: parseNominal(monthlyIncome) || undefined,
        goalTitle: goalTitle.trim() || undefined,
        goalTarget: parseNominal(goalTarget) || undefined,
      });
      onAuthenticated(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiLogin({
        email: 'demo@savely.finance',
        password: 'savely123',
      });
      onAuthenticated(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#070b0d] text-white selection:bg-emerald-500 selection:text-emerald-950 overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-emerald-950/20 blur-[160px]" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 px-4 py-1.5 shadow-[0_0_20px_rgba(16,185,129,0.15)] mb-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300">
              Savely • Autonomous Financial Intelligence
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome to <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Savely</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {isRegisterMode
              ? 'Create your personal account to establish your tailored baseline safe-to-spend allowance and clean ledger.'
              : 'Sign in to access your real-time velocity metrics, voice expense logs, and AI advisory trajectory.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-[#0e1619] via-[#0a1012] to-[#070b0d] p-6 sm:p-8 shadow-[0_0_80px_rgba(16,185,129,0.12)] backdrop-blur-xl">
          {/* Tab Selector: Login vs Sign Up */}
          <div className="flex rounded-2xl border border-white/5 bg-white/[0.02] p-1 mb-6">
            <button
              id="switch-to-login-tab"
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegisterMode
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              id="switch-to-register-tab"
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isRegisterMode
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-emerald-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start space-x-2">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          {!isRegisterMode ? (
            /* =================== LOGIN FORM =================== */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] py-2.5 pl-10 pr-10 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="submit-login-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 py-3 text-xs font-bold text-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <span>Signing In...</span>
                  ) : (
                    <>
                      <span>Enter Savely</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Quick Demo Login Option */}
              <div className="pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 hover:border-emerald-500/40 transition-all flex items-center justify-center space-x-2"
                >
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  <span>One-Click Demo Account (Alex Pratama)</span>
                </button>
              </div>

              {/* Option to create account */}
              <p className="text-center text-xs text-slate-400 pt-2">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMessage(null);
                  }}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Create your account first
                </button>
              </p>
            </form>
          ) : (
            /* =================== REGISTER FORM =================== */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="register-name-input"
                    type="text"
                    required
                    placeholder="e.g., Sarah Chen / Budi Santoso"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] py-2.5 pl-10 pr-3.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="register-email-input"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#080d0f] py-2.5 pl-10 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Password (6+ chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="register-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#080d0f] py-2.5 pl-10 pr-9 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Currency & Income setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Base Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="IDR">IDR (Rp - Indonesian Rupiah)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="SGD">SGD (S$ - Singapore Dollar)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Monthly Take-Home ({currency})
                  </label>
                  <input
                    id="register-monthly-income-input"
                    type="text"
                    inputMode="numeric"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(formatNominal(e.target.value))}
                    placeholder="e.g. 15,000,000"
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono font-bold text-emerald-300 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Starting Savings Goal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Savings Goal Name
                  </label>
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    placeholder="e.g., Emergency Reserve"
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Target Goal Amount ({currency})
                  </label>
                  <input
                    id="register-goal-target-input"
                    type="text"
                    inputMode="numeric"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(formatNominal(e.target.value))}
                    placeholder="e.g. 30,000,000"
                    className="w-full rounded-xl border border-white/10 bg-[#080d0f] p-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Clean Template Banner */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] text-emerald-300 flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Clean Slate Provisioning:</strong> Your account will be initialized with a clean template, ready for your first voice expense record.
                </span>
              </div>

              <div className="pt-2">
                <button
                  id="submit-register-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 py-3 text-xs font-bold text-emerald-950 shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:brightness-110 active:scale-[0.99] disabled:opacity-50 transition-all"
                >
                  {isLoading ? (
                    <span>Provisioning Clean Account...</span>
                  ) : (
                    <>
                      <span>Create Account & Start</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-slate-400 pt-2">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMessage(null);
                  }}
                  className="text-emerald-400 font-semibold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            </form>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-3.5">
            <Mic className="h-4 w-4 text-emerald-400 mb-1.5 mx-auto sm:mx-0" />
            <p className="text-xs font-bold text-white">Voice-to-Expense</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Casual Indonesian & English compound speech parser.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-3.5">
            <Zap className="h-4 w-4 text-teal-400 mb-1.5 mx-auto sm:mx-0" />
            <p className="text-xs font-bold text-white">Safe-to-Spend</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Daily and weekly equilibrium recalculated live.
            </p>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-3.5">
            <Compass className="h-4 w-4 text-emerald-300 mb-1.5 mx-auto sm:mx-0" />
            <p className="text-xs font-bold text-white">Persistent Database</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Dedicated user history and secure session tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
