import {
  CalculationBreakdown,
  ExpenseCategory,
  ExpenseRecord,
  FinancialHealthMetrics,
  RiskInsight,
  UserProfile,
} from '../types';
import {
  getFinancialPeriodInfo,
  getUpcomingBillsNext7Days,
  toMidnight,
} from './payday';

/**
 * Returns a local calendar date string YYYY-MM-DD using the user's local timezone.
 * Avoids UTC split('T')[0] midnight mismatch bugs.
 */
export function getLocalDateString(d: Date | string = new Date()): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether an expense timestamp belongs to the same local calendar day as referenceDate.
 */
export function isSameLocalDay(expenseDateStr: string, referenceDate: Date): boolean {
  const expDate = new Date(expenseDateStr);
  return (
    expDate.getFullYear() === referenceDate.getFullYear() &&
    expDate.getMonth() === referenceDate.getMonth() &&
    expDate.getDate() === referenceDate.getDate()
  );
}

/**
 * Core Financial Calculation Engine.
 * 
 * Deterministic source of truth for dashboard, analytics, and AI context.
 * Supports both Payday Cycle and Calendar Month financial periods.
 * Uses integer units for IDR to prevent floating-point anomalies.
 */
export function calculateFinancialHealth(
  userProfile: UserProfile,
  expenses: ExpenseRecord[],
  referenceDate: Date = new Date()
): FinancialHealthMetrics {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysRemainingInMonth = Math.max(1, daysInMonth - currentDay + 1);

  const language = userProfile?.settings?.language || 'id';

  // 0. Calculate Financial Period Information (Payday Cycle or Calendar Month)
  const financialPeriod = getFinancialPeriodInfo(userProfile, referenceDate, language);
  const periodDaysRemaining = financialPeriod.daysRemaining;

  const isIDR = (userProfile?.currency || 'IDR') === 'IDR';
  const roundMoney = (val: number): number => {
    if (!isFinite(val)) return 0;
    return isIDR ? Math.round(val) : Math.round(val * 100) / 100;
  };

  const monthlyIncome = roundMoney(userProfile?.monthlyIncome || 0);
  const isBudgetConfigured = monthlyIncome > 0;

  // 1. Essential Obligations (Fixed Recurring Bills)
  // Only count active bills (default active = true)
  const fixedBills = userProfile?.fixedBills || [];
  let totalFixedBills = 0;
  let paidBillsTotal = 0;
  let unpaidBillsTotal = 0;

  for (const bill of fixedBills) {
    if (bill.active === false) continue;
    const amt = roundMoney(bill.amount || 0);
    totalFixedBills += amt;
    if (bill.isPaidThisMonth) {
      paidBillsTotal += amt;
    } else {
      unpaidBillsTotal += amt;
    }
  }

  // 2. Planned Savings Target Allocation
  const monthlySavingsTarget = roundMoney(userProfile?.savingsGoal?.monthlyTargetContribution || 0);

  // 3. Discretionary Spending Allocation for Period
  // Allocation = Income - Fixed Bills - Target Savings Allocation
  const rawDiscretionary = monthlyIncome - totalFixedBills - monthlySavingsTarget;
  const discretionaryBudget = Math.max(0, roundMoney(rawDiscretionary));

  // 4. Expenses Aggregation
  // In payday cycle mode, uses period start to period end; in calendar month mode, uses 1st to end of month.
  let totalSpentThisMonth = 0;
  let totalSpentToday = 0;
  let totalSpentThisWeek = 0;
  let priorSpendingTotal = 0;

  const periodStart = toMidnight(new Date(financialPeriod.startDate + 'T00:00:00'));
  const periodEnd = new Date(financialPeriod.endDate + 'T23:59:59.999');

  // Window for current week (last 7 days inclusive)
  const weekStart = new Date(referenceDate);
  weekStart.setDate(referenceDate.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  for (const exp of expenses) {
    const expDate = new Date(exp.date);
    const amount = roundMoney(exp.amount || 0);

    // Period check
    if (expDate >= periodStart && expDate <= periodEnd) {
      totalSpentThisMonth += amount;
      if (exp.isPriorSpending || exp.source === 'prior_spending') {
        priorSpendingTotal += amount;
      }
    }

    // Today check (local day)
    if (isSameLocalDay(exp.date, referenceDate)) {
      totalSpentToday += amount;
    }

    // Week check
    if (expDate >= weekStart && expDate <= referenceDate) {
      totalSpentThisWeek += amount;
    }
  }

  totalSpentThisMonth = roundMoney(totalSpentThisMonth);
  totalSpentToday = roundMoney(totalSpentToday);
  totalSpentThisWeek = roundMoney(totalSpentThisWeek);
  priorSpendingTotal = roundMoney(priorSpendingTotal);

  // 5. Remaining Discretionary Budget
  // Remaining = Discretionary Budget - Total Spent in Period
  const rawRemainingSafe = discretionaryBudget - totalSpentThisMonth;
  const monthlyRemainingSafe = Math.max(0, roundMoney(rawRemainingSafe));

  // 6. Transparent Daily Safe-to-Spend
  // Formula: Remaining Discretionary Budget ÷ Days Remaining until Payday/End of Period
  const activeDaysRemaining = periodDaysRemaining;
  const rawDailySafe = activeDaysRemaining > 0 ? monthlyRemainingSafe / activeDaysRemaining : 0;
  const dailySafeToSpend = roundMoney(Math.max(0, rawDailySafe));

  // 7. Today's Remaining Safe Allowance
  // Today's remaining = max(0, dailySafeToSpend - todaySpent)
  const todayRemainingSafe = roundMoney(Math.max(0, dailySafeToSpend - totalSpentToday));

  // 8. Weekly Safe-to-Spend
  const weeklySafeToSpend = roundMoney(dailySafeToSpend * 7);

  // 9. Burn Percentages
  const dailyBurnPct = dailySafeToSpend > 0
    ? Math.round((totalSpentToday / dailySafeToSpend) * 100)
    : totalSpentToday > 0
    ? 100
    : 0;

  const weeklyBurnPct = weeklySafeToSpend > 0
    ? Math.round((totalSpentThisWeek / weeklySafeToSpend) * 100)
    : totalSpentThisWeek > 0
    ? 100
    : 0;

  // 10. Velocity Status Assessment
  let velocityStatus: FinancialHealthMetrics['velocityStatus'] = 'thriving';
  const periodProgressPct = financialPeriod.totalDays > 0
    ? (financialPeriod.currentDayNumber / financialPeriod.totalDays) * 100
    : (currentDay / daysInMonth) * 100;

  const budgetConsumedPct = discretionaryBudget > 0
    ? (totalSpentThisMonth / discretionaryBudget) * 100
    : totalSpentThisMonth > 0
    ? 100
    : 0;

  if (!isBudgetConfigured) {
    velocityStatus = 'on_track';
  } else if (totalSpentThisMonth > discretionaryBudget) {
    velocityStatus = 'critical';
  } else if (budgetConsumedPct > periodProgressPct + 25) {
    velocityStatus = 'high_burn';
  } else if (budgetConsumedPct > periodProgressPct + 10) {
    velocityStatus = 'caution';
  } else if (budgetConsumedPct <= periodProgressPct - 10) {
    velocityStatus = 'thriving';
  } else {
    velocityStatus = 'on_track';
  }

  // 11. Projections
  const elapsedDays = Math.max(1, financialPeriod.currentDayNumber);
  const burnRateDailyAverage = elapsedDays > 0 ? roundMoney(totalSpentThisMonth / elapsedDays) : 0;
  const projectedTotalSpendMonth = roundMoney(
    totalSpentThisMonth + burnRateDailyAverage * Math.max(0, activeDaysRemaining - 1)
  );
  const projectedMonthEndSavings = Math.max(
    0,
    roundMoney(monthlyIncome - totalFixedBills - projectedTotalSpendMonth)
  );

  // 12. Savings Goal Progress
  const goalTarget = userProfile?.savingsGoal?.targetAmount || 0;
  const goalSaved = userProfile?.savingsGoal?.currentSaved || 0;
  const savingsGoalProgressPct = goalTarget > 0
    ? Math.min(100, Math.round((goalSaved / goalTarget) * 100))
    : 0;

  // 13. Upcoming Bills in Next 7 Days
  const upcomingBillsNext7Days = getUpcomingBillsNext7Days(userProfile?.fixedBills || [], referenceDate, language);

  // 14. Mathematical Explanation Breakdown
  const breakdown: CalculationBreakdown = {
    monthlyIncome,
    totalFixedBills,
    paidBillsTotal,
    unpaidBillsTotal,
    monthlySavingsTarget,
    discretionaryAllocation: discretionaryBudget,
    discretionarySpentThisMonth: totalSpentThisMonth,
    remainingDiscretionaryBudget: monthlyRemainingSafe,
    daysRemainingInMonth: activeDaysRemaining,
    dailySafeToSpend,
    spentToday: totalSpentToday,
    remainingToday: todayRemainingSafe,
    formulaDescription: `Daily Safe = (Money Available [${monthlyIncome} - ${totalFixedBills} fixed expenses - ${monthlySavingsTarget} savings] - Spent [${totalSpentThisMonth}]) ÷ ${activeDaysRemaining} days remaining until payday = ${dailySafeToSpend}`,
    periodLabel: financialPeriod.label,
    priorSpendingTotal,
  };

  return {
    monthlyIncome,
    totalFixedBills,
    paidBillsTotal,
    unpaidBillsTotal,
    monthlySavingsTarget,
    discretionaryBudget,
    totalSpentThisMonth,
    totalSpentToday,
    totalSpentThisWeek,
    dailySafeToSpend,
    weeklySafeToSpend,
    monthlyRemainingSafe,
    todayRemainingSafe,
    daysRemainingInMonth: activeDaysRemaining,
    currentDayOfMonth: financialPeriod.currentDayNumber,
    daysInMonth: financialPeriod.totalDays,
    savingsGoalProgressPct,
    dailyBurnPct,
    weeklyBurnPct,
    velocityStatus,
    projectedMonthEndSavings,
    burnRateDailyAverage,
    isBudgetConfigured,
    breakdown,
    financialPeriod,
    upcomingBillsNext7Days,
    priorSpendingTotal,
  };
}

/**
 * Generates Evidence-Based, Explainable Risk Insights.
 * Emits 1 primary, highest-value insight at the top, supported by real data.
 */
export function generateRiskInsights(
  userProfile: UserProfile,
  metrics: FinancialHealthMetrics,
  expenses: ExpenseRecord[],
  language: 'id' | 'en' = 'id'
): RiskInsight[] {
  const insights: RiskInsight[] = [];
  const goalTitle = userProfile.savingsGoal?.title || (language === 'id' ? 'Tabungan Utama' : 'Savings Goal');
  const currency = userProfile.currency || 'IDR';
  const isId = language === 'id' || (userProfile.settings?.language !== 'en');

  // 0. Setup Needed State
  if (!metrics.isBudgetConfigured) {
    insights.push({
      id: 'setup_required',
      type: 'setup_needed',
      severity: 'info',
      title: isId ? 'Yuk Masukkan Pemasukan Bulananmu Dulu' : 'Please Enter Your Monthly Income',
      observation: isId
        ? 'Savely belum tahu nominal gaji atau penghasilan bulanan kamu.'
        : 'Savely does not know your monthly income yet.',
      message: isId
        ? 'Begitu kamu isi pemasukan, AI langsung otomatis hitungkan jatah belanja harian yang aman biar kamu gak kehabisan uang di akhir bulan.'
        : 'Once you enter your income, Savely AI will automatically calculate your daily safe spending limit.',
      evidence: isId ? `Pemasukan saat ini: Belum diatur (${currency})` : `Current Income: Not set (${currency})`,
      actionableTip: isId
        ? 'Strategi AI: Klik menu profil di kanan atas, masukkan perkiraan gaji atau pemasukan bulananmu, lalu simpan. Angka jatah belanja aman langsung aktif seketika!'
        : 'AI Strategy: Click your profile at the top right, enter your monthly income, and save. Your daily safe limit will activate immediately!',
      timestamp: new Date().toISOString(),
    });
    return insights;
  }

  // 1. Critical Overrun: Budget exceeded
  if (metrics.velocityStatus === 'critical') {
    const overrun = metrics.totalSpentThisMonth - metrics.discretionaryBudget;
    insights.push({
      id: 'budget_overrun',
      type: 'savings_delay',
      severity: 'alert',
      title: isId ? 'Lampu Merah: Anggaran Belanja Bulan Ini Jebol!' : 'Red Alert: Monthly Spending Limit Exceeded!',
      observation: isId
        ? `Pengeluaranmu bulan ini sudah melebihi batas anggaran sebesar ${overrun.toLocaleString()} ${currency}.`
        : `Your spending this month has exceeded your budget by ${overrun.toLocaleString()} ${currency}.`,
      message: isId
        ? `Kalau terus belanja yang tidak penting, uang yang harusnya masuk ke target tabungan '${goalTitle}' bakal terpotong.`
        : `Continuing to spend on non-essentials will eat into your planned savings for '${goalTitle}'.`,
      evidence: isId
        ? `Sudah terpakai ${metrics.totalSpentThisMonth.toLocaleString()} dari jatah ${metrics.discretionaryBudget.toLocaleString()} ${currency}`
        : `Spent ${metrics.totalSpentThisMonth.toLocaleString()} of ${metrics.discretionaryBudget.toLocaleString()} ${currency} budget`,
      impact: isId ? `Target tabungan '${goalTitle}' terancam mundur` : `Risk of delay for '${goalTitle}'`,
      impactDays: 30,
      actionableTip: isId
        ? 'Strategi AI: Puasa belanja non-kebutuhan dulu sampai tanggal gajian tiba. Cukup beli kebutuhan makan dan pokok harian saja supaya tabungan utamamu tetap utuh dan selamat.'
        : 'AI Strategy: Pause all non-essential shopping until your next paycheck. Stick strictly to everyday food and basic necessities to protect your savings goal.',
      timestamp: new Date().toISOString(),
    });
  }

  // 2. High Daily Burn Flag: Spent too much today
  if (metrics.dailyBurnPct > 120 && metrics.totalSpentToday > 0) {
    const excess = metrics.totalSpentToday - metrics.dailySafeToSpend;
    insights.push({
      id: 'high_daily_burn',
      type: 'high_burn',
      severity: 'alert',
      title: isId ? 'Hari Ini Belanja Sedikit Kelewat Batas' : 'Spent Above Today’s Safe Target',
      observation: isId
        ? `Hari ini kamu sudah mengeluarkan ${metrics.totalSpentToday.toLocaleString()} ${currency} (${metrics.dailyBurnPct}% dari jatah harian).`
        : `You spent ${metrics.totalSpentToday.toLocaleString()} ${currency} today (${metrics.dailyBurnPct}% of daily allowance).`,
      message: isId
        ? `Gak masalah sesekali belanja lebih, yang penting besok kita seimbangkan lagi agar tabungan tetap aman.`
        : `Overspending on one day is totally okay, let us balance it out tomorrow so your savings stay safe.`,
      evidence: isId
        ? `Jatah aman normal: ${metrics.dailySafeToSpend.toLocaleString()} | Pengeluaran hari ini: ${metrics.totalSpentToday.toLocaleString()}`
        : `Daily safe limit: ${metrics.dailySafeToSpend.toLocaleString()} | Spent today: ${metrics.totalSpentToday.toLocaleString()}`,
      impact: isId ? 'Jatah belanja beberapa hari ke depan sedikit disesuaikan' : 'Slightly trims daily allowance for upcoming days',
      actionableTip: isId
        ? `Strategi AI: Besok coba tahan jajan di bawah ${Math.round(metrics.dailySafeToSpend * 0.5).toLocaleString()} ${currency} (cukup setengah dari jatah biasa). Cuma perlu irit 1 hari besok, posisi keuanganmu langsung seimbang kembali!`
        : `AI Strategy: Keep tomorrow's spending under ${Math.round(metrics.dailySafeToSpend * 0.5).toLocaleString()} ${currency}. Just one disciplined day and your finances will be completely back in balance!`,
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Category Lifestyle Creep Evaluation
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  }

  const foodSpend = categoryTotals['Food & Beverage'] || 0;
  const shoppingSpend = categoryTotals['Shopping & Lifestyle'] || 0;

  if (metrics.discretionaryBudget > 0 && foodSpend > metrics.discretionaryBudget * 0.35 && foodSpend > 0) {
    const foodPct = Math.round((foodSpend / metrics.discretionaryBudget) * 100);
    const delayDays = Math.min(45, Math.max(7, Math.round((foodSpend / Math.max(1, metrics.dailySafeToSpend)) * 1.4)));
    insights.push({
      id: 'lifestyle_creep_food',
      type: 'lifestyle_creep',
      severity: 'warning',
      category: 'Food & Beverage',
      title: isId ? 'Jajan Makan & Kopi Lagi Bocor Halus Nih' : 'Dining & Coffee Spending is Creeping Up',
      observation: isId
        ? `Uang jajan makan di luar dan kopi sudah memakan ${foodPct}% (${foodSpend.toLocaleString()} ${currency}) dari total uang bebasmu bulan ini.`
        : `Dining out and coffee have taken up ${foodPct}% (${foodSpend.toLocaleString()} ${currency}) of your discretionary budget.`,
      message: isId
        ? `Jajan kecil seringkali gak berasa, tapi kalau diteruskan bisa bikin target tabungan '${goalTitle}' mundur sekitar ${delayDays} hari.`
        : `Small daily treats add up quickly and could delay your '${goalTitle}' target by about ${delayDays} days.`,
      evidence: isId
        ? `Total jajan makan & minum: ${foodSpend.toLocaleString()} dari ${metrics.discretionaryBudget.toLocaleString()} ${currency}`
        : `Dining spend: ${foodSpend.toLocaleString()} of ${metrics.discretionaryBudget.toLocaleString()} ${currency}`,
      impact: isId ? `Target '${goalTitle}' bisa mundur ${delayDays} hari` : `${delayDays} days delay on '${goalTitle}'`,
      impactDays: delayDays,
      actionableTip: isId
        ? 'Strategi AI: Bawa bekal makan siang atau seduh kopi sendiri 2 hari saja minggu ini. Penghematannya lumayan banget buat mengamankan uang jajan harian dan mempercepat target tabunganmu!'
        : 'AI Strategy: Pack lunch or make coffee at home just 2 days this week. You will instantly free up extra daily cash and speed up your savings goal!',
      timestamp: new Date().toISOString(),
    });
  } else if (metrics.discretionaryBudget > 0 && shoppingSpend > metrics.discretionaryBudget * 0.3 && shoppingSpend > 0) {
    const shopPct = Math.round((shoppingSpend / metrics.discretionaryBudget) * 100);
    const delayDays = Math.min(35, Math.max(6, Math.round((shoppingSpend / Math.max(1, metrics.dailySafeToSpend)) * 1.2)));
    insights.push({
      id: 'lifestyle_creep_shopping',
      type: 'lifestyle_creep',
      severity: 'warning',
      category: 'Shopping & Lifestyle',
      title: isId ? 'Belanja Online & Barang Sedang Kencang' : 'Shopping & Online Purchases Spiking',
      observation: isId
        ? `Belanja pakaian atau barang online menyerap ${shopPct}% (${shoppingSpend.toLocaleString()} ${currency}) dari uang bebasmu.`
        : `Shopping and online purchases take up ${shopPct}% (${shoppingSpend.toLocaleString()} ${currency}) of your discretionary budget.`,
      message: isId
        ? 'Sering checkout barang bikin sisa jatah belanja harian di akhir bulan jadi semakin menipis.'
        : 'Frequent checkouts are tightening your remaining daily allowance for the rest of the month.',
      evidence: isId
        ? `Total belanja barang: ${shoppingSpend.toLocaleString()} ${currency}`
        : `Shopping spend: ${shoppingSpend.toLocaleString()} ${currency}`,
      impact: isId ? `Target '${goalTitle}' bisa mundur ${delayDays} hari` : `${delayDays} days delay on '${goalTitle}'`,
      impactDays: delayDays,
      actionableTip: isId
        ? 'Strategi AI: Terapkan aturan "Tahan 48 Jam" sebelum checkout keranjang belanjaan online. Seringkali setelah 2 hari kamu bakal sadar barangnya belum terlalu dibutuhkan, uangmu pun tetap aman!'
        : 'AI Strategy: Apply the "48-hour pause rule" before checking out online shopping carts. Usually the impulse fades and your money stays protected!',
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Trajectory Milestone / Healthy Pacing
  if (metrics.velocityStatus === 'thriving' && expenses.length > 0) {
    insights.push({
      id: 'thriving_velocity',
      type: 'smart_win',
      severity: 'success',
      title: isId ? 'Mantap Banget! Gaya Belanja Kamu Super Hemat' : 'Awesome! Spending is Super Disciplined',
      observation: isId
        ? 'Pengeluaran kamu terkontrol dengan rapi dan jauh di bawah batas maksimal anggaran.'
        : 'Your spending is disciplined and well below your monthly spending ceiling.',
      message: isId
        ? `Dengan ritme hemat seperti ini, target tabungan '${goalTitle}' kamu diprediksi tercapai 8 hari lebih cepat dari jadwal target!`
        : `At this pace, your '${goalTitle}' goal is projected to complete about 8 days ahead of schedule!`,
      evidence: isId
        ? `Prediksi sisa tabungan akhir bulan: ${metrics.projectedMonthEndSavings.toLocaleString()} ${currency}`
        : `Projected month-end reserve: ${metrics.projectedMonthEndSavings.toLocaleString()} ${currency}`,
      impact: isId ? '8 hari lebih cepat dari jadwal target' : '8 days ahead of schedule',
      impactDays: -8,
      actionableTip: isId
        ? 'Strategi AI: Karena belanjamu sangat hemat, nanti di akhir bulan sisa uang belanja yang nganggur bisa langsung kamu pindahin ke tabungan biar target impianmu makin cepat tuntas!'
        : 'AI Strategy: Since you have plenty of cushion, sweep any unspent money into your savings goal at month-end to reach your goal even faster!',
      timestamp: new Date().toISOString(),
    });
  } else if (insights.length === 0) {
    // Balanced baseline
    insights.push({
      id: 'stable_safe_trajectory',
      type: 'milestone',
      severity: 'info',
      title: isId ? 'Kondisi Keuangan Kamu Aman & Terkendali' : 'Spending is Safe & On Track',
      observation: isId
        ? `Keuanganmu berada di jalur yang sehat dengan ${metrics.daysRemainingInMonth} hari tersisa di bulan ini.`
        : `Your spending is well-balanced with ${metrics.daysRemainingInMonth} days remaining this month.`,
      message: isId
        ? `Kamu bebas belanja santai sampai ${metrics.dailySafeToSpend.toLocaleString()} ${currency} per hari tanpa perlu khawatir karena target tabungan '${goalTitle}' tetap aman terjaga.`
        : `You can comfortably spend up to ${metrics.dailySafeToSpend.toLocaleString()} ${currency} per day without worrying, as your '${goalTitle}' is well-protected.`,
      evidence: isId
        ? `Sisa uang belanja bebas: ${metrics.monthlyRemainingSafe.toLocaleString()} ${currency} untuk ${metrics.daysRemainingInMonth} hari ke depan`
        : `Remaining allowance: ${metrics.monthlyRemainingSafe.toLocaleString()} ${currency} across ${metrics.daysRemainingInMonth} days`,
      actionableTip: isId
        ? 'Strategi AI: Kuncinya simpel: biasakan langsung rekam suara 2 detik di Savely tiap habis bayar sesuatu, supaya jatah harianmu selalu akurat dan gak ada pengeluaran gaib yang kelupaan!'
        : 'AI Strategy: Keep it effortless: log purchases by voice for 2 seconds right after spending, so your daily safe limit stays 100% accurate without surprises!',
      timestamp: new Date().toISOString(),
    });
  }

  return insights;
}
