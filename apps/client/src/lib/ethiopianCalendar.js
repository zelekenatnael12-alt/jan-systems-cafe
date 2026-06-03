// apps/client/src/lib/ethiopianCalendar.js
// ─────────────────────────────────────────────────────────────────────────────
// Ethiopian Calendar (Ge'ez / EFY) Utility — Phase 1 Implementation
// Converts between Gregorian and Ethiopian fiscal year calendar.
//
// Ethiopian calendar facts:
//   - 13 months: 12 months of 30 days + Pagumē (5 or 6 days in leap years)
//   - Ethiopian New Year falls on ~Sept 11 (Meskerem 1)
//   - ET year is ~7-8 years behind Gregorian
//   - Epoch difference: Julian Day 1723856 (ET) vs 1721426 (GC)
// ─────────────────────────────────────────────────────────────────────────────

export const ET_MONTHS = [
  'መስከረም',  // Meskerem   — September/October
  'ጥቅምት',   // Tikimt     — October/November
  'ኅዳር',    // Hidar      — November/December
  'ታኅሣሥ',   // Tahsas     — December/January
  'ጥር',     // Tir        — January/February
  'የካቲት',   // Yekatit    — February/March
  'መጋቢት',   // Megabit    — March/April
  'ሚያዝያ',   // Miazia     — April/May
  'ጉንቦት',   // Ginbot     — May/June
  'ሰኔ',     // Sene       — June/July
  'ሐምሌ',    // Hamle      — July/August
  'ነሐሴ',    // Nehase     — August/September
  'ጳጉሜን',   // Pagumē     — September (short month)
];

export const ET_MONTHS_LATIN = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagumē'
];

export const ET_DAYS = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];

/**
 * Convert a Gregorian date to Ethiopian Calendar.
 * Returns { year, month (1-13), day, monthName, monthNameLatin }
 * @param {Date} date - JavaScript Date object (Gregorian)
 */
export function toEthiopian(date = new Date()) {
  const gcYear  = date.getFullYear();
  const gcMonth = date.getMonth() + 1; // 1-12
  const gcDay   = date.getDate();

  // Julian Day Number for Gregorian date
  const a = Math.floor((14 - gcMonth) / 12);
  const y = gcYear + 4800 - a;
  const m = gcMonth + 12 * a - 3;
  const jdn = gcDay + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100)
    + Math.floor(y / 400) - 32045;

  // Convert JDN to Ethiopian date
  const r = (jdn - 1723856) % 1461;
  const n = r % 365 + 365 * Math.floor(r / 1460);
  const etYear  = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const etMonth = Math.floor(n / 30) + 1;
  const etDay   = (n % 30) + 1;

  const monthIndex = Math.min(etMonth - 1, 12); // clamp to 0-12

  return {
    year:          etYear,
    month:         etMonth,
    day:           etDay,
    monthName:     ET_MONTHS[monthIndex],
    monthNameLatin: ET_MONTHS_LATIN[monthIndex],
  };
}

/**
 * Format a Gregorian date as an Ethiopian date string.
 * @param {Date} date
 * @param {'amharic'|'latin'|'both'} style
 * @returns {string}
 */
export function formatEthiopianDate(date = new Date(), style = 'amharic') {
  const { year, day, monthName, monthNameLatin } = toEthiopian(date);

  if (style === 'amharic') return `${day} ${monthName} ${year} ዓ.ም`;
  if (style === 'latin')   return `${day} ${monthNameLatin} ${year} E.C.`;
  // 'both' — used on ERCA receipts
  return `${day} ${monthName} ${year} ዓ.ም (${day} ${monthNameLatin} ${year} E.C.)`;
}

/**
 * Return both Gregorian and EFY formatted strings for ERCA receipt dual-date.
 * @param {Date} date
 * @returns {{ gregorian: string, ethiopian: string, receipt: string }}
 */
export function dualDate(date = new Date()) {
  const gregorian = date.toLocaleDateString('en-ET', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Africa/Addis_Ababa'
  });
  const ethiopian = formatEthiopianDate(date, 'amharic');

  return {
    gregorian,
    ethiopian,
    // Single combined string for receipt printing
    receipt: `${gregorian} | ${ethiopian}`,
  };
}

/**
 * Get current Ethiopian fiscal year (EFY) boundaries.
 * EFY starts Meskerem 1 (approx Sept 11 Gregorian).
 * @returns {{ efyYear: number, startDate: Date, endDate: Date }}
 */
export function currentEFY() {
  const now = new Date();
  const { year, month } = toEthiopian(now);
  const efyYear = month >= 1 ? year : year - 1;

  // EFY starts on Meskerem 1 of efyYear → approx Sept 11 of Gregorian (efyYear + 7)
  const startDate = new Date(`${efyYear + 7}-09-11`);
  const endDate   = new Date(`${efyYear + 8}-09-10`);

  return { efyYear, startDate, endDate };
}

/**
 * Get the Amharic month name for a given Gregorian Date.
 */
export function getAmharicMonth(date = new Date()) {
  const { monthName } = toEthiopian(date);
  return monthName;
}

/**
 * Get time string in EAT (Africa/Addis_Ababa, UTC+3).
 */
export function getEATTime(date = new Date()) {
  return date.toLocaleTimeString('am-ET', {
    timeZone: 'Africa/Addis_Ababa',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
