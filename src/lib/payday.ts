import {
  PaydayConfig,
  UserProfile,
  FinancialPeriodInfo,
  UpcomingBillInfo,
  FixedBill,
  FinancialPeriodType,
} from '../types';
import { formatHumanDate } from './currencies';

/**
 * Returns a clean Date at 00:00:00.000 local time
 */
export function toMidnight(d: Date | string): Date {
  const date = typeof d === 'string' ? new Date(d) : new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Formats YYYY-MM-DD using local time
 */
export function formatYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the exact payday date for a given year and month,
 * taking into account short months (clamping to last day) and weekend shifting.
 */
export function getMonthlyPaydayDate(
  year: number,
  monthIndex: number,
  targetDay: number = 25,
  adjustForWeekend: boolean = true
): Date {
  // Days in this month
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const clampedDay = Math.min(Math.max(1, targetDay), daysInMonth);

  const date = new Date(year, monthIndex, clampedDay, 0, 0, 0, 0);

  if (adjustForWeekend) {
    const dow = date.getDay(); // 0 is Sunday, 6 is Saturday
    if (dow === 6) {
      // Saturday -> move to Friday (-1 day)
      date.setDate(date.getDate() - 1);
    } else if (dow === 0) {
      // Sunday -> move to Friday (-2 days)
      date.setDate(date.getDate() - 2);
    }
  }

  return date;
}

/**
 * Calculates the last working day for a given year and month.
 */
export function getLastWorkingDay(year: number, monthIndex: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0, 0, 0, 0, 0);
  const dow = lastDay.getDay();
  if (dow === 6) {
    lastDay.setDate(lastDay.getDate() - 1);
  } else if (dow === 0) {
    lastDay.setDate(lastDay.getDate() - 2);
  }
  return lastDay;
}

/**
 * Calculates the upcoming next payday and previous payday based on PaydayConfig.
 */
export function calculateNextPayday(
  config?: PaydayConfig,
  referenceDate: Date = new Date()
): { nextPayday: Date; previousPayday: Date; daysRemaining: number } {
  const refMidnight = toMidnight(referenceDate);
  const y = refMidnight.getFullYear();
  const m = refMidnight.getMonth();

  const scheduleType = config?.scheduleType || 'monthly_date';
  const targetDay = config?.dayOfMonth || 25;
  const adjustForWeekend = config?.adjustForWeekend !== false;

  let nextPayday: Date;
  let previousPayday: Date;

  if (scheduleType === 'monthly_date') {
    const thisMonthPayday = getMonthlyPaydayDate(y, m, targetDay, adjustForWeekend);

    if (refMidnight.getTime() > thisMonthPayday.getTime()) {
      // Already past this month's payday -> next is in m + 1
      previousPayday = thisMonthPayday;
      nextPayday = getMonthlyPaydayDate(y, m + 1, targetDay, adjustForWeekend);
    } else {
      // Today is before or on this month's payday
      nextPayday = thisMonthPayday;
      previousPayday = getMonthlyPaydayDate(y, m - 1, targetDay, adjustForWeekend);
    }
  } else if (scheduleType === 'last_working_day') {
    const thisMonthLWD = getLastWorkingDay(y, m);
    if (refMidnight.getTime() > thisMonthLWD.getTime()) {
      previousPayday = thisMonthLWD;
      nextPayday = getLastWorkingDay(y, m + 1);
    } else {
      nextPayday = thisMonthLWD;
      previousPayday = getLastWorkingDay(y, m - 1);
    }
  } else if (scheduleType === 'biweekly' || scheduleType === 'weekly') {
    const intervalDays = scheduleType === 'biweekly' ? 14 : 7;
    const anchor = config?.startDate ? toMidnight(new Date(config.startDate)) : new Date(y, 0, 1, 0, 0, 0, 0);

    let cur = new Date(anchor);
    // Move cur forward until >= refMidnight
    if (cur.getTime() > refMidnight.getTime()) {
      while (cur.getTime() > refMidnight.getTime()) {
        cur.setDate(cur.getDate() - intervalDays);
      }
    }
    while (cur.getTime() < refMidnight.getTime()) {
      cur.setDate(cur.getDate() + intervalDays);
    }

    nextPayday = new Date(cur);
    previousPayday = new Date(cur);
    previousPayday.setDate(previousPayday.getDate() - intervalDays);
  } else if (scheduleType === 'custom_date' && config?.customDate) {
    const custom = toMidnight(new Date(config.customDate));
    if (custom.getTime() >= refMidnight.getTime()) {
      nextPayday = custom;
      previousPayday = new Date(custom);
      previousPayday.setDate(previousPayday.getDate() - 30);
    } else {
      // Fallback if custom date is in the past
      previousPayday = custom;
      nextPayday = getMonthlyPaydayDate(y, m + 1, targetDay, adjustForWeekend);
    }
  } else {
    // Default fallback
    nextPayday = getMonthlyPaydayDate(y, m, 25, true);
    previousPayday = getMonthlyPaydayDate(y, m - 1, 25, true);
  }

  // Days left from reference date until next payday
  const diffMs = nextPayday.getTime() - refMidnight.getTime();
  const daysRemaining = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  return { nextPayday, previousPayday, daysRemaining };
}

