import { ExpenseRecord, UserProfile, CurrencyCode } from '../types';
import { getSupabaseClient } from './supabase';

const PROFILE_KEY = 'savely_user_profile';
const EXPENSES_KEY = 'savely_expenses';

export function getDefaultProfile(): UserProfile {
  const nextYear = new Date().getFullYear();
  const baseGoal = {
    id: 'goal_1',
    title: 'Emergency Reserve',
    targetAmount: 50000000, // 50jt
    currentSaved: 28500000, // 28.5jt
    deadlineDate: `${nextYear + 1}-06-30`,
    monthlyTargetContribution: 2500000, // 2.5jt allocated per month
    priority: 'high' as const,
    category: 'Milestone',
    color: '#10b981',
    icon: 'Shield',
  };

  const vacationGoal = {
    id: 'goal_2',
    title: 'Japan Autumn Trip',
    targetAmount: 30000000, // 30jt
    currentSaved: 12000000, // 12jt
    deadlineDate: `${nextYear}-11-15`,
    monthlyTargetContribution: 1000000, // 1jt allocated per month
    priority: 'medium' as const,
    category: 'Travel',
    color: '#06b6d4',
    icon: 'Plane',
  };

  return {
    id: 'usr_savely_prime',
    name: 'Muadzar Arfan',
    email: 'muadzarfan681@gmail.com',
    currency: 'IDR',
    monthlyIncome: 15000000, // 15jt IDR monthly income
    fixedBills: [
      { id: 'b1', name: 'Apartment / Kost Rent', amount: 3200000, dueDay: 1, category: 'Housing', active: true, isPaidThisMonth: true },
      { id: 'b2', name: 'High-speed Fiber Internet', amount: 450000, dueDay: 10, category: 'Utilities & Bills', active: true, isPaidThisMonth: true },
      { id: 'b3', name: 'Electricity PLN Token', amount: 400000, dueDay: 15, category: 'Utilities & Bills', active: true, isPaidThisMonth: true },
      { id: 'b4', name: 'BPJS Health Insurance', amount: 150000, dueDay: 10, category: 'Health & Wellness', active: true, isPaidThisMonth: true },
      { id: 'b5', name: 'Cloud & Media Subscriptions', amount: 280000, dueDay: 20, category: 'Entertainment & Leisure', active: true, isPaidThisMonth: false },
    ],
    savingsGoal: baseGoal,
    goals: [baseGoal, vacationGoal],
    paydayConfig: {
      scheduleType: 'monthly_date',
      dayOfMonth: 25,
      adjustForWeekend: true,
    },
    incomeSources: [
      { id: 'inc_1', name: 'Tech Lead Salary', amount: 15000000, scheduleType: 'monthly_date', dayOfMonth: 25, isPrimary: true },
    ],
    financialPeriodType: 'payday_cycle',
    priorSpendingCatchup: {
      completed: false,
      dismissedBanner: false,
    },
    categoryBudgets: [
      { category: 'Food & Beverage', monthlyLimit: 3500000 },
      { category: 'Transit & Commute', monthlyLimit: 1200000 },
      { category: 'Shopping & Lifestyle', monthlyLimit: 1500000 },
      { category: 'Groceries', monthlyLimit: 2000000 },
    ],
    recurringItems: [
      { id: 'rec_1', title: 'Tech Lead Salary', amount: 15000000, type: 'income', frequency: 'monthly', category: 'Other', dueDay: 25, active: true },
      { id: 'rec_2', title: 'Kost Rent', amount: 3200000, type: 'expense', frequency: 'monthly', category: 'Housing', dueDay: 1, active: true },
      { id: 'rec_3', title: 'Netflix & Spotify', amount: 280000, type: 'expense', frequency: 'monthly', category: 'Entertainment & Leisure', dueDay: 20, active: true },
    ],
    merchantMappings: {
      'kopi kenangan': 'Food & Beverage',
      'fore coffee': 'Food & Beverage',
      'starbucks': 'Food & Beverage',
      'mie ayam': 'Food & Beverage',
      'indomaret': 'Groceries',
      'alfamart': 'Groceries',
      'super indo': 'Groceries',
      'gojek': 'Transit & Commute',
      'grab': 'Transit & Commute',
      'pln': 'Utilities & Bills',
    },
    settings: {
      language: 'id',
      theme: 'dark',
      hideBalances: false,
      pinLockEnabled: false,
      pinCode: '1234',
      remindersEnabled: true,
      reminderTime: '20:00',
      streakCount: 4,
      lastLoggedDate: new Date().toISOString().split('T')[0],
    },
    onboarded: true,
    createdAt: new Date().toISOString(),
  };
}

