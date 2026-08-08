import React, { useState } from 'react';
import { 
  Moon, 
  Sparkles, 
  ShieldAlert, 
  Heart, 
  Droplets, 
  Activity, 
  Check, 
  Info,
  ChevronLeft,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserState, MenstrualPhase, CycleSymptom } from '../../types';
import { CycleWheel } from './CycleWheel';
import { computeCycleInfo, toPersianDigits, getTodayIsoDate } from '../../services/jalali';
import { LocalDB } from '../../services/db';

interface CycleDashboardProps {
  userState: UserState;
  onUpdateCycleConfig: (newConfig: any) => void;
}


function HormonePatternChart({ cycleDay, cycleLength }: { cycleDay: number; cycleLength: number }) {
  const width = 320, height = 150, pad = 16;
  const points = (fn: (x: number) => number) => Array.from({ length: 48 }, (_, i) => {
    const x = i / 47; const y = Math.max(8, Math.min(142, fn(x)));
    return `${pad + x * (width - pad * 2)},${y}`;
  }).join(' ');
  const estrogen = points(x => 120 - 58 * Math.exp(-((x - .42) ** 2) / .02) - 32 * Math.exp(-((x - .78) ** 2) / .04));
  const progesterone = points(x => 122 - 58 * Math.exp(-((x - .70) ** 2) / .055));
  const lh = points(x => 125 - 112 * Math.exp(-((x - .51) ** 2) / .0018));
  const fsh = points(x => 106 - 26 * Math.exp(-((x - .12) ** 2) / .02) - 22 * Math.exp(-((x - .55) ** 2) / .02));
  const markerX = pad + (Math.max(1, Math.min(cycleDay, cycleLength)) - 1) / Math.max(1, cycleLength - 1) * (width - pad * 2);
  return <div className="rounded-3xl bg-white/80 dark:bg-slate-900/70 border border-rose-100 dark:border-slate-800 p-4 space-y-3">
    <div><h3 className="font-black text-sm">الگوی تقریبی تغییر هورمون‌ها در چرخه</h3><p className="text-[11px] text-slate-500 mt-1 leading-relaxed">این نمودار آموزشی است و مقدار واقعی هورمون‌های بدن شما را اندازه‌گیری نمی‌کند.</p></div>
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" role="img" aria-label="نمودار آموزشی هورمون‌های چرخه">
      <line x1={markerX} x2={markerX} y1="8" y2="142" stroke="#c98978" strokeDasharray="3 3" />
      <polyline points={estrogen} fill="none" stroke="#a855f7" strokeWidth="3" />
      <polyline points={progesterone} fill="none" stroke="#f59e0b" strokeWidth="3" />
      <polyline points={lh} fill="none" stroke="#22c55e" strokeWidth="3" />
      <polyline points={fsh} fill="none" stroke="#38bdf8" strokeWidth="3" />
    </svg>
    <div className="grid grid-cols-4 gap-1 text-[10px] font-bold"><span className="text-purple-600">● استروژن</span><span className="text-amber-600">● پروژسترون</span><span className="text-green-600">● LH</span><span className="text-sky-500">● FSH</span></div>
  </div>;
}

