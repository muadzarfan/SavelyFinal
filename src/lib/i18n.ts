export type Language = 'id' | 'en';

export const translations = {
  id: {
    // Navigation
    home: 'Beranda',
    analytics: 'Analitik',
    transactions: 'Transaksi',
    goals: 'Target Tabungan',
    settings: 'Pengaturan',
    
    // Top Bar & Header
    safeToSpend: 'Aman Dibelanjakan',
    safeRemaining: 'Sisa Aman',
    goalSaved: 'Terkumpul',
    safeToSpendToday: 'Aman Dibelanjakan Hari Ini',
    spentToday: 'Pengeluaran hari ini',
    remainingToday: 'sisa dari batas hari ini',
    allowanceExhausted: 'Batas harian tercapai. Kelebihan akan diserap hari berikutnya.',
    dailyBurnPace: 'Pengeluaran Harian',
    consumed: 'terpakai',
    howCalculated: 'Bagaimana perhitungannya?',
    formulaTitle: 'Rumus Aman Dibelanjakan',
    formulaExplanation: 'Sisa Anggaran Bulanan ÷ Sisa Hari dalam Bulan ini (dikurangi alokasi target tabungan)',
    
    // Status badges
    noDataYet: 'Belum ada data',
    aheadOfPace: 'Sangat Hemat',
    onTrack: 'Sesuai Target',
    caution: 'Perlu Waspada',
    highBurn: 'Boros Harian',
    overspending: 'Melebihi Anggaran',
    
    // Terms unified
    spent: 'Pengeluaran',
    budget: 'Anggaran',
    savingsGoal: 'Target Tabungan',
    dailySafe: 'Batas Harian',
    weeklySafe: 'Batas Mingguan',
    
    // Actions
    speakExpense: 'Rekam Pengeluaran',
    logManually: 'Catat Manual',
    scanReceipt: 'Pindai Struk',
    save: 'Simpan',
    cancel: 'Batal',
    edit: 'Ubah',
    delete: 'Hapus',
    confirm: 'Konfirmasi',
    undo: 'Batalkan',
    exportCsv: 'Ekspor CSV',
    exportPdf: 'Cetak / Unduh PDF',
    filter: 'Filter',
    search: 'Cari',
    allCategories: 'Semua Kategori',
    
    // Goals
    addGoal: 'Tambah Target',
    editGoal: 'Ubah Target',
    targetAmount: 'Target Dana',
    currentlySaved: 'Dana Terkumpul',
    targetDeadline: 'Batas Waktu',
    monthlyContribution: 'Setoran Bulanan',
    monthsLeft: 'bulan lagi',
    daysLeft: 'hari lagi',
    completed: 'Tercapai',
    
    // Analytics
    today: 'Hari Ini',
    thisWeek: 'Minggu Ini',
    thisMonth: 'Bulan Ini',
    allTime: 'Semua',
    categoryDistribution: 'Distribusi Kategori',
    spendingTrajectory: 'Grafik Pengeluaran vs Batas Aman',
    aiInsights: 'Rekomendasi Pintar',
    vsLastMonth: 'vs bulan lalu',
    higher: 'lebih tinggi',
    lower: 'lebih rendah',
    notEnoughData: 'Data belum cukup (butuh min. 3 hari)',
    
    // Voice
    listening: 'Mendengarkan...',
    tapToSpeak: 'Ketuk untuk bicara pengeluaran',
    speechTip: 'Contoh: "Beli kopi 25 ribu terus ongkos ojek 48 ribu"',
    reviewBeforeSave: 'Konfirmasi Transaksi',
    merchantOrTitle: 'Item / Merchant',
    amount: 'Nominal',
    category: 'Kategori',
    date: 'Tanggal',
    confidenceHigh: 'Akurasi Tinggi',
    confidenceLow: 'Perlu Konfirmasi',
    
    // Gamification & Streaks
    dayStreak: 'Hari Berturut-turut',
    streakTitle: 'Kebiasaan Mencatat',
    
    // Settings
    profileSettings: 'Profil & Rekening',
    monthlyIncome: 'Pendapatan Bulanan',
    fixedBills: 'Tagihan Rutin',
    privacyLock: 'Kunci Privasi (PIN)',
    hideBalances: 'Sembunyikan Saldo',
    notifications: 'Pengingat Harian',
    languageOption: 'Bahasa',
    currencyOption: 'Mata Uang',
    themeOption: 'Tema',
    logout: 'Keluar Akun',
    confirmLogout: 'Yakin ingin keluar dari Savely?',
  },
  en: {
    // Navigation
    home: 'Home',
    analytics: 'Analytics',
    transactions: 'Transactions',
    goals: 'Savings Goals',
    settings: 'Settings',
    
    // Top Bar & Header
    safeToSpend: 'Safe to Spend',
    safeRemaining: 'Safe Remaining',
    goalSaved: 'Goal Saved',
    safeToSpendToday: 'Safe to spend today',
    spentToday: "You've spent",
    remainingToday: "remaining from today's allowance",
    allowanceExhausted: 'Daily allowance exhausted for today. Excess absorbs from upcoming days.',
    dailyBurnPace: 'Daily Spending Pace',
    consumed: 'consumed',
    howCalculated: 'How is this calculated?',
    formulaTitle: 'Safe to Spend Formula',
    formulaExplanation: 'Remaining Monthly Budget ÷ Days Left in Month (adjusted for goal contribution)',
    
    // Status badges
    noDataYet: 'No data yet',
    aheadOfPace: 'Ahead of Pace',
    onTrack: 'On Track',
    caution: 'Caution',
    highBurn: 'High Spend',
    overspending: 'Overspending',
    
    // Terms unified
    spent: 'Spent',
    budget: 'Budget',
    savingsGoal: 'Savings Goal',
    dailySafe: 'Daily Limit',
    weeklySafe: 'Weekly Limit',
    
    // Actions
    speakExpense: 'Speak Expense',
    logManually: 'Log Manually',
    scanReceipt: 'Scan Receipt',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    undo: 'Undo',
    exportCsv: 'Export CSV',
    exportPdf: 'Print / Save PDF',
    filter: 'Filter',
    search: 'Search',
    allCategories: 'All Categories',
    
    // Goals
    addGoal: 'Add Goal',
    editGoal: 'Edit Goal',
    targetAmount: 'Target Amount',
    currentlySaved: 'Currently Saved',
    targetDeadline: 'Deadline',
    monthlyContribution: 'Monthly Contribution',
    monthsLeft: 'months left',
    daysLeft: 'days left',
    completed: 'Achieved',
    
    // Analytics
    today: 'Today',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    allTime: 'All Time',
    categoryDistribution: 'Category Distribution',
    spendingTrajectory: 'Spending vs Safe Limit',
    aiInsights: 'Smart Insights',
    vsLastMonth: 'vs last month',
    higher: 'higher',
    lower: 'lower',
    notEnoughData: 'Not enough data yet (requires min. 3 days)',
    
    // Voice
    listening: 'Listening...',
    tapToSpeak: 'Tap to speak your expenses',
    speechTip: 'e.g., "25k for coffee and 48 thousand for taxi ride"',
    reviewBeforeSave: 'Confirm Expenses',
    merchantOrTitle: 'Item / Merchant',
    amount: 'Amount',
    category: 'Category',
    date: 'Date',
    confidenceHigh: 'High Confidence',
    confidenceLow: 'Verify Details',
    
    // Gamification & Streaks
    dayStreak: 'Day Streak',
    streakTitle: 'Logging Habit',
    
    // Settings
    profileSettings: 'Profile & Finances',
    monthlyIncome: 'Monthly Income',
    fixedBills: 'Recurring Bills',
    privacyLock: 'Privacy Lock (PIN)',
    hideBalances: 'Hide Balances',
    notifications: 'Daily Reminders',
    languageOption: 'Language',
    currencyOption: 'Currency',
    themeOption: 'Theme',
    logout: 'Sign Out',
    confirmLogout: 'Are you sure you want to sign out of Savely?',
  },
};

export function getSystemLanguage(): Language {
  if (typeof window === 'undefined') return 'id';
  try {
    const navLang = navigator.language || (navigator as any).userLanguage || '';
    if (navLang.toLowerCase().startsWith('id')) {
      return 'id';
    }
  } catch (e) {}
  return 'en';
}