export function getDefaultExpenses(): ExpenseRecord[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const today = String(now.getDate()).padStart(2, '0');
  const yesterday = String(Math.max(1, now.getDate() - 1)).padStart(2, '0');
  const twoDaysAgo = String(Math.max(1, now.getDate() - 2)).padStart(2, '0');
  const threeDaysAgo = String(Math.max(1, now.getDate() - 3)).padStart(2, '0');

  return [
    {
      id: 'exp_1',
      title: 'Mie Ayam Jamur Pangsit',
      amount: 25000,
      category: 'Food & Beverage',
      date: `${y}-${m}-${today}T12:30:00.000Z`,
      rawVoiceTranscript: '25 ribu buat makan siang mie ayam',
      source: 'voice',
      confidence: 0.98,
      detectedLanguage: 'id',
      notes: 'Warung Mie Ayam Pakde',
    },
    {
      id: 'exp_2',
      title: 'Ongkos Ojek Grab / Gojek',
      amount: 48000,
      category: 'Transit & Commute',
      date: `${y}-${m}-${today}T08:15:00.000Z`,
      rawVoiceTranscript: 'terus 48 ribu buat ongkos ojek ke kantor',
      source: 'voice',
      confidence: 0.96,
      detectedLanguage: 'id',
      notes: 'Morning rush commuter transit',
    },
    {
      id: 'exp_3',
      title: 'Kopi Kenangan Mantan Latte',
      amount: 35000,
      category: 'Food & Beverage',
      date: `${y}-${m}-${yesterday}T15:20:00.000Z`,
      rawVoiceTranscript: 'beli kopi 35k',
      source: 'voice',
      confidence: 0.99,
      detectedLanguage: 'id-colloquial',
      notes: 'Afternoon caffeine recharge',
    },
    {
      id: 'exp_4',
      title: 'Tagihan Listrik PLN Tambahan',
      amount: 300000,
      category: 'Utilities & Bills',
      date: `${y}-${m}-${yesterday}T10:00:00.000Z`,
      rawVoiceTranscript: 'bayar listrik 300rb',
      source: 'voice',
      confidence: 0.95,
      detectedLanguage: 'id',
      notes: 'Top-up token listrik',
    },
    {
      id: 'exp_5',
      title: 'Weekly Groceries & Buah Segar',
      amount: 285000,
      category: 'Groceries',
      date: `${y}-${m}-${twoDaysAgo}T18:40:00.000Z`,
      rawVoiceTranscript: 'belanja mingguan di supermarket 285 ribu',
      source: 'voice',
      confidence: 0.92,
      detectedLanguage: 'id',
      notes: 'Super Indo produce',
    },
    {
      id: 'exp_6',
      title: 'Tokopedia Wireless Mouse Ergonomic',
      amount: 210000,
      category: 'Shopping & Lifestyle',
      date: `${y}-${m}-${threeDaysAgo}T14:10:00.000Z`,
      rawVoiceTranscript: 'beli mouse wireless di olshop 210k',
      source: 'voice',
      confidence: 0.94,
      detectedLanguage: 'id-colloquial',
      notes: 'Work productivity tool',
    },
  ];
}

export function loadUserProfile(): UserProfile {
  if (typeof window === 'undefined') return getDefaultProfile();
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      const def = getDefaultProfile();
      localStorage.setItem(PROFILE_KEY, JSON.stringify(def));
      return def;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse stored profile:', e);
    return getDefaultProfile();
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    
    // Sync with Supabase asynchronously if client is active
    const client = getSupabaseClient();
    if (client) {
      client.from('user_profiles').upsert({
        id: profile.id,
        name: profile.name,
        currency: profile.currency,
        monthly_income: profile.monthlyIncome,
        savings_goal: profile.savingsGoal,
        fixed_bills: profile.fixedBills,
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.warn('Supabase profile sync notice:', error.message);
      });
    }
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}

export function loadExpenses(): ExpenseRecord[] {
  if (typeof window === 'undefined') return getDefaultExpenses();
  try {
    const raw = localStorage.getItem(EXPENSES_KEY);
    if (!raw) {
      const def = getDefaultExpenses();
      localStorage.setItem(EXPENSES_KEY, JSON.stringify(def));
      return def;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultExpenses();
  } catch (e) {
    console.error('Failed to parse expenses:', e);
    return getDefaultExpenses();
  }
}

export function saveExpenses(expenses: ExpenseRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));

    // Optional Supabase sync
    const client = getSupabaseClient();
    if (client) {
      // Async sync
      expenses.slice(0, 10).forEach((exp) => {
        client.from('expenses').upsert({
          id: exp.id,
          title: exp.title,
          amount: exp.amount,
          category: exp.category,
          date: exp.date,
          raw_transcript: exp.rawVoiceTranscript,
          source: exp.source,
        }).then(({ error }) => {
          if (error) console.warn('Supabase expense upsert notice:', error.message);
        });
      });
    }
  } catch (e) {
    console.error('Failed to save expenses:', e);
  }
}
