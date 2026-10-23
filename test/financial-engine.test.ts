import { calculateFinancialHealth, generateRiskInsights, getLocalDateString } from '../src/lib/calculations';
import { parseCompoundExpenseText, parseIndonesianSpelledNumbers, extractAmountFromSegment } from '../src/lib/parser';
import { UserProfile, ExpenseRecord } from '../src/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`TEST ASSERTION FAILED: ${msg}`);
  }
}

function assertEquals(actual: any, expected: any, msg: string) {
  if (actual !== expected) {
    throw new Error(`TEST FAILED: ${msg}. Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

console.log('--- STARTING SAVELYY FINANCIAL CALCULATION & PARSING TEST SUITE ---');

const baseProfile: UserProfile = {
  id: 'usr_test_1',
  name: 'Test User',
  email: 'test@savely.finance',
  currency: 'IDR',
  monthlyIncome: 15000000, // 15jt
  fixedBills: [
    { id: 'b1', name: 'Rent', amount: 3000000, dueDay: 1, category: 'Housing', isPaidThisMonth: true },
    { id: 'b2', name: 'Internet', amount: 500000, dueDay: 10, category: 'Utilities & Bills', isPaidThisMonth: false },
  ],
  savingsGoal: {
    id: 'g1',
    title: 'Emergency Fund',
    targetAmount: 30000000,
    currentSaved: 10000000,
    deadlineDate: '2027-12-31',
    monthlyTargetContribution: 2500000,
  },
  onboarded: true,
  createdAt: '2026-10-01T00:00:00.000Z',
};

// Test reference date: Oct 15, 2026 (Day 15 of 31 days month)
// Days remaining in month: 31 - 15 + 1 = 17 days
const refDate = new Date(2026, 9, 15, 12, 0, 0); // Month index 9 = October

// CASE 1: No transactions and a properly configured budget
{
  const metrics = calculateFinancialHealth(baseProfile, [], refDate);
  // Income (15,000,000) - Bills (3,500,000) - Savings (2,500,000) = Discretionary 9,000,000
  assertEquals(metrics.monthlyIncome, 15000000, 'Case 1: Monthly income');
  assertEquals(metrics.totalFixedBills, 3500000, 'Case 1: Total bills');
  assertEquals(metrics.monthlySavingsTarget, 2500000, 'Case 1: Savings target');
  assertEquals(metrics.discretionaryBudget, 9000000, 'Case 1: Discretionary allocation');
  assertEquals(metrics.totalSpentThisMonth, 0, 'Case 1: No transactions month spend');
  assertEquals(metrics.monthlyRemainingSafe, 9000000, 'Case 1: Remaining safe discretionary');
  // Daily Safe = 9,000,000 / 17 days = 529412
  assertEquals(metrics.daysRemainingInMonth, 17, 'Case 1: Days remaining in month');
  assertEquals(metrics.dailySafeToSpend, 529412, 'Case 1: Daily safe to spend');
  assertEquals(metrics.todayRemainingSafe, 529412, 'Case 1: Today remaining safe');
  console.log('✓ Case 1 Passed: No transactions with configured budget');
}

// CASE 2: One recorded discretionary expense
{
  const exp: ExpenseRecord[] = [
    {
      id: 'e1',
      title: 'Groceries',
      amount: 200000,
      category: 'Groceries',
      date: '2026-10-15T10:00:00.000Z',
      source: 'manual',
    },
  ];
  const metrics = calculateFinancialHealth(baseProfile, exp, refDate);
  assertEquals(metrics.totalSpentThisMonth, 200000, 'Case 2: Total spent month');
  assertEquals(metrics.totalSpentToday, 200000, 'Case 2: Total spent today');
  assertEquals(metrics.monthlyRemainingSafe, 8800000, 'Case 2: Monthly remaining');
  // Daily safe = 8,800,000 / 17 = 517647
  assertEquals(metrics.dailySafeToSpend, 517647, 'Case 2: Daily safe');
  assertEquals(metrics.todayRemainingSafe, 517647 - 200000, 'Case 2: Today remaining safe');
  console.log('✓ Case 2 Passed: Single recorded discretionary expense');
}

// CASE 3: Multiple expenses on the same day
{
  const exp: ExpenseRecord[] = [
    { id: 'e1', title: 'Lunch', amount: 50000, category: 'Food & Beverage', date: '2026-10-15T12:00:00.000Z', source: 'voice' },
    { id: 'e2', title: 'Coffee', amount: 35000, category: 'Food & Beverage', date: '2026-10-15T14:30:00.000Z', source: 'voice' },
    { id: 'e3', title: 'Ojek', amount: 25000, category: 'Transit & Commute', date: '2026-10-15T17:00:00.000Z', source: 'manual' },
  ];
  const metrics = calculateFinancialHealth(baseProfile, exp, refDate);
  assertEquals(metrics.totalSpentToday, 110000, 'Case 3: Total spent today sum');
  assertEquals(metrics.totalSpentThisMonth, 110000, 'Case 3: Total spent this month sum');
  console.log('✓ Case 3 Passed: Multiple expenses on the same day aggregate accurately');
}

// CASE 4: An expense recorded by voice and then edited
{
  const expOriginal: ExpenseRecord = {
    id: 'e_voice',
    title: 'Kopi',
    amount: 35000,
    category: 'Food & Beverage',
    date: '2026-10-15T09:00:00.000Z',
    source: 'voice',
  };
  const metricsBefore = calculateFinancialHealth(baseProfile, [expOriginal], refDate);

  // User edits amount to 40000 and changes merchant title
  const expEdited: ExpenseRecord = {
    ...expOriginal,
    title: 'Kopi Kenangan Latte Large',
    amount: 40000,
  };
  const metricsAfter = calculateFinancialHealth(baseProfile, [expEdited], refDate);
  assertEquals(metricsBefore.totalSpentToday, 35000, 'Case 4: Before edit');
  assertEquals(metricsAfter.totalSpentToday, 40000, 'Case 4: After edit');
  assert(metricsAfter.dailySafeToSpend < metricsBefore.dailySafeToSpend, 'Case 4: Daily safe recalibrates down after increase');
  console.log('✓ Case 4 Passed: Expense edited and recalculated immediately');
}

// CASE 5: An expense deleted after it was included in daily total
{
  const expList: ExpenseRecord[] = [
    { id: 'e1', title: 'Expense 1', amount: 100000, category: 'Shopping & Lifestyle', date: '2026-10-15T10:00:00.000Z', source: 'manual' },
    { id: 'e2', title: 'Expense 2', amount: 50000, category: 'Food & Beverage', date: '2026-10-15T11:00:00.000Z', source: 'manual' },
  ];
  const metricsBefore = calculateFinancialHealth(baseProfile, expList, refDate);
  assertEquals(metricsBefore.totalSpentToday, 150000, 'Case 5: Before delete');

  // Delete e1
  const remaining = expList.filter(e => e.id !== 'e1');
  const metricsAfter = calculateFinancialHealth(baseProfile, remaining, refDate);
  assertEquals(metricsAfter.totalSpentToday, 50000, 'Case 5: After delete');
  assertEquals(metricsAfter.totalSpentThisMonth, 50000, 'Case 5: Month spend after delete');
  assert(metricsAfter.dailySafeToSpend > metricsBefore.dailySafeToSpend, 'Case 5: Allowance restored');
  console.log('✓ Case 5 Passed: Expense deletion cleanses daily and monthly totals');
}

// CASE 6 & 7: Upcoming unpaid bill vs paid bill
{
  const metrics = calculateFinancialHealth(baseProfile, [], refDate);
  assertEquals(metrics.paidBillsTotal, 3000000, 'Case 6/7: Paid bills total');
  assertEquals(metrics.unpaidBillsTotal, 500000, 'Case 6/7: Unpaid bills total');
  assertEquals(metrics.totalFixedBills, 3500000, 'Case 6/7: Total bills');
  // Discretionary budget already allocated with total fixed bills reserved:
  assertEquals(metrics.discretionaryBudget, 9000000, 'Case 6/7: Discretionary preserves upcoming obligation');
  console.log('✓ Case 6 & 7 Passed: Paid and upcoming bills clearly distinguished without double counting');
}

// CASE 8: Savings contribution already reserved in the budget
{
  const metrics = calculateFinancialHealth(baseProfile, [], refDate);
  assertEquals(metrics.monthlySavingsTarget, 2500000, 'Case 8: Savings reserved');
  assert(metrics.discretionaryBudget === baseProfile.monthlyIncome - baseProfile.fixedBills.reduce((s, b) => s + b.amount, 0) - baseProfile.savingsGoal.monthlyTargetContribution, 'Case 8: Reserved correctly');
  console.log('✓ Case 8 Passed: Savings contribution reserved upfront');
}

// CASE 9: Zero available discretionary funds
{
  const zeroDiscretionaryProfile: UserProfile = {
    ...baseProfile,
    monthlyIncome: 5000000,
    fixedBills: [{ id: 'b1', name: 'Rent', amount: 4000000, dueDay: 1, category: 'Housing' }],
    savingsGoal: { ...baseProfile.savingsGoal, monthlyTargetContribution: 1000000 },
  };
  const metrics = calculateFinancialHealth(zeroDiscretionaryProfile, [], refDate);
  assertEquals(metrics.discretionaryBudget, 0, 'Case 9: Zero discretionary allocation');
  assertEquals(metrics.dailySafeToSpend, 0, 'Case 9: Zero daily safe');
  assertEquals(metrics.todayRemainingSafe, 0, 'Case 9: Zero today remaining');
  console.log('✓ Case 9 Passed: Zero available discretionary funds handled safely');
}

// CASE 10: Negative remaining budget (overspending)
{
  const overspentExpenses: ExpenseRecord[] = [
    { id: 'e_huge', title: 'Expensive Gadget', amount: 10000000, category: 'Shopping & Lifestyle', date: '2026-10-15T10:00:00.000Z', source: 'manual' },
  ];
  const metrics = calculateFinancialHealth(baseProfile, overspentExpenses, refDate);
  assertEquals(metrics.monthlyRemainingSafe, 0, 'Case 10: Remaining does not go negative in UI');
  assertEquals(metrics.dailySafeToSpend, 0, 'Case 10: Daily safe clamped to 0');
  assertEquals(metrics.velocityStatus, 'critical', 'Case 10: Flags critical velocity');
  console.log('✓ Case 10 Passed: Negative remaining budget gracefully clamped with critical alert');
}

// CASE 11: Final day of the budgeting period (Oct 31)
{
  const lastDayDate = new Date(2026, 9, 31, 15, 0, 0);
  const metrics = calculateFinancialHealth(baseProfile, [], lastDayDate);
  assertEquals(metrics.daysRemainingInMonth, 1, 'Case 11: Final day has 1 day remaining');
  assertEquals(metrics.dailySafeToSpend, metrics.monthlyRemainingSafe, 'Case 11: Daily safe equals remaining budget on last day');
  console.log('✓ Case 11 Passed: Final day of budget period calculated correctly');
}

// CASE 12: New month or changed budget period
{
  const nov1Date = new Date(2026, 10, 1, 9, 0, 0); // Nov 1, 2026 (30 days in Nov)
  // Expenses from October should not bleed into November
  const octExpenses: ExpenseRecord[] = [
    { id: 'oct_1', title: 'Oct Dinner', amount: 500000, category: 'Food & Beverage', date: '2026-10-15T12:00:00.000Z', source: 'manual' },
  ];
  const metricsNov = calculateFinancialHealth(baseProfile, octExpenses, nov1Date);
  assertEquals(metricsNov.totalSpentThisMonth, 0, 'Case 12: Oct expenses do not count towards Nov');
  assertEquals(metricsNov.daysRemainingInMonth, 30, 'Case 12: 30 days remaining in Nov');
  console.log('✓ Case 12 Passed: New month calendar boundary resets month spend cleanly');
}

// CASE 13: User who has no configured income
{
  const noIncomeProfile: UserProfile = {
    ...baseProfile,
    monthlyIncome: 0,
  };
  const metrics = calculateFinancialHealth(noIncomeProfile, [], refDate);
  assertEquals(metrics.isBudgetConfigured, false, 'Case 13: Budget marked unconfigured');
  assertEquals(metrics.dailySafeToSpend, 0, 'Case 13: Zero safe without income');
  const insights = generateRiskInsights(noIncomeProfile, metrics, []);
  assert(insights.some(i => i.type === 'setup_needed'), 'Case 13: Generates setup_needed insight');
  console.log('✓ Case 13 Passed: Unconfigured income flagged transparently with setup prompt');
}

// CASE 14: User who has no historical transactions
{
  const metrics = calculateFinancialHealth(baseProfile, [], refDate);
  const insights = generateRiskInsights(baseProfile, metrics, []);
  assert(insights.length > 0, 'Case 14: Generates initial baseline guidance');
  console.log('✓ Case 14 Passed: Clean template user gets guidance without fake history');
}

// CASE 15: Budget or goal changed after expenses are recorded
{
  const exp: ExpenseRecord[] = [
    { id: 'e1', title: 'Food', amount: 500000, category: 'Food & Beverage', date: '2026-10-15T12:00:00.000Z', source: 'manual' },
  ];
  const metricsOriginal = calculateFinancialHealth(baseProfile, exp, refDate);
  
  // User gets a raise: Income increases to 20jt
  const raisedProfile: UserProfile = {
    ...baseProfile,
    monthlyIncome: 20000000,
  };
  const metricsUpdated = calculateFinancialHealth(raisedProfile, exp, refDate);
  assert(metricsUpdated.dailySafeToSpend > metricsOriginal.dailySafeToSpend, 'Case 15: Income raise immediately boosts daily safe');
  console.log('✓ Case 15 Passed: Dynamic recalculation upon budget/profile adjustment');
}

// CASE 16 & 17: Voice Semantic Compound Extraction
{
  const transcript1 = '20 ribu buat mie ayam terus 50 ribu buat ongkos ojek';
  const res1 = parseCompoundExpenseText(transcript1, 'IDR');
  assertEquals(res1.parsedItems.length, 2, 'Case 16: Two items extracted');
  assertEquals(res1.parsedItems[0].amount, 20000, 'Case 16: First item 20,000');
  assertEquals(res1.parsedItems[0].category, 'Food & Beverage', 'Case 16: First category Food');
  assertEquals(res1.parsedItems[1].amount, 50000, 'Case 16: Second item 50,000');
  assertEquals(res1.parsedItems[1].category, 'Transit & Commute', 'Case 16: Second category Transit');
  assertEquals(res1.totalAmount, 70000, 'Case 16: Total 70,000');
  console.log('✓ Case 16 Passed: Compound sentence "20 ribu buat mie ayam terus 50 ribu buat ongkos ojek" parsed accurately');

  const transcript2 = 'Beli kopi 25 ribu, makan 40 ribu, sama parkir 5 ribu.';
  const res2 = parseCompoundExpenseText(transcript2, 'IDR');
  assertEquals(res2.parsedItems.length, 3, 'Case 17: Three items extracted');
  assertEquals(res2.parsedItems[0].amount, 25000, 'Case 17: Kopi 25k');
  assertEquals(res2.parsedItems[1].amount, 40000, 'Case 17: Makan 40k');
  assertEquals(res2.parsedItems[2].amount, 5000, 'Case 17: Parkir 5k');
  assertEquals(res2.totalAmount, 70000, 'Case 17: Total 70,000');
  console.log('✓ Case 17 Passed: 3 distinct items deconstructed into separate transactions totaling 70k');
}

// CASE 18: Spelled-out Indonesian Numerals
{
  const amount = extractAmountFromSegment('Beli bensin seratus dua puluh ribu');
  assertEquals(amount, 120000, 'Case 18: Seratus dua puluh ribu = 120,000');
  const amount2 = extractAmountFromSegment('Tadi makan siang habis lima puluh ribu');
  assertEquals(amount2, 50000, 'Case 18: Lima puluh ribu = 50,000');
  const amount3 = extractAmountFromSegment('Beli kopi 35k');
  assertEquals(amount3, 35000, 'Case 18: 35k = 35,000');
  console.log('✓ Case 18 Passed: Spelled-out Indonesian numerals recognized');
}

// CASE 19: Indonesian Colloquial Slang (ceban, gocap, goceng, etc.)
{
  assertEquals(extractAmountFromSegment('beli kopi ceban'), 10000, 'Case 19: ceban = 10k');
  assertEquals(extractAmountFromSegment('bensin gocap'), 50000, 'Case 19: gocap = 50k');
  assertEquals(extractAmountFromSegment('parkir goceng'), 5000, 'Case 19: goceng = 5k');
  assertEquals(extractAmountFromSegment('nopek buat belanja'), 200000, 'Case 19: nopek = 200k');
  console.log('✓ Case 19 Passed: Indonesian colloquial slang amounts parsed');
}

// CASE 20: Indonesian Colloquial "rebu" variation
{
  const amount = extractAmountFromSegment('tadi siang makan padang dua puluh lima rebu');
  assertEquals(amount, 25000, 'Case 20: dua puluh lima rebu = 25,000');
  const amount2 = extractAmountFromSegment('kopi 15 rebu');
  assertEquals(amount2, 15000, 'Case 20: 15 rebu = 15,000');
  console.log('✓ Case 20 Passed: Colloquial "rebu" variation parsed accurately');
}

// CASE 21: Relative Date Extraction ("kemarin")
{
  const res = parseCompoundExpenseText('kemarin beli bensin seratus ribu', 'IDR');
  assertEquals(res.parsedItems.length, 1, 'Case 21: Extracted 1 item');
  assertEquals(res.parsedItems[0].amount, 100000, 'Case 21: Bensin 100,000');
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  assertEquals(res.parsedItems[0].date, yesterdayStr, 'Case 21: Inferred yesterday date');
  console.log('✓ Case 21 Passed: Relative date "kemarin" parsed accurately to yesterday');
}

// CASE 22: Learned Merchant to Category Mapping
{
  const learned = { 'Kopi Kenangan': 'Food & Beverage' as const, 'Super Indo': 'Groceries' as const };
  const res = parseCompoundExpenseText('beli 50k di super indo', 'IDR', undefined, learned);
  assertEquals(res.parsedItems[0].category, 'Groceries', 'Case 22: Learned mapping applied');
  console.log('✓ Case 22 Passed: Learned merchant mapping prioritized');
}

console.log('\n=========================================');
console.log('ALL 19 FINANCIAL & PARSER TESTS PASSED!');
console.log('=========================================\n');
