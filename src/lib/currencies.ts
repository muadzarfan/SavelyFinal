import { CurrencyCode } from '../types';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  IDR: {
    code: 'IDR',
    symbol: 'Rp',
    name: 'Indonesian Rupiah',
    locale: 'id-ID',
    decimals: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    locale: 'en-US',
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    locale: 'de-DE',
    decimals: 2,
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    name: 'Singapore Dollar',
    locale: 'en-SG',
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    locale: 'en-GB',
    decimals: 2,
  },
};

export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'IDR',
  hideBalances: boolean = false
): string {
  if (hideBalances) return '••••••';
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.IDR;
  
  if (currencyCode === 'IDR') {
    const rounded = Math.round(amount);
    return `Rp ${rounded.toLocaleString('id-ID')}`;
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

export function formatCompactCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'IDR',
  hideBalances: boolean = false
): string {
  if (hideBalances) return '••••••';
  if (currencyCode === 'IDR') {
    if (amount >= 1000000000) return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    if (amount >= 1000000) {
      const val = amount / 1000000;
      return `Rp ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}jt`;
    }
    if (amount >= 1000) {
      const val = amount / 1000;
      return `Rp ${val % 1 === 0 ? val.toFixed(0) : val.toFixed(0)}k`;
    }
    return `Rp ${Math.round(amount)}`;
  }
  
  const symbol = SUPPORTED_CURRENCIES[currencyCode]?.symbol || '$';
  if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(0)}k`;
  return `${symbol}${amount.toFixed(0)}`;
}

export function formatHumanDate(dateStr: string | Date, locale: 'id' | 'en' = 'id'): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return String(dateStr);
  
  return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatHumanTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatRemainingTime(deadlineDateStr: string, locale: 'id' | 'en' = 'id'): string {
  if (!deadlineDateStr) return '';
  const target = new Date(deadlineDateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return locale === 'id' ? 'Telah lewat' : 'Passed';
  }
  
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) {
    return locale === 'id' ? `${diffDays} hari lagi` : `${diffDays} days left`;
  }
  
  const diffMonths = Math.round(diffDays / 30.4);
  if (diffMonths < 12) {
    return locale === 'id' ? `${diffMonths} bulan lagi` : `${diffMonths} months left`;
  }
  
  const diffYears = (diffDays / 365.25).toFixed(1);
  return locale === 'id' ? `${diffYears} tahun lagi` : `${diffYears} years left`;
}

/**
 * Automatically formats numeric strings with thousands separator commas.
 * e.g. "1000000" -> "1,000,000"
 * Preserves decimals if typed, e.g. "1000.5" -> "1,000.5", "1000." -> "1,000."
 */
export function formatNominal(value: number | string | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  const str = String(value);
  const isNegative = str.startsWith('-');
  const clean = str.replace(/[^0-9.]/g, '');
  if (!clean) return isNegative ? '-' : '';

  const parts = clean.split('.');
  // Format integer portion with commas
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // If decimal was typed, preserve dot and following decimals
  if (parts.length > 1) {
    return (isNegative ? '-' : '') + intPart + '.' + parts.slice(1).join('');
  }

  return (isNegative ? '-' : '') + intPart;
}

/**
 * Strips commas and parses nominal back to a float number.
 */
export function parseNominal(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  const clean = String(value).replace(/,/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
