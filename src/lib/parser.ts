import { ExpenseCategory, ParsedItemCandidate } from '../types';

/**
 * Words to number dictionary for Indonesian numeral phrases.
 */
const INDONESIAN_NUMBER_WORDS: Record<string, number> = {
  nol: 0,
  kosong: 0,
  satu: 1,
  se: 1,
  dua: 2,
  tiga: 3,
  empat: 4,
  lima: 5,
  enam: 6,
  tujuh: 7,
  delapan: 8,
  sembilan: 9,
  sepuluh: 10,
  sebelas: 11,
};

/**
 * Parses spoken Indonesian text numerals into numbers.
 * e.g. "seratus dua puluh ribu" -> 120000
 * "tiga puluh lima ribu" -> 35000
 * "lima ribu" -> 5000
 * "dua juta" -> 2000000
 * "setengah juta" -> 500000
 */
export function parseIndonesianSpelledNumbers(text: string): number | null {
  const clean = text.toLowerCase().trim();

  // Common Slang mappings
  if (/\bceban\b/.test(clean)) return 10000;
  if (/\bgocap\b/.test(clean)) return 50000;
  if (/\bgoceng\b/.test(clean)) return 5000;
  if (/\bseceng\b/.test(clean)) return 1000;
  if (/\bnopek\b/.test(clean)) return 200000;
  if (/\bgopek\b/.test(clean)) return 500;
  if (/\bsetengah\s+juta\b/.test(clean)) return 500000;
  if (/\bsejutaan?\b/.test(clean) || /\bsatu\s+juta\b/.test(clean)) return 1000000;

  const rawTokens = clean.split(/\s+/);
  const validWords = new Set([
    'nol', 'kosong', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'belas', 'puluh', 'seratus', 'ratus', 'seribu', 'ribu', 'rebu', 'sejuta', 'juta', 'setengah'
  ]);

  const tokens = rawTokens.filter((t) => validWords.has(t));
  if (tokens.length === 0) return null;

  let total = 0;
  let currentGroup = 0;
  let currentDigit = 0;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];

    if (t === 'setengah' && tokens[i + 1] === 'juta') {
      total += 500000;
      i++;
      continue;
    }

    if (t === 'sejuta') {
      total += 1000000;
      currentGroup = 0;
      currentDigit = 0;
    } else if (t === 'juta') {
      const mult = (currentGroup + currentDigit) || 1;
      total += mult * 1000000;
      currentGroup = 0;
      currentDigit = 0;
    } else if (t === 'seribu') {
      total += 1000;
      currentGroup = 0;
      currentDigit = 0;
    } else if (t === 'ribu' || t === 'rebu') {
      const mult = (currentGroup + currentDigit) || 1;
      total += mult * 1000;
      currentGroup = 0;
      currentDigit = 0;
    } else if (t === 'seratus') {
      currentGroup += 100;
      currentDigit = 0;
    } else if (t === 'ratus') {
      currentGroup += (currentDigit || 1) * 100;
      currentDigit = 0;
    } else if (t === 'sepuluh') {
      currentGroup += 10;
      currentDigit = 0;
    } else if (t === 'sebelas') {
      currentGroup += 11;
      currentDigit = 0;
    } else if (t === 'belas') {
      currentGroup += (currentDigit || 1) + 10;
      currentDigit = 0;
    } else if (t === 'puluh') {
      currentGroup += (currentDigit || 1) * 10;
      currentDigit = 0;
    } else if (INDONESIAN_NUMBER_WORDS[t] !== undefined) {
      currentDigit = INDONESIAN_NUMBER_WORDS[t];
    }
  }

  total += currentGroup + currentDigit;
  return total > 0 ? total : null;
}

/**
 * Extracts a numeric amount from an individual phrase segment.
 */
