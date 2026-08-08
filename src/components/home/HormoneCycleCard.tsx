import React from 'react';
import { Moon, Sparkles, Activity, ShieldAlert, ChevronLeft, HeartPulse } from 'lucide-react';
import { motion } from 'motion/react';
import { toPersianDigits } from '../../services/jalali';

interface HormoneCycleCardProps {
  cycleDay: number;
  cycleLength?: number;
  onOpenCycle: () => void;
  onLogSymptoms: () => void;
}

export function calculateHormoneData(cycleDay: number, cycleLength: number = 28) {
  const day = ((cycleDay - 1) % cycleLength) + 1;
  let phaseName = 'فاز فولیکولار (رشد و شادابی)';
  let estrogen = 65; // %
  let progesterone = 15; // %
  let skinStatusFa = 'پوست در بهترین حالت شادابی و جذب روتین قرار دارد.';
  let recommendedAction = 'زمان عالی برای ماسک‌ها و تغذیه عمیق پوست';
  let badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300';

  if (day <= 5) {
    phaseName = 'فاز قاعدگی (افت هورمونی)';
    estrogen = 20;
    progesterone = 10;
    skinStatusFa = 'کاهش هورمون‌ها باعث افت رطوبت و حساسیت سد دفاعی می‌شود.';
    recommendedAction = 'روتین آبرسان، بدون اسیدهای قوی و تسکین‌دهنده';
    badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300';
  } else if (day <= 13) {
    phaseName = 'فاز فولیکولار (اوج استروژن و کلاژن)';
    estrogen = Math.min(95, 35 + (day - 5) * 8);
    progesterone = 20;
    skinStatusFa = 'افزایش کلاژن‌سازی و رطوبت طبیعی پوست. چهره درخشان‌تر است.';
    recommendedAction = 'لایه‌برداری ملایم AHA و سرم ویتامین C';
    badgeColor = 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300';
  } else if (day <= 16) {
    phaseName = 'فاز تخمک‌گذاری (پیک استروژن)';
    estrogen = 98;
    progesterone = 45;
    skinStatusFa = 'پوست بیشترین درخشش را دارد؛ کمی ترشح چربی رو به افزایش است.';
    recommendedAction = 'ضدآفتاب مرتب و مرطوب‌کننده سبک فاقد چربی';
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300';
  } else {
    phaseName = 'فاز لوتئال / PMS (اوج پروژسترون)';
    estrogen = 40;
    progesterone = Math.min(95, 45 + (day - 16) * 4);
    skinStatusFa = 'افزایش چربی پوست، انسداد منافذ و احتمال جوش‌های هورمونی چانه.';
    recommendedAction = 'استفاده از شوینده سالیسیلیک اسید (BHA) و نیاسینامید';
    badgeColor = 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300';
  }

  return { day, phaseName, estrogen, progesterone, skinStatusFa, recommendedAction, badgeColor };
}

export const HormoneCycleCard: React.FC<HormoneCycleCardProps> = ({
  cycleDay,
  cycleLength = 28,
  onOpenCycle,
  onLogSymptoms,
}) => {
  const data = calculateHormoneData(cycleDay, cycleLength);

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-4 text-right">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
              چرخه هورمونی و وضعیت پوست
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              روز {toPersianDigits(data.day)} از {toPersianDigits(cycleLength)} چرخه ماهانه
            </span>
          </div>
        </div>

        <button
          onClick={onOpenCycle}
          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5"
        >
          تقویم هورمونی
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Phase Badge */}
      <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${data.badgeColor}`}>
        <span className="flex items-center gap-1.5">
          <Moon className="w-4 h-4 text-purple-600 dark:text-purple-300" />
          {data.phaseName}
        </span>
        <span className="text-[10px] opacity-80">تحلیل هورمونی روزانه</span>
      </div>

      {/* Estrogen and Progesterone Gauges */}
      <div className="space-y-3 bg-rose-50/50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-rose-100/60 dark:border-slate-800">
        <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200 mb-2 flex items-center justify-between">
          <span>سطح تخمینی هورمون‌های پوستی امروز</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        </div>

        {/* Estrogen Meter */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-rose-600 dark:text-rose-400">استروژن (شتاب کلاژن و شادابی):</span>
            <span className="text-slate-800 dark:text-white font-extrabold">{toPersianDigits(data.estrogen)}٪</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.estrogen}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-rose-400 via-pink-500 to-rose-600"
            />
          </div>
        </div>

        {/* Progesterone Meter */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-purple-600 dark:text-purple-400">پروژسترون (ترشح چربی و منافذ):</span>
            <span className="text-slate-800 dark:text-white font-extrabold">{toPersianDigits(data.progesterone)}٪</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.progesterone}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-purple-400 via-indigo-500 to-purple-600"
            />
          </div>
        </div>
      </div>

      {/* Skincare Advice */}
      <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs space-y-1">
        <span className="font-extrabold text-amber-900 dark:text-amber-200 block">
          💡 راهکار مراقبتی مناسب هورمون‌های امروز:
        </span>
        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
          {data.skinStatusFa} <span className="font-bold text-amber-800 dark:text-amber-300">({data.recommendedAction})</span>
        </p>
      </div>

      {/* Quick Action Button */}
      <button
        onClick={onLogSymptoms}
        className="w-full py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        <Activity className="w-4 h-4" />
        ثبت علائم و حالات امروز در تقویم PMS
      </button>
    </div>
  );
};