export const CycleDashboard: React.FC<CycleDashboardProps> = ({
  userState,
  onUpdateCycleConfig,
}) => {
  const cycleInfo = computeCycleInfo(
    userState.cycleConfig.lastPeriodDate,
    userState.cycleConfig.cycleLength,
    userState.cycleConfig.periodLength
  );

  const [selectedPhase, setSelectedPhase] = useState<MenstrualPhase>(cycleInfo.phase);
  const [symptomLog, setSymptomLog] = useState<CycleSymptom>({
    date: getTodayIsoDate(),
    acne: 2,
    oiliness: 3,
    dryness: 1,
    redness: 1,
    sensitivity: 2,
    mood: 'calm',
    stress: 2,
    pain: 0,
    bloating: false,
  });
  const [logSaved, setLogSaved] = useState(false);

  const handleSaveSymptom = () => {
    LocalDB.saveCycleSymptom(symptomLog);
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 3000);
  };

  const phaseDetailsMap: Record<MenstrualPhase, {
    titleFa: string;
    hormoneStatusFa: string;
    skinConditionFa: string;
    recommendedRoutinesFa: string[];
    avoidListFa: string[];
    bgGradient: string;
  }> = {
    menstrual: {
      titleFa: 'فاز قاعدگی (روز ۱ تا ۵)',
      hormoneStatusFa: 'کاهش شدید استروژن و پروژسترون - سطح انرژی کم‌تر',
      skinConditionFa: 'سد دفاعی پوست حساس‌تر و دهیدراته‌تر است. احتمال التهاب و احساس کشیدگی بالاتر است.',
      recommendedRoutinesFa: ['استفاده از شوینده بی‌آب‌رسان و ملایم', 'کرم‌های حاوی سرامید و پانتنول', 'ترکیبات سیکا و آلوئه‌ورا'],
      avoidListFa: ['اسیدهای لایه‌بردار قوی (AHAs)', 'پیلینگ شیمیایی', 'رتینول با غلظت بالا'],
      bgGradient: 'from-rose-50 to-pink-50 border-rose-200',
    },
    follicular: {
      titleFa: 'فاز فولیکولار (روز ۶ تا ۱۲)',
      hormoneStatusFa: 'افزایش تدریجی استروژن - افزایش کلاژن‌سازی طبیعی',
      skinConditionFa: 'پوست در درخشان‌ترین و شاداب‌ترین حالت ماه قرار دارد. رطوبت طبیعی عالی است.',
      recommendedRoutinesFa: ['سرم ویتامین C آنتی‌اکسیدان', 'هیالورونیک اسید', 'لایه‌برداری ملایم'],
      avoidListFa: ['دستکاری بی‌دلیل روتین‌های موفق'],
      bgGradient: 'from-emerald-50 to-teal-50 border-emerald-200',
    },
    ovulation: {
      titleFa: 'فاز تخمک‌گذاری (روز ۱۳ تا ۱۶)',
      hormoneStatusFa: 'اوج استروژن و هورمون LH - افزایش ترشح سبوم چربی',
      skinConditionFa: 'پوست شفاف است ولی چربی طبیعی آن افزایش یافته و منافذ مستعد گرفتن چربی هستند.',
      recommendedRoutinesFa: ['سرم نیاسینامید برای کنترل چربی', 'پاکسازی منافذ با سالیسیلیک اسید ملایم', 'مرطوب‌کننده فاقد چربی'],
      avoidListFa: ['کرم‌های سنگین کومدون‌زا'],
      bgGradient: 'from-amber-50 to-yellow-50 border-amber-200',
    },
    luteal: {
      titleFa: 'فاز لوتئال و بازه احتمالی پیش از قاعدگی',
      hormoneStatusFa: 'افزایش پروژسترون و تستوسترون نسبی - تورم منافذ',
      skinConditionFa: 'بیشترین احتمال بروز جوش‌های هورمونی (به‌خصوص چانه و فک) و چربی بی‌پایان پوست.',
      recommendedRoutinesFa: ['استفاده روزانه از سالیسیلیک اسید BHA', 'سرم ضدجوش آزلائیک اسید', 'ماسک خاک‌رس هفته‌ای ۱ بار'],
      avoidListFa: ['کرم‌های چرب و سنگین', 'شیرینی و قند زیاد', 'دستکاری جوش‌ها'],
      bgGradient: 'from-purple-50 to-indigo-50 border-purple-200',
    },
  };

  const currentPhaseDetail = phaseDetailsMap[selectedPhase];

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto space-y-5">
      {/* Header Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-rose-100">
              <Moon className="w-3.5 h-3.5" />
              ردیاب هورمونی پوست
            </span>
            <h2 className="text-xl font-black mt-2">روز {toPersianDigits(cycleInfo.cycleDay)} چرخه</h2>
            <p className="text-xs text-rose-100 mt-0.5">{cycleInfo.phaseNameFa}</p>
          </div>

          <div className="text-center px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
            <span className="block text-[10px] text-rose-100 font-bold">پریود بعدی</span>
            <span className="text-lg font-black text-amber-200 leading-tight">
              {toPersianDigits(cycleInfo.daysUntilPeriod)} روز
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Cycle Wheel Component */}
      <div className="p-5 rounded-3xl bg-white/90 border border-[#ebe0d4] shadow-xs text-center space-y-3">
        <h3 className="text-sm font-extrabold text-[#3a2f27] flex items-center justify-center gap-1.5">
          <span>چرخه ۳۶۰ درجه هورمونی و تغییرات پوست</span>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </h3>
        <p className="text-xs text-[#8a766c]">
          روی هر بخش کلیک کنید تا توصیه و الگوی جوش آن فاز را ببینید.
        </p>

        <CycleWheel
          currentDay={cycleInfo.cycleDay}
          totalDays={userState.cycleConfig.cycleLength || 28} periodLength={userState.cycleConfig.periodLength || 5}
          activePhase={selectedPhase}
          onSelectPhase={(phase) => setSelectedPhase(phase)}
        />

        {/* Phase Selector Pills */}
        <div className="grid grid-cols-4 gap-1.5 pt-2">
          {(['menstrual', 'follicular', 'ovulation', 'luteal'] as MenstrualPhase[]).map((ph) => {
            const isSel = selectedPhase === ph;
            const names: Record<MenstrualPhase, string> = {
              menstrual: 'قاعدگی',
              follicular: 'فولیکولار',
              ovulation: 'تخمک‌گذاری',
              luteal: 'لوتئال',
            };
            return (
              <button
                key={ph}
                onClick={() => setSelectedPhase(ph)}
                className={`py-2 px-1 rounded-2xl text-[11px] font-bold border transition-all ${
                  isSel
                    ? 'bg-[#8e5241] text-white border-[#8e5241] shadow-xs'
                    : 'bg-[#f6ede5] text-[#705c4f] border-[#e5d8cb] hover:bg-[#eee3d8]'
                }`}
              >
                {names[ph]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Phase Detailed Insight Card */}
      <div className={`p-5 rounded-3xl bg-gradient-to-br ${currentPhaseDetail.bgGradient} shadow-xs border space-y-3`}>
        <div className="flex items-center justify-between">
          <h4 className="font-black text-base text-[#2e2621]">
            {currentPhaseDetail.titleFa}
          </h4>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/80 border border-black/10">
            تحلیل تخصصی
          </span>
        </div>

        <p className="text-xs text-[#52443a] leading-relaxed">
          <strong>وضعیت هورمون‌ها:</strong> {currentPhaseDetail.hormoneStatusFa}
        </p>

        <p className="text-xs text-[#52443a] leading-relaxed bg-white/60 p-3 rounded-2xl border border-white/50">
          <strong>تغییرات پوست:</strong> {currentPhaseDetail.skinConditionFa}
        </p>

        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-emerald-800 block">✓ روتین و ترکیبات طلایی این فاز:</span>
          <ul className="text-xs text-[#40342c] space-y-1 pr-3 list-disc">
            {cycleInfo.inPmsWindow && <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs leading-relaxed">بر اساس تاریخ ثبت‌شده، احتمالاً چند روز دیگر وارد بازه پیش از قاعدگی می‌شوید. این یک برآورد آموزشی است، نه تشخیص پزشکی.</div>}
            <HormonePatternChart cycleDay={cycleInfo.cycleDay} cycleLength={userState.cycleConfig.cycleLength || 28} />
            {currentPhaseDetail.recommendedRoutinesFa.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Daily Symptom Tracker Logger */}
      <div className="p-5 rounded-3xl bg-white/90 border border-[#ebe0d4] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#3a2f27] flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-rose-500" />
            ثبت علائم روزانه پوست و هورمون
          </h3>
          <span className="text-[10px] text-[#8a766c] font-bold">امروز</span>
        </div>

        {/* Acne Score Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-[#5c4a3e]">
            <span>شدت جوش و آکنه</span>
            <span className="text-rose-600">{toPersianDigits(symptomLog.acne)} از ۵</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            value={symptomLog.acne}
            onChange={(e) => setSymptomLog({ ...symptomLog, acne: parseInt(e.target.value, 10) })}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        {/* Oiliness Score Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-[#5c4a3e]">
            <span>میزان چربی صورت</span>
            <span className="text-amber-600">{toPersianDigits(symptomLog.oiliness)} از ۵</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            value={symptomLog.oiliness}
            onChange={(e) => setSymptomLog({ ...symptomLog, oiliness: parseInt(e.target.value, 10) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Sensitivity Score Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold text-[#5c4a3e]">
            <span>حساسیت و سوزش</span>
            <span className="text-purple-600">{toPersianDigits(symptomLog.sensitivity)} از ۵</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            value={symptomLog.sensitivity}
            onChange={(e) => setSymptomLog({ ...symptomLog, sensitivity: parseInt(e.target.value, 10) })}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveSymptom}
          className="w-full py-3 rounded-2xl bg-[#8e5241] hover:bg-[#784334] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          {logSaved ? (
            <>
              <Check className="w-4 h-4 text-emerald-200" />
              علائم با موفقیت ذخیره شد!
            </>
          ) : (
            'ثبت نهایی علائم امروز'
          )}
        </button>
      </div>
    </div>
  );
};