/**
 * Calculates complete Financial Period Information for the app
 */
export function getFinancialPeriodInfo(
  userProfile: UserProfile,
  referenceDate: Date = new Date(),
  language: 'id' | 'en' = 'id'
): FinancialPeriodInfo {
  const refMidnight = toMidnight(referenceDate);
  const periodType: FinancialPeriodType =
    userProfile.financialPeriodType ||
    (userProfile.paydayConfig?.scheduleType || userProfile.paydayConfig?.dayOfMonth
      ? 'payday_cycle'
      : 'calendar_month');
  const isId = language === 'id';

  const { nextPayday, previousPayday, daysRemaining: paydayDaysRemaining } = calculateNextPayday(
    userProfile.paydayConfig,
    referenceDate
  );

  const nextPaydayDateStr = formatYMD(nextPayday);
  const nextPaydayLabel = isId
    ? `${formatHumanDate(nextPaydayDateStr, 'id')} (${paydayDaysRemaining} hari lagi)`
    : `${formatHumanDate(nextPaydayDateStr, 'en')} (${paydayDaysRemaining} days left)`;

  if (periodType === 'payday_cycle') {
    const startDate = formatYMD(previousPayday);
    // The payday cycle ends on the day before next payday
    const cycleEndDate = new Date(nextPayday);
    cycleEndDate.setDate(cycleEndDate.getDate() - 1);
    const endDate = formatYMD(cycleEndDate);

    const totalDays = Math.max(
      1,
      Math.round((nextPayday.getTime() - previousPayday.getTime()) / (1000 * 60 * 60 * 24))
    );

    const elapsedDays = Math.max(
      1,
      Math.round((refMidnight.getTime() - previousPayday.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    const label = `${formatHumanDate(startDate, language)} - ${formatHumanDate(endDate, language)}`;

    return {
      type: 'payday_cycle',
      startDate,
      endDate,
      totalDays,
      currentDayNumber: Math.min(elapsedDays, totalDays),
      daysRemaining: paydayDaysRemaining,
      nextPaydayDate: nextPaydayDateStr,
      nextPaydayLabel,
      nextPaydayDaysLeft: paydayDaysRemaining,
      label,
    };
  }

  // Calendar Month mode
  const y = refMidnight.getFullYear();
  const m = refMidnight.getMonth();
  const startOfMonth = new Date(y, m, 1);
  const endOfMonth = new Date(y, m + 1, 0);

  const startDate = formatYMD(startOfMonth);
  const endDate = formatYMD(endOfMonth);
  const totalDays = endOfMonth.getDate();
  const currentDayNumber = refMidnight.getDate();
  const daysRemaining = Math.max(1, totalDays - currentDayNumber + 1);

  const label = `${formatHumanDate(startDate, language)} - ${formatHumanDate(endDate, language)}`;

  return {
    type: 'calendar_month',
    startDate,
    endDate,
    totalDays,
    currentDayNumber,
    daysRemaining,
    nextPaydayDate: nextPaydayDateStr,
    nextPaydayLabel,
    nextPaydayDaysLeft: paydayDaysRemaining,
    label,
  };
}

/**
 * Calculates upcoming fixed bills in the next 7 days
 */
export function getUpcomingBillsNext7Days(
  fixedBills: FixedBill[] = [],
  referenceDate: Date = new Date(),
  language: 'id' | 'en' = 'id'
): UpcomingBillInfo[] {
  const refMidnight = toMidnight(referenceDate);
  const y = refMidnight.getFullYear();
  const m = refMidnight.getMonth();
  const isId = language === 'id';

  const upcoming: UpcomingBillInfo[] = [];

  for (const bill of fixedBills) {
    if (bill.active === false) continue;

    const dueDay = Math.min(31, Math.max(1, bill.dueDay || 1));
    const daysInThisMonth = new Date(y, m + 1, 0).getDate();
    const clampedThisMonth = Math.min(dueDay, daysInThisMonth);

    let dueDate = new Date(y, m, clampedThisMonth, 0, 0, 0, 0);

    // If dueDate is already past by more than 1 day, consider next month
    if (dueDate.getTime() < refMidnight.getTime()) {
      const daysInNextMonth = new Date(y, m + 2, 0).getDate();
      const clampedNextMonth = Math.min(dueDay, daysInNextMonth);
      dueDate = new Date(y, m + 1, clampedNextMonth, 0, 0, 0, 0);
    }

    const diffDays = Math.round((dueDate.getTime() - refMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7) {
      const dateStr = formatYMD(dueDate);
      upcoming.push({
        bill,
        dueDateStr: dateStr,
        dueDayFormatted: isId ? `${formatHumanDate(dateStr, 'id')}` : `${formatHumanDate(dateStr, 'en')}`,
        daysUntilDue: diffDays,
        isDueToday: diffDays === 0,
        isPastDue: false,
      });
    }
  }

  return upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}
