import React from 'react';
import { Moon, ChevronLeft, Activity, AlertTriangle } from 'lucide-react';
import { MenstrualCycleConfig, MenstrualPhase } from '../../types';
import { getTodayCycleState } from '../../services/cycle/cycleService';
import { formatJalaliDayMonth, toPersianDigits } from '../../services/jalali';

interface HormoneCycleCardProps {
  cycleConfig: MenstrualCycleConfig;
  onOpenCycle: () => void;
  compact?: boolean;
}

const PHASE_INFO: Record<MenstrualPhase, { titleFa: string; skinFa: string; actionFa: string; color: string }> = {
  menstrual: {
    titleFa: 'فاز قاعدگی',
    skinFa: 'سد دفاعی پوست حساس‌تر است و رطوبتش کمتر می‌ماند.',
    actionFa: 'روتین ملایم و آبرسان. لایه‌بردار قوی نه.',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-900',
  },
  follicular: {
    titleFa: 'فاز فولیکولار',
    skinFa: 'معمولاً مقاوم‌ترین و شاداب‌ترین بخش ماه.',
    actionFa: 'بهترین زمان فیشیال، لیزر و ترکیبات فعال.',
    color:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900',
  },
  ovulation: {
    titleFa: 'تخمک‌گذاری تقریبی',
    skinFa: 'ترشح چربی رو به افزایش است.',
    actionFa: 'مرطوب‌کننده سبک و پاکسازی منطم.',
    color:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-900',
  },
  luteal: {
    titleFa: 'فاز لوتئال',
    skinFa: 'منافذ مستعد انسداد و جوش هورمونی هستند.',
    actionFa: 'پیشگیری با نیاسینامید و آزلائیک اسید.',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-900',
  },
};

const CONFIDENCE_LABEL: Record<string, string> = {
  none: 'برای پیش‌بینی، چند چرخه ثبت لازم است',
  low: 'دقت پیش‌بینی فعلاً پایین است',
  medium: 'دقت پیش‌بینی متوسط',
  high: 'دقت پیش‌بینی خوب',
};

/**
 * کارت چرخه.
 *
 * دو مشکل نسخه ۱ حل شد:
 *  ۱) روز چرخه از فیلدی به نام cycleDayCount خوانده می‌شد که اصلاً وجود
 *     نداشت، پس همیشه عدد جانشین ۱۴ نمایش داده می‌شد.
 *  ۲) «سطح تخمینی هورمون‌ها: استروژن ۶۵٪». این اعداد از هیچ داده‌ای
 *     نمی‌آمدند. نمایش درصد هورمون بدن کاربر هم گمراه‌کننده است و هم
 *     ریسک حقوقی. جایش توصیف کیفی و قابل استفاده آمد.
 */
export const HormoneCycleCard: React.FC<HormoneCycleCardProps> = ({ cycleConfig, onOpenCycle, compact = false }) => {
  const state = getTodayCycleState(cycleConfig);

  if (!state.available || !state.phase || state.cycleDay === null) {
    return (
      <button
        onClick={onOpenCycle}
        className="w-full p-4 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-purple-200 dark:border-slate-700 text-right flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-black text-slate-800 dark:text-white">چرخه ماهانه</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              برای شروع، روز اول آخرین پریودت را ثبت کن
            </span>
          </div>
        </div>
        <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
      </button>
    );
  }

  const info = PHASE_INFO[state.phase];

  return (
    <div className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-3 ${compact ? 'max-h-[270px] overflow-hidden' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-sm text-slate-800 dark:text-white">چرخه ماهانه</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              روز {toPersianDigits(state.cycleDay)} از حدود {toPersianDigits(state.cycleLength)}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenCycle}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-0.5 shrink-0"
        >
          جزئیات
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className={`p-3 rounded-2xl border ${info.color} space-y-1`}>
        <span className="text-sm font-black block">{info.titleFa}</span>
        <p className="text-sm leading-relaxed opacity-90">{info.skinFa}</p>
      </div>

      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1">
        <span className="text-xs font-black text-slate-800 dark:text-white block">امروز چه کار کنیم</span>
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{info.actionFa}</p>
      </div>

      {/* پیش‌بینی به شکل بازه، نه روز دقیق. با سطح اطمینان شفاف. */}
      {state.nextPeriodFromIso && state.nextPeriodToIso && (
        <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          <Activity className="w-4 h-4 text-rose-500 shrink-0 mt-1" />
          <span>
            پریود بعدی حدود {formatJalaliDayMonth(state.nextPeriodFromIso)} تا{' '}
            {formatJalaliDayMonth(state.nextPeriodToIso)}. {CONFIDENCE_LABEL[state.confidence]}.
          </span>
        </div>
      )}

      {state.inPmsWindow && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
            احتمالاً در بازه پیش از قاعدگی هستی. این یک برآورد بر اساس ثبت‌های خودت است، نه تشخیص پزشکی.
          </p>
        </div>
      )}
    </div>
  );
};