export function extractAmountFromSegment(segment: string, userCurrency: string = 'IDR'): number {
  const s = segment.toLowerCase();

  // 1. Slang checks
  if (/\bceban\b/.test(s)) return 10000;
  if (/\bgocap\b/.test(s)) return 50000;
  if (/\bgoceng\b/.test(s)) return 5000;
  if (/\bseceng\b/.test(s)) return 1000;
  if (/\bnopek\b/.test(s)) return 200000;
  if (/\bgopek\b/.test(s)) return 500;
  if (/\bsetengah\s+juta\b/.test(s)) return 500000;

  // 2. Millions check e.g. "1.5 jt", "2 juta", "1,5juta"
  const jtMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)/i);
  if (jtMatch) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    return Math.round(val * 1000000);
  }

  // 3. Thousands check e.g. "25k", "300rb", "20 ribu", "25 rebu", "25.000"
  const kMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu|rebu)/i);
  if (kMatch) {
    const val = parseFloat(kMatch[1].replace(',', '.'));
    return Math.round(val * 1000);
  }

  // 4. Formatted thousands e.g. "25.000", "120.000", "1.500.000"
  const formattedIndoMatch = s.match(/(?:rp\.?\s*)?(\d{1,3}(?:\.\d{3})+)/i);
  if (formattedIndoMatch) {
    const cleanNum = formattedIndoMatch[1].replace(/\./g, '');
    return parseInt(cleanNum, 10);
  }

  // 5. Spelled-out Indonesian words
  const spelledNum = parseIndonesianSpelledNumbers(s);
  if (spelledNum && spelledNum > 0) {
    return spelledNum;
  }

  // 6. Generic digit patterns e.g. "spent 45", "150", "25"
  const rawNumMatch = s.match(/(?:rp|idr|\$|€|£)?\s*(\d+(?:\.\d+)?)/i);
  if (rawNumMatch) {
    const parsed = parseFloat(rawNumMatch[1]);
    if (!isNaN(parsed) && parsed > 0) {
      // In IDR colloquial phrasing, e.g. "beli kopi 25", 25 means 25,000
      if (userCurrency === 'IDR' && parsed <= 500) {
        return Math.round(parsed * 1000);
      }
      return userCurrency === 'IDR' ? Math.round(parsed) : parsed;
    }
  }

  return 0;
}

/**
 * Extracts a relative date from a phrase segment.
 * e.g., "kemarin", "semalam", "tadi pagi", "2 hari lalu"
 */
export function extractRelativeDate(segment: string, baseDateStr?: string): string {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  const s = segment.toLowerCase();

  // "kemarin lusa" (2 days ago)
  if (/\b(?:kemarin\s*lusa)\b/i.test(s)) {
    const d = new Date(base);
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }

  // "kemarin" or "semalam" or "yesterday"
  if (/\b(?:kemarin|semalam|yesterday)\b/i.test(s)) {
    const d = new Date(base);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  // "tanggal 10" or "tgl 10" e.g. "tanggal 10 makan siang 35 ribu"
  const tglMatch = s.match(/\b(?:tanggal|tgl)\s*(\d{1,2})\b/i);
  if (tglMatch) {
    const targetDay = parseInt(tglMatch[1], 10);
    if (targetDay >= 1 && targetDay <= 31) {
      const d = new Date(base);
      // If target day is greater than today's date, it likely belongs to last month (e.g. today is 18 Oct and user says tanggal 25)
      // Otherwise belongs to this month
      if (targetDay > base.getDate()) {
        d.setMonth(d.getMonth() - 1);
      }
      const daysInTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(targetDay, daysInTargetMonth));
      return d.toISOString().split('T')[0];
    }
  }

  const daysAgoMatch = s.match(/(\d+)\s*(?:hari\s*lalu|days?\s*ago)/i);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const d = new Date(base);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  return base.toISOString().split('T')[0];
}

/**
 * Categorizes an expense segment based on linguistic keywords.
 */
export function categorizeSegment(segment: string, learnedMappings?: Record<string, ExpenseCategory>): ExpenseCategory {
  const s = segment.toLowerCase();

  // Check learned merchant mappings first
  if (learnedMappings) {
    for (const [merchant, cat] of Object.entries(learnedMappings)) {
      if (s.includes(merchant.toLowerCase())) {
        return cat;
      }
    }
  }

  if (/ojek|gojek|grab|taxi|taksi|bensin|pertamax|pertalite|tol|parkir|parking|mrt|busway|commuter|kereta|flight|tiket|transit|transport/i.test(s)) {
    return 'Transit & Commute';
  }
  if (/listrik|pln|pdam|wifi|indihome|biznet|pulsa|paket data|bpjs|air|tagihan|utilities|internet/i.test(s)) {
    return 'Utilities & Bills';
  }
  if (/baju|sepatu|celana|tokopedia|shopee|lazada|tiktok shop|mall|belanja|shopping|skincare|tas|lifestyle|fashion/i.test(s)) {
    return 'Shopping & Lifestyle';
  }
  if (/sayur|pasar|supermarket|beras|telur|buah|daging|ikan|indomaret|alfamart|groceries|sembako/i.test(s)) {
    return 'Groceries';
  }
  if (/bioskop|cinema|xxi|nonton|game|steam|playstation|netflix|spotify|karaoke|liburan|hotel|leisure/i.test(s)) {
    return 'Entertainment & Leisure';
  }
  if (/gym|fitness|obat|dokter|apotek|klinik|vitamin|hospital|rumah sakit|wellness/i.test(s)) {
    return 'Health & Wellness';
  }
  if (/kost|kos|kontrakan|sewa rumah|apartment|rent|ipl|housing/i.test(s)) {
    return 'Housing';
  }
  if (/potong rambut|salon|barbershop|spa|massage|creambath/i.test(s)) {
    return 'Personal Care';
  }
  if (/buku|kursus|course|udemy|seminar|alat tulis|fotokopi|kuliah|school/i.test(s)) {
    return 'Education & Work';
  }
  if (/kopi|coffee|mie|ayam|makan|lunch|dinner|sarapan|snack|padang|resto|cafe|boba|tea|teh|roti|bakso|nasgor|warteg|burger|pizza/i.test(s)) {
    return 'Food & Beverage';
  }

  return 'Food & Beverage';
}

