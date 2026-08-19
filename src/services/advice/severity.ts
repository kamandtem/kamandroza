/**
 * کمک‌ابزار شدت توصیه.
 *
 * تنها منبع مقایسه، برچسب فارسی و رنگ هر سطح. UI نباید خودش
 * برای شدت متن یا رنگ بسازد.
 */

import { AdviceSeverity } from '../../types';

export const SEVERITY_RANK: Record<AdviceSeverity, number> = {
  INFO: 0,
  SUGGESTION: 1,
  CAUTION: 2,
  IMPORTANT: 3,
  PROFESSIONAL_INSTRUCTION: 4,
};

export function maxSeverity(a: AdviceSeverity, b: AdviceSeverity): AdviceSeverity {
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

const ORDER: AdviceSeverity[] = ['INFO', 'SUGGESTION', 'CAUTION', 'IMPORTANT', 'PROFESSIONAL_INSTRUCTION'];

/** یک پله بالاتر — مثلاً پوست حساس روی قاعدهٔ پروسیجر. */
export function escalate(severity: AdviceSeverity, steps = 1, ceiling: AdviceSeverity = 'IMPORTANT'): AdviceSeverity {
  const next = ORDER[Math.min(ORDER.length - 1, SEVERITY_RANK[severity] + steps)];
  return SEVERITY_RANK[next] > SEVERITY_RANK[ceiling] ? ceiling : next;
}

export function isAtLeast(severity: AdviceSeverity, floor: AdviceSeverity): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[floor];
}

/** این شدت واقعاً جلوی مصرف را می‌گیرد؟ فقط دو سطح بالا. */
export function isRestrictive(severity: AdviceSeverity): boolean {
  return isAtLeast(severity, 'IMPORTANT');
}

export const SEVERITY_LABEL_FA: Record<AdviceSeverity, string> = {
  INFO: 'فقط برای اطلاع',
  SUGGESTION: 'پیشنهاد',
  CAUTION: 'با احتیاط',
  IMPORTANT: 'مهم',
  PROFESSIONAL_INSTRUCTION: 'دستور پزشک یا مرکز درمانی',
};

/** توضیح یک‌خطی هر سطح برای کاربر عامی. */
export const SEVERITY_HINT_FA: Record<AdviceSeverity, string> = {
  INFO: 'لازم نیست کاری کنی؛ فقط خوب است بدانی.',
  SUGGESTION: 'اختیاری است. اگر پوستت راحت است، می‌توانی روتین را عوض نکنی.',
  CAUTION: 'بهتر است جدی بگیری، ولی این ممنوعیت نیست.',
  IMPORTANT: 'برای ایمنی خودت در این بازه رعایت کن.',
  PROFESSIONAL_INSTRUCTION: 'این مورد به تأیید پزشک نیاز دارد.',
};

export const SEVERITY_STYLE: Record<AdviceSeverity, string> = {
  INFO: 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
  SUGGESTION: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900/50 text-sky-900 dark:text-sky-200',
  CAUTION: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200',
  IMPORTANT: 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-900/50 text-orange-900 dark:text-orange-200',
  PROFESSIONAL_INSTRUCTION: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200',
};
