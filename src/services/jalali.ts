/**
 * Persian Jalali (Solar Hijri) Date Utility
 * Performs offline accurate Gregorian <-> Jalali conversions
 * and formats numbers/dates for Persian UI.
 */

const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

const PERSIAN_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'
];

/**
 * Converts English digits to Persian digits
 */
export function toPersianDigits(num: number | string): string {
  if (num === null || num === undefined) return '';
  const str = String(num);
  const englishToPersianMap: { [key: string]: string } = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
    '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return str.replace(/[0-9]/g, (w) => englishToPersianMap[w]);
}

/**
 * Gregorian to Jalali converter algorithm
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 0) days = (days - 1) % 365;
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

/**
 * Formats ISO Date string (YYYY-MM-DD) into Jalali string (e.g., "۱۲ مرداد ۱۴۰۵")
 */
export function formatJalaliDate(isoDateStr: string): string {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length < 3) return isoDateStr;
  const gy = parseInt(parts[0], 10);
  const gm = parseInt(parts[1], 10);
  const gd = parseInt(parts[2], 10);

  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const monthName = PERSIAN_MONTH_NAMES[jm - 1];

  return `${toPersianDigits(jd)} ${monthName} ${toPersianDigits(jy)}`;
}

/**
 * Formats ISO Date string into Jalali short date (e.g., "۱۴۰۵/۰۵/۱۲")
 */
export function formatJalaliShort(isoDateStr: string): string {
  if (!isoDateStr) return '';
  const parts = isoDateStr.split('-');
  if (parts.length < 3) return isoDateStr;
  const gy = parseInt(parts[0], 10);
  const gm = parseInt(parts[1], 10);
  const gd = parseInt(parts[2], 10);

  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const mStr = jm < 10 ? `0${jm}` : `${jm}`;
  const dStr = jd < 10 ? `0${jd}` : `${jd}`;
  return `${toPersianDigits(jy)}/${toPersianDigits(mStr)}/${toPersianDigits(dStr)}`;
}

/**
 * Gets today's ISO date string YYYY-MM-DD
 */
export function getTodayIsoDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns full Persian header string for today e.g. "شنبه، ۱۲ مرداد ۱۴۰۵"
 */
export function getTodayPersianHeader(): string {
  const d = new Date();
  const iso = getTodayIsoDate();
  const weekdayName = PERSIAN_WEEKDAYS[d.getDay()];
  return `${weekdayName}، ${formatJalaliDate(iso)}`;
}

/**
 * Calculates day difference between two ISO date strings
 */
export function getDaysDifference(isoDate1: string, isoDate2: string): number {
  const d1 = new Date(isoDate1);
  const d2 = new Date(isoDate2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 3600 * 24));
}

/**
 * Computes menstrual cycle day and phase for a target date
 */
export function computeCycleInfo(
  lastPeriodIso: string,
  cycleLength: number = 28,
  periodLength: number = 5,
  pmsStartDaysBefore: number = 7,
  targetIso: string = getTodayIsoDate()
) {
  if (!lastPeriodIso) {
    return {
      cycleDay: 1,
      phase: 'follicular' as const,
      phaseNameFa: 'فولیکولار (رشد تخمک)',
      daysUntilPeriod: Math.max(1, cycleLength || 28),
      inPmsWindow: false,
    };
  }

  const safeLength = Math.max(21, Math.min(45, cycleLength || 28));
  const diffDays = getDaysDifference(lastPeriodIso, targetIso);
  let cycleDay = (diffDays % safeLength);
  if (cycleDay < 0) cycleDay += safeLength;
  cycleDay += 1; // 1-indexed cycle day

  let phase: 'menstrual' | 'follicular' | 'ovulation' | 'luteal' = 'follicular';
  let phaseNameFa = 'فولیکولار (رشد و شادابی)';
  let inPmsWindow = false;

  const ovulationDay = Math.max(periodLength + 2, safeLength - 14);
  const safePmsDays = Math.max(0, Math.min(10, pmsStartDaysBefore || 0));

  if (cycleDay <= Math.min(periodLength, safeLength)) {
    phase = 'menstrual';
    phaseNameFa = 'قاعدگی (حساسیت و ترمیم)';
  } else if (cycleDay < ovulationDay - 1) {
    phase = 'follicular';
    phaseNameFa = 'فولیکولار (شادابی و درخشش)';
  } else if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1) {
    phase = 'ovulation';
    phaseNameFa = 'تخمک‌گذاری (افزایش چربی خفیف)';
  } else {
    phase = 'luteal';
    const daysUntilNextPeriod = safeLength - cycleDay + 1;
    if (daysUntilNextPeriod <= safePmsDays) {
      inPmsWindow = true;
      phaseNameFa = 'فاز لوتئال، نزدیک به بازه پیش از قاعدگی';
    } else {
      phaseNameFa = 'فاز لوتئال';
    }
  }

  const daysUntilPeriod = safeLength - cycleDay + 1;

  return {
    cycleDay,
    phase,
    phaseNameFa,
    daysUntilPeriod,
    inPmsWindow,
  };
}