/**
 * Normalizes title by removing numbers, currency words, and action verbs.
 */
export function cleanTitleFromSegment(segment: string, fallbackCategory: ExpenseCategory): string {
  let title = segment
    // Remove amounts & units
    .replace(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu|rebu|jt|juta)/gi, '')
    .replace(/(?:rp|idr|\$|€|£)\.?\s*\d+(?:[.,]\d+)*/gi, '')
    .replace(/\b(?:ceban|gocap|goceng|seceng|nopek|gopek|setengah juta|sejuta|seratus|dua ratus|tiga ratus|lima puluh|dua puluh|ribu|rebu|juta)\b/gi, '')
    .replace(/\b(?:satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|belas|puluh|ratus)\b/gi, '')
    // Remove transaction verbs and relative dates
    .replace(/\b(?:gue|saya|aku|tadi|habis|buat|beli|bayar|ongkos|biaya|spent|for|on|in|at|kemarin|semalam|pagi|siang|malam)\b/gi, '')
    .replace(/[0-9.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!title || title.length < 2) {
    title = fallbackCategory;
  }

  // Capitalize title
  return title
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Deconstructs compound sentences into distinct expense records.
 * Supports Indonesian, English, and mixed Indonesian-English.
 * e.g. "Beli kopi 25 ribu, makan 40 ribu, sama parkir 5 ribu."
 * -> 3 records totaling 70,000.
 */
export function parseCompoundExpenseText(
  text: string,
  userCurrency: string = 'IDR',
  referenceDateStr?: string,
  learnedMappings?: Record<string, ExpenseCategory>
): {
  rawTranscript: string;
  languageDetected: string;
  parsedItems: ParsedItemCandidate[];
  totalAmount: number;
  parsingNotes: string;
} {
  const cleanInput = (text || '').trim();
  if (!cleanInput) {
    return {
      rawTranscript: '',
      languageDetected: 'unknown',
      parsedItems: [],
      totalAmount: 0,
      parsingNotes: 'Empty input',
    };
  }

  const currentDate = referenceDateStr || new Date().toISOString().split('T')[0];

  // Split on compound transition words
  // "terus", "lalu", "sama", "kemudian", "dan", "and", ",", "&", "+"
  const segments = cleanInput
    .split(/(?:\s+(?:terus|lalu|sama|kemudian|dan|and)\s+|[,&+]+)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedItems: ParsedItemCandidate[] = [];

  for (const seg of segments) {
    const amount = extractAmountFromSegment(seg, userCurrency);
    if (amount <= 0) continue;

    const category = categorizeSegment(seg, learnedMappings);
    const title = cleanTitleFromSegment(seg, category);
    const itemDate = extractRelativeDate(seg, currentDate);

    parsedItems.push({
      title,
      amount: userCurrency === 'IDR' ? Math.round(amount) : amount,
      category,
      date: itemDate,
      confidence: 0.95,
      notes: `Extracted from "${seg}"`,
    });
  }

  const totalAmount = parsedItems.reduce((sum, it) => sum + it.amount, 0);

  // Detect language hint
  const hasIndo = /ribu|rebu|juta|beli|buat|bayar|ongkos|makan|kopi|bensin|sama|terus|kemarin/i.test(cleanInput);
  const hasEng = /spent|coffee|lunch|dinner|and|groceries|dollar|yesterday/i.test(cleanInput);
  const languageDetected = hasIndo && hasEng ? 'id-en mixed' : hasIndo ? 'id' : 'en';

  return {
    rawTranscript: cleanInput,
    languageDetected,
    parsedItems,
    totalAmount,
    parsingNotes: `Semantic parser deconstructed ${parsedItems.length} distinct item(s)`,
  };
}
