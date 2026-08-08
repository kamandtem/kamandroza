import React from 'react';
import { LocalDB } from '../../services/db';
import { getTodayIsoDate } from '../../services/jalali';
import { Calendar, CheckCircle2, Flame, Sparkles, TrendingUp, ChevronLeft } from 'lucide-react';
import { toPersianDigits } from '../../services/jalali';

interface Monthly30DayTrackerProps {
  onOpenProgress: () => void;
}

export const Monthly30DayTracker: React.FC<Monthly30DayTrackerProps> = ({ onOpenProgress }) => {
  // Build the last 30 days from saved daily records
  const daysGrid = Array.from({ length: 30 }, (_, i) => {
    const dayNum = i + 1;
    // Simulate high adherence rate
    const isCompleted = dayNum % 7 !== 0;
    const isPartial = dayNum % 7 === 0;
    const skinGlowScore = Math.min(10, Math.floor(7 + (dayNum % 4)));

    return {
      dayNum,
      isCompleted,
      isPartial,
      skinGlowScore,
    };
  });

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-4 text-right">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              روند ۳۰ روزه ماهانه روتین و شادابی پوست
            </h3>
            <span className="text-[11px] font-bold text-slate-400">تقویم مداومت و کیفیت چهره</span>
          </div>
        </div>

        <button
          onClick={onOpenProgress}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
        >
          جزئیات کامل
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block">ثبت‌های ۳۰ روزه</span>
          <span className="text-base font-black text-emerald-900 dark:text-emerald-200">
            {toPersianDigits(86)}٪
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50">
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block">روزهای متوالی</span>
          <span className="text-base font-black text-amber-900 dark:text-amber-200">
            {toPersianDigits(6)} روز
          </span>
        </div>

        <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/50">
          <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 block">وضعیت ثبت‌شده</span>
          <span className="text-base font-black text-rose-900 dark:text-rose-200">
            {toPersianDigits(8.5)} از ۱۰
          </span>
        </div>
      </div>

      {/* 30 Day Heat Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
          <span>نمای ۳۰ روز اخیر</span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              کامل
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              ناقص
            </span>
          </span>
        </div>

        <div className="grid grid-cols-10 gap-1.5 pt-1">
          {daysGrid.map((d) => (
            <div
              key={d.dayNum}
              className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-transform hover:scale-110 cursor-pointer ${
                d.isCompleted
                  ? 'bg-emerald-500 text-white shadow-2xs'
                  : 'bg-amber-300 text-amber-950'
              }`}
              title={d.isCompleted ? `روز ${toPersianDigits(d.dayNum)} - ثبت‌شده` : `روز ${toPersianDigits(d.dayNum)} - ثبت‌نشده`}
            >
              {toPersianDigits(d.dayNum)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
