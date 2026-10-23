import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sparkles, RefreshCw, Undo2, X } from 'lucide-react';
import { UserProfile, ExpenseRecord, CurrencyCode, NavTab, SavingsGoal, ExpenseCategory } from './types';
import {
  loadUserProfile,
  saveUserProfile,
  loadExpenses,
  saveExpenses,
} from './lib/storage';
import { calculateFinancialHealth, generateRiskInsights } from './lib/calculations';
import {
  AuthUser,
  AuthResponse,
  apiGetCurrentUser,
  apiLogout,
  apiSyncUserData,
} from './lib/auth';
import { translations, Language, getSystemLanguage } from './lib/i18n';

// Components
import { AuthScreen } from './components/AuthScreen';
import { TopBar } from './components/TopBar';
import { NavigationSidebar } from './components/NavigationSidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FloatingMicButton } from './components/FloatingMicButton';
import { HeroProgress } from './components/HeroProgress';
import { AnalyticsGrid } from './components/AnalyticsGrid';
import { TransactionsView } from './components/TransactionsView';
import { GoalsView } from './components/GoalsView';
import { SettingsView } from './components/SettingsView';
import { RiskInsightsPanel } from './components/RiskInsightsPanel';
import { VoiceExpenseModal } from './components/VoiceExpenseModal';
import { ReceiptScanModal } from './components/ReceiptScanModal';
import { OnboardingModal } from './components/OnboardingModal';
import { DeepScenarioModal } from './components/DeepScenarioModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { ManualExpenseModal } from './components/ManualExpenseModal';
import { UserHistoryModal } from './components/UserHistoryModal';
import { EditExpenseModal } from './components/EditExpenseModal';
import { CalculationInspectorModal } from './components/CalculationInspectorModal';
import { PinLockScreen } from './components/PinLockScreen';

