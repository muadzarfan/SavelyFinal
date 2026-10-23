export type CurrencyCode = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'GBP';

export type ExpenseCategory =
  | 'Food & Beverage'
  | 'Transit & Commute'
  | 'Utilities & Bills'
  | 'Shopping & Lifestyle'
  | 'Groceries'
  | 'Housing'
  | 'Entertainment & Leisure'
  | 'Health & Wellness'
  | 'Personal Care'
  | 'Education & Work'
  | 'Other';

export type PaydayScheduleType = 'monthly_date' | 'last_working_day' | 'biweekly' | 'weekly' | 'custom_date';

export interface PaydayConfig {
  scheduleType: PaydayScheduleType;
  dayOfMonth: number; // 1-31 (default 25)
  customDate?: string; // YYYY-MM-DD
  startDate?: string; // For biweekly / weekly
  adjustForWeekend: boolean; // Shift to preceding Friday
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  scheduleType: PaydayScheduleType;
  dayOfMonth?: number;
  isPrimary?: boolean;
}

export type FinancialPeriodType = 'payday_cycle' | 'calendar_month';

export interface PriorSpendingCatchup {
  completed: boolean;
  quickTotalAmount?: number;
  periodStartDate?: string;
  dismissedBanner?: boolean;
}

export interface FixedBill {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1-31
  category: ExpenseCategory;
  active?: boolean; // toggle active (default: true)
  isPaidThisMonth?: boolean;
  autoLogOnDue?: boolean;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentSaved: number;
  deadlineDate: string; // YYYY-MM-DD
  monthlyTargetContribution: number;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  icon?: string;
  color?: string;
}

export interface CategoryBudget {
  category: ExpenseCategory;
  monthlyLimit: number;
}

export interface RecurringItem {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'monthly' | 'weekly';
  category: ExpenseCategory;
  dueDay: number;
  active: boolean;
}

export interface AppSettings {
  language: 'id' | 'en';
  theme: 'dark' | 'light';
  hideBalances: boolean;
  pinLockEnabled: boolean;
  pinCode?: string;
  remindersEnabled: boolean;
  reminderTime: string;
  streakCount: number;
  lastLoggedDate: string;
}

export interface ReceiptScanResult {
  merchant: string;
  totalAmount: number;
  date: string;
  category: ExpenseCategory;
  taxAmount?: number;
  notes?: string;
  items?: { name: string; price: number; quantity?: number }[];
}

export type NavTab = 'home' | 'analytics' | 'transactions' | 'goals' | 'settings';

export interface FinancialPeriodInfo {
  type: FinancialPeriodType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  currentDayNumber: number; // e.g. Day 12 of 30
  daysRemaining: number;
  nextPaydayDate: string; // YYYY-MM-DD
  nextPaydayLabel: string; // e.g. "25 Okt (7 hari lagi)"
  nextPaydayDaysLeft: number;
  label: string; // e.g. "25 Sep - 24 Okt 2026"
}

export interface UpcomingBillInfo {
  bill: FixedBill;
  dueDateStr: string;
  dueDayFormatted: string;
  daysUntilDue: number;
  isDueToday: boolean;
  isPastDue: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: CurrencyCode;
  monthlyIncome: number;
  fixedBills: FixedBill[];
  savingsGoal: SavingsGoal;
  goals?: SavingsGoal[];
  categoryBudgets?: CategoryBudget[];
  recurringItems?: RecurringItem[];
  paydayConfig?: PaydayConfig;
  incomeSources?: IncomeSource[];
  financialPeriodType?: FinancialPeriodType;
  priorSpendingCatchup?: PriorSpendingCatchup;
  settings?: AppSettings;
  merchantMappings?: Record<string, ExpenseCategory>;
  onboarded: boolean;
  theme?: 'dark' | 'emerald';
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO string YYYY-MM-DDTHH:mm:ss.sssZ
  rawVoiceTranscript?: string;
  source: 'voice' | 'manual' | 'ai_batch' | 'prior_spending' | 'backfill';
  notes?: string;
  confidence?: number;
  detectedLanguage?: string;
  isPriorSpending?: boolean;
  isBackfilled?: boolean;
}

export interface ParsedItemCandidate {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date?: string;
  notes?: string;
  confidence: number;
}

export interface ParseExpenseResponse {
  rawTranscript: string;
  languageDetected?: string;
  parsedItems: ParsedItemCandidate[];
  totalAmount: number;
  parsingNotes?: string;
}

export interface CalculationBreakdown {
  monthlyIncome: number;
  totalFixedBills: number;
  paidBillsTotal: number;
  unpaidBillsTotal: number;
  monthlySavingsTarget: number;
  discretionaryAllocation: number;
  discretionarySpentThisMonth: number;
  remainingDiscretionaryBudget: number;
  daysRemainingInMonth: number;
  dailySafeToSpend: number;
  spentToday: number;
  remainingToday: number;
  formulaDescription: string;
  periodLabel?: string;
  priorSpendingTotal?: number;
}

export interface FinancialHealthMetrics {
  monthlyIncome: number;
  totalFixedBills: number;
  paidBillsTotal: number;
  unpaidBillsTotal: number;
  monthlySavingsTarget: number;
  discretionaryBudget: number; // Income - Fixed Bills - Savings Target
  totalSpentThisMonth: number;
  totalSpentToday: number;
  totalSpentThisWeek: number;
  dailySafeToSpend: number; // Discretionary remaining / days remaining in period
  weeklySafeToSpend: number; // Daily safe * 7
  monthlyRemainingSafe: number;
  todayRemainingSafe: number; // max(0, dailySafeToSpend - totalSpentToday)
  daysRemainingInMonth: number;
  currentDayOfMonth: number;
  daysInMonth: number;
  savingsGoalProgressPct: number;
  dailyBurnPct: number; // spent today vs daily safe
  weeklyBurnPct: number; // spent this week vs weekly safe
  velocityStatus: 'thriving' | 'on_track' | 'caution' | 'high_burn' | 'critical';
  projectedMonthEndSavings: number;
  burnRateDailyAverage: number;
  isBudgetConfigured: boolean;
  breakdown: CalculationBreakdown;
  financialPeriod: FinancialPeriodInfo;
  upcomingBillsNext7Days: UpcomingBillInfo[];
  priorSpendingTotal: number;
}

export interface RiskInsight {
  id: string;
  type: 'lifestyle_creep' | 'high_burn' | 'savings_delay' | 'smart_win' | 'milestone' | 'setup_needed';
  severity: 'info' | 'warning' | 'alert' | 'success';
  title: string;
  observation?: string;
  message: string;
  evidence?: string;
  impact?: string;
  impactDays?: number;
  category?: ExpenseCategory;
  actionableTip: string;
  timestamp: string;
}

export interface DeepScenarioAnalysis {
  assessment: string;
  goalDelayOrAdvanceDays: number;
  revisedCompletionDate: string;
  monthlySavingsPace: number;
  keyLifestyleDrivers: string[];
  concreteTactics: string[];
  scenarioSimulations: {
    scenario: string;
    savingsDelta: number;
    impactDescription: string;
  }[];
  verdict: 'secure' | 'minor_risk' | 'significant_risk' | 'ahead_of_schedule';
}