export default function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(loadExpenses);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // App settings state
  const [language, setLanguage] = useState<Language>(() => {
    return userProfile.settings?.language || getSystemLanguage();
  });
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return userProfile.settings?.theme || 'dark';
  });
  const [hideBalances, setHideBalances] = useState<boolean>(() => {
    return userProfile.settings?.hideBalances || false;
  });

  // PIN lock session gate
  const [isPinUnlocked, setIsPinUnlocked] = useState<boolean>(() => {
    return !userProfile.settings?.pinLockEnabled;
  });

  // Modals state
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deepScenarioOpen, setDeepScenarioOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [userHistoryModalOpen, setUserHistoryModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [calculationInspectorOpen, setCalculationInspectorOpen] = useState(false);

  // 5-second Undo Toast state
  const [undoToast, setUndoToast] = useState<{
    id: string;
    addedExpenseIds: string[];
    message: string;
  } | null>(null);

  // Check auth on initial load
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await apiGetCurrentUser();
        if (session) {
          setCurrentUser(session.user);
          setUserProfile(session.profile);
          setExpenses(session.expenses || []);
          if (session.profile?.settings?.language) {
            setLanguage(session.profile.settings.language);
          }
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // Sync to server database and local cache
  const syncData = useCallback(
    (profile: UserProfile, expList: ExpenseRecord[]) => {
      saveUserProfile(profile);
      saveExpenses(expList);
      if (currentUser) {
        apiSyncUserData(profile, expList);
      }
    },
    [currentUser]
  );

  // Financial Health Metrics & Risk Insights
  const metrics = useMemo(() => {
    return calculateFinancialHealth(userProfile, expenses);
  }, [userProfile, expenses]);

  const insights = useMemo(() => {
    return generateRiskInsights(userProfile, metrics, expenses, language);
  }, [userProfile, metrics, expenses, language]);

  // Auth Handlers
  const handleAuthenticated = (authData: AuthResponse) => {
    setCurrentUser(authData.user);
    setUserProfile(authData.profile);
    setExpenses(authData.expenses || []);
    saveUserProfile(authData.profile);
    saveExpenses(authData.expenses || []);
    if (authData.profile?.settings?.language) {
      setLanguage(authData.profile.settings.language);
    }
  };

  const handleLogout = async () => {
    await apiLogout();
    setCurrentUser(null);
    setUserHistoryModalOpen(false);
  };

  // Preference Handlers
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    const updated = {
      ...userProfile,
      settings: {
        ...(userProfile.settings || {
          theme: 'dark',
          hideBalances: false,
          pinLockEnabled: false,
          remindersEnabled: true,
          reminderTime: '20:00',
          streakCount: 4,
          lastLoggedDate: new Date().toISOString().split('T')[0],
        }),
        language: newLang,
      },
    };
    setUserProfile(updated);
    syncData(updated, expenses);
  };

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    const updated = {
      ...userProfile,
      currency: newCurrency,
    };
    setUserProfile(updated);
    syncData(updated, expenses);
  };

  const handleToggleHideBalances = () => {
    const newHide = !hideBalances;
    setHideBalances(newHide);
    const updated = {
      ...userProfile,
      settings: {
        ...(userProfile.settings || {}),
        hideBalances: newHide,
      } as any,
    };
    setUserProfile(updated);
    syncData(updated, expenses);
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const updated = {
      ...userProfile,
      settings: {
        ...(userProfile.settings || {}),
        theme: newTheme,
      } as any,
    };
    setUserProfile(updated);
    syncData(updated, expenses);
  };

  // Learned merchant mappings
  const handleLearnMapping = (merchant: string, cat: ExpenseCategory) => {
    const cleanMerchant = merchant.toLowerCase().trim();
    const updatedMappings = {
      ...(userProfile.merchantMappings || {}),
      [cleanMerchant]: cat,
    };
    const updated = {
      ...userProfile,
      merchantMappings: updatedMappings,
    };
    setUserProfile(updated);
    syncData(updated, expenses);
  };

  // Multiple Goals update handler
  const handleUpdateGoals = (newGoals: SavingsGoal[]) => {
    const primaryGoal = newGoals[0] || userProfile.savingsGoal;
    const updated = {
      ...userProfile,
      savingsGoal: primaryGoal,
      goals: newGoals,
    };
    setUserProfile(updated);
    syncData(updated, expenses);
  };

  // Streak update on logging expense
  const updateStreak = (currentProfile: UserProfile): UserProfile => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = currentProfile.settings?.lastLoggedDate;
    let currentStreak = currentProfile.settings?.streakCount || 1;

    if (lastDate !== todayStr) {
      currentStreak += 1;
    }

    return {
      ...currentProfile,
      settings: {
        ...(currentProfile.settings || {}),
        streakCount: currentStreak,
        lastLoggedDate: todayStr,
      } as any,
    };
  };

  // Add Expense Handlers (with 5-second Undo Toast)
  const handleConfirmVoiceExpenses = (newItems: Omit<ExpenseRecord, 'id'>[]) => {
    const timestamp = Date.now();
    const created: ExpenseRecord[] = newItems.map((item, idx) => ({
      ...item,
      id: `exp_${timestamp}_${idx}`,
    }));

    const updated = [...created, ...expenses];
    const profileWithStreak = updateStreak(userProfile);
    setExpenses(updated);
    setUserProfile(profileWithStreak);
    syncData(profileWithStreak, updated);

    // Trigger 5-second undo toast
    setUndoToast({
      id: `undo_${timestamp}`,
      addedExpenseIds: created.map((c) => c.id),
      message:
        language === 'id'
          ? `${created.length} pengeluaran berhasil dicatat.`
          : `${created.length} expense(s) recorded successfully.`,
    });
  };

  const handleAddManualExpense = (item: Omit<ExpenseRecord, 'id'>) => {
    const timestamp = Date.now();
    const created: ExpenseRecord = {
      ...item,
      id: `exp_${timestamp}`,
    };
    const updated = [created, ...expenses];
    const profileWithStreak = updateStreak(userProfile);
    setExpenses(updated);
    setUserProfile(profileWithStreak);
    syncData(profileWithStreak, updated);

    setUndoToast({
      id: `undo_${timestamp}`,
      addedExpenseIds: [created.id],
      message:
        language === 'id'
          ? `"${created.title}" berhasil dicatat.`
          : `"${created.title}" logged successfully.`,
    });
  };

  // Undo last logged expense(s)
  const handleUndo = () => {
    if (!undoToast) return;
    const toRemoveIds = new Set(undoToast.addedExpenseIds);
    const updated = expenses.filter((e) => !toRemoveIds.has(e.id));
    setExpenses(updated);
    syncData(userProfile, updated);
    setUndoToast(null);
  };

  // Auto-dismiss undo toast after 5 seconds
  useEffect(() => {
    if (!undoToast) return;
    const timer = setTimeout(() => {
      setUndoToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [undoToast]);

  const handleSaveEditedExpense = (updatedExp: ExpenseRecord) => {
    const updated = expenses.map((e) => (e.id === updatedExp.id ? updatedExp : e));
    setExpenses(updated);
    syncData(userProfile, updated);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    syncData(userProfile, updated);
  };

  const handleBulkDeleteExpenses = (ids: string[]) => {
    const idSet = new Set(ids);
    const updated = expenses.filter((e) => !idSet.has(e.id));
    setExpenses(updated);
    syncData(userProfile, updated);
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    syncData(updatedProfile, expenses);
  };

  const handleImportData = (newProfile: UserProfile, newExpenses: ExpenseRecord[]) => {
    setUserProfile(newProfile);
    setExpenses(newExpenses);
    syncData(newProfile, newExpenses);
  };

  // 1. Initial Auth Check Loading State
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#070b0d] text-white">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <Sparkles className="h-8 w-8 animate-pulse" />
          <span className="absolute -inset-2 rounded-2xl bg-emerald-400/20 blur-md animate-pulse" />
        </div>
        <p className="mt-6 font-display font-bold text-lg text-white tracking-wide">
          Savely Intelligence Vault
        </p>
        <p className="mt-1 text-xs text-slate-400 flex items-center space-x-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
          <span>Verifying encrypted user session...</span>
        </p>
      </div>
    );
  }

  // 2. Auth Gate Screen
  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  // 3. Privacy PIN Lock Screen Gate (if PIN enabled and not yet unlocked this session)
  if (userProfile.settings?.pinLockEnabled && !isPinUnlocked) {
    return (
      <PinLockScreen
        correctPin={userProfile.settings?.pinCode || '1234'}
        language={language}
        onUnlocked={() => setIsPinUnlocked(true)}
      />
    );
  }

  const t = translations[language];

  // 4. Authenticated Application
  return (
    <div
      className={`min-h-screen bg-[#080c0e] text-[#f1f5f9] selection:bg-emerald-500 selection:text-emerald-950 flex flex-col lg:flex-row pb-24 lg:pb-12 ${
        theme === 'light' ? 'theme-light' : ''
      }`}
    >
      {/* Real Desktop Navigation Sidebar */}
      <NavigationSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={language}
        streakCount={userProfile.settings?.streakCount || 1}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Simplified Header */}
        <TopBar
          userProfile={userProfile}
          metrics={metrics}
          currentUser={currentUser}
          language={language}
          hideBalances={hideBalances}
          theme={theme}
          onLanguageChange={handleLanguageChange}
          onCurrencyChange={handleCurrencyChange}
          onToggleHideBalances={handleToggleHideBalances}
          onToggleTheme={handleToggleTheme}
          onOpenProfile={() => setProfileModalOpen(true)}
          onNavigateTab={setActiveTab}
          onLogout={handleLogout}
        />

        {/* Dynamic Tab Views Container */}
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8 flex-1">
          {activeTab === 'home' && (
            <>
              {/* Dominant Hero Card */}
              <HeroProgress
                userProfile={userProfile}
                metrics={metrics}
                expenses={expenses}
                language={language}
                hideBalances={hideBalances}
                onOpenAddManual={() => setManualModalOpen(true)}
                onOpenScanReceipt={() => setReceiptModalOpen(true)}
                onOpenGoalEdit={() => setActiveTab('goals')}
                onOpenCalculationInspector={() => setCalculationInspectorOpen(true)}
              />

              {/* Risk Insights Panel & Deep Scenario Button */}
              <RiskInsightsPanel
                insights={insights}
                userProfile={userProfile}
                metrics={metrics}
                language={language}
                onOpenDeepScenario={() => setDeepScenarioOpen(true)}
              />

              {/* Quick Analytics Overview */}
              <AnalyticsGrid
                expenses={expenses}
                userProfile={userProfile}
                metrics={metrics}
                language={language}
                hideBalances={hideBalances}
                onDeleteExpense={handleDeleteExpense}
                onEditExpense={(exp) => setEditingExpense(exp)}
                onOpenAddManual={() => setManualModalOpen(true)}
              />
            </>
          )}

          {activeTab === 'analytics' && (
            <AnalyticsGrid
              expenses={expenses}
              userProfile={userProfile}
              metrics={metrics}
              language={language}
              hideBalances={hideBalances}
              onDeleteExpense={handleDeleteExpense}
              onEditExpense={(exp) => setEditingExpense(exp)}
              onOpenAddManual={() => setManualModalOpen(true)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              expenses={expenses}
              userProfile={userProfile}
              language={language}
              hideBalances={hideBalances}
              onDeleteExpense={handleDeleteExpense}
              onBulkDeleteExpenses={handleBulkDeleteExpenses}
              onEditExpense={(exp) => setEditingExpense(exp)}
              onOpenAddManual={() => setManualModalOpen(true)}
              onOpenVoiceModal={() => setVoiceModalOpen(true)}
            />
          )}

          {activeTab === 'goals' && (
            <GoalsView
              userProfile={userProfile}
              language={language}
              hideBalances={hideBalances}
              onUpdateGoals={handleUpdateGoals}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              userProfile={userProfile}
              language={language}
              theme={theme}
              hideBalances={hideBalances}
              onLanguageChange={handleLanguageChange}
              onCurrencyChange={handleCurrencyChange}
              onToggleTheme={handleToggleTheme}
              onToggleHideBalances={handleToggleHideBalances}
              onSaveProfile={handleSaveProfile}
            />
          )}
        </main>
      </div>

      {/* Real Mobile Bottom Tab Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={language}
      />

      {/* Single Primary Floating Microphone Button */}
      <FloatingMicButton
        onClick={() => setVoiceModalOpen(true)}
        language={language}
      />

      {/* 5-Second Undo Toast */}
      {undoToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-3 rounded-2xl border border-emerald-500/30 bg-[#0c1418] px-4 py-3 text-xs shadow-2xl backdrop-blur-xl animate-fade-in"
        >
          <span className="text-white font-medium">{undoToast.message}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="inline-flex items-center space-x-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>{t.undo} (5s)</span>
          </button>
          <button
            type="button"
            onClick={() => setUndoToast(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <VoiceExpenseModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        currency={userProfile.currency}
        language={language}
        learnedMappings={userProfile.merchantMappings}
        onLearnMapping={handleLearnMapping}
        onConfirmExpenses={handleConfirmVoiceExpenses}
      />

      <ReceiptScanModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        currency={userProfile.currency}
        language={language}
        onConfirmExpense={handleAddManualExpense}
      />

      <ManualExpenseModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        currency={userProfile.currency}
        language={language}
        onAddExpense={handleAddManualExpense}
      />

      <EditExpenseModal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        expense={editingExpense}
        currency={userProfile.currency}
        onSaveExpense={handleSaveEditedExpense}
        onDeleteExpense={handleDeleteExpense}
      />

      <CalculationInspectorModal
        isOpen={calculationInspectorOpen}
        onClose={() => setCalculationInspectorOpen(false)}
        userProfile={userProfile}
        metrics={metrics}
      />

      <OnboardingModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentProfile={userProfile}
        language={language}
        onSaveProfile={handleSaveProfile}
        onOpenVoiceTest={() => setVoiceModalOpen(true)}
        isInitialOnboarding={false}
      />

      <DeepScenarioModal
        isOpen={deepScenarioOpen}
        onClose={() => setDeepScenarioOpen(false)}
        userProfile={userProfile}
        metrics={metrics}
        expenses={expenses}
      />

      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        userProfile={userProfile}
        expenses={expenses}
        onImportData={handleImportData}
      />

      <UserHistoryModal
        isOpen={userHistoryModalOpen}
        onClose={() => setUserHistoryModalOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    </div>
  );
}
