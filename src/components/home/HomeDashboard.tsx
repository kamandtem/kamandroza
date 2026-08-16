import React from 'react';
import {
  Sparkles,
  Flame,
  Droplet,
  ShieldAlert,
  Sun,
  Scissors,
  CalendarClock,
  ChevronLeft,
  AlertTriangle,
  Moon as MoonIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DailyTrackerEntry, Product, UserState, WeatherData } from '../../types';
import { buildDailyGuidance, ingredientNamesFa } from '../../services/recommendationEngine';
import { getUpcomingAppointments } from '../../services/providers/appointmentService';
import { LocalDB } from '../../services/db';
import { formatJalaliDayMonth, formatRelativeDay, toPersianDigits } from '../../services/jalali';
import { HormoneCycleCard } from './HormoneCycleCard';
import { WeatherClimateCard } from './WeatherClimateCard';
import { Monthly30DayTracker } from './Monthly30DayTracker';
import type { NavTab } from '../layout/BottomNavigation';
import type { SectionKey } from '../../App';

interface HomeDashboardProps {
  userState: UserState;
  products: Product[];
  todayLog: DailyTrackerEntry;
  weather: WeatherData;
  cycleVisible: boolean;
  onUpdateDailyLog: (log: DailyTrackerEntry) => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenSection: (section: SectionKey) => void;
}

/**
 * داشبورد.
 *
 * حذف شد نسبت به نسخه ۱:
 *  - «امتیاز کل پوست» که از عدد پایه ۷۰ و اهداف سبک زندگی می‌آمد
 *    (نه داده واقعی) و برای همه کاربران تقریباً یکسان بود.
 *  - «سازگاری هورمونی ۸۵٪ عالی» که یک عدد ثابت بی‌معنی بود.
 *  - کارت‌های کشویی که همان محتوای کارت‌های پایین را تکرار می‌کردند.
 *  - کارت چرخه که به همه نشان داده می‌شد، حتی کسی که ردیابی را فعال نکرده بود.
 */
export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userState,
  products,
  todayLog,
  weather,
  cycleVisible,
  onUpdateDailyLog,
  onNavigateTab,
  onOpenSection,
}) => {
  const guidance = buildDailyGuidance({
    profile: userState.profile,
    lifestyle: userState.lifestyle,
    cycleConfig: cycleVisible ? userState.cycleConfig : { ...userState.cycleConfig, enabled: false },
    weather,
    products,
    medications: LocalDB.getMedications(),
  });

  const upcoming = getUpcomingAppointments(2);
  const providers = LocalDB.getProviders();
  const waterTarget = userState.lifestyle.waterTargetGlasses || 8;

  const addWater = () => onUpdateDailyLog({ ...todayLog, waterGlasses: todayLog.waterGlasses + 1 });
  const setSkinScore = (score: number) => onUpdateDailyLog({ ...todayLog, skinStatusScore: score });
  const toggleSunscreen = () => onUpdateDailyLog({ ...todayLog, usedSunscreen: !todayLog.usedSunscreen });

  return (
    <div className="pb-28 pt-3 px-4 max-w-lg mx-auto space-y-4">
      {/* هشدارهای ایمنی — بالاترین اولویت */}
      {guidance.safetyWarningsFa.map((warning, index) => (
        <div
          key={index}
          className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{warning}</p>
        </div>
      ))}

      {/* پرهیز مربوط به نوبت آرایشگاه یا کلینیک */}
      {guidance.procedureInsightFa && (
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 flex items-start gap-2">
          <Scissors className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-sm font-black text-sky-900 dark:text-sky-200">روتین امروز تنطیم شد</h4>
            <p className="text-sm text-sky-900 dark:text-sky-200 leading-relaxed">{guidance.procedureInsightFa}</p>
          </div>
        </div>
      )}

      {guidance.pmsWarningFa && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 rounded-2xl bg-gradient-to-l from-rose-500 to-amber-500 text-white flex items-start gap-2.5"
        >
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-black text-sm">مراقبت پیشگیرانه</h4>
            <p className="text-sm leading-relaxed text-rose-50">{guidance.pmsWarningFa}</p>
          </div>
        </motion.div>
      )}

      {/* نوبت بعدی */}
      {upcoming.length > 0 && (
        <button
          onClick={() => onOpenSection(upcoming[0].providerKind === 'salon' ? 'salon' : 'clinic')}
          className="w-full p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 text-right flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-black text-slate-800 dark:text-white truncate">
                {upcoming[0].titleFa || 'نوبت بعدی'} · {formatRelativeDay(upcoming[0].dateIso)}
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                {providers.find((provider) => provider.id === upcoming[0].providerId)?.name} ·{' '}
                {formatJalaliDayMonth(upcoming[0].dateIso)}
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      )}

      {/* کارت روتین امروز */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-500 via-rose-400 to-amber-400 text-white space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              روتین امروز
            </span>
            <h2 className="text-base font-black mt-2">
              {guidance.gentleMode ? 'امروز روتین ملایم' : 'روتین متناسب با امروزت'}
            </h2>
          </div>

          {userState.currentStreakDays > 0 && (
            <div className="px-3 py-2 rounded-2xl bg-white/20 text-center shrink-0">
              <Flame className="w-4 h-4 mx-auto mb-0.5" />
              <span className="block text-xs font-black whitespace-nowrap">
                {toPersianDigits(userState.currentStreakDays)} روز
              </span>
            </div>
          )}
        </div>

        {guidance.cycleInsightFa && (
          <p className="text-sm leading-relaxed text-rose-50 bg-white/15 p-3 rounded-2xl">{guidance.cycleInsightFa}</p>
        )}

        <button
          onClick={() => onNavigateTab('routine')}
          className="w-full py-3 rounded-2xl bg-white text-rose-600 font-black text-sm active:scale-95 transition-transform"
        >
          شروع روتین
        </button>
      </div>

      {guidance.lifestyleInsightFa && (
        <div className="p-4 rounded-3xl bg-teal-50 dark:bg-teal-950/25 border border-teal-200 dark:border-teal-900/50">
          <p className="text-sm text-teal-900 dark:text-teal-200 leading-relaxed">{guidance.lifestyleInsightFa}</p>
        </div>
      )}

      {/* ترکیبات امروز */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-3">
        <h4 className="text-sm font-black text-slate-800 dark:text-white">ترکیبات امروز</h4>

        <div className="space-y-2">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block mb-1.5">پیشنهاد می‌شود</span>
            <div className="flex flex-wrap gap-1.5">
              {ingredientNamesFa(guidance.recommendedIngredientIds).map((name) => (
                <span
                  key={name}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          {guidance.avoidIngredientIds.length > 0 && (
            <div>
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1.5">امروز پرهیز کن</span>
              <div className="flex flex-wrap gap-1.5">
                {ingredientNamesFa(guidance.avoidIngredientIds).map((name) => (
                  <span
                    key={name}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-bold"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ثبت سریع روزانه */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-4">
        <h4 className="text-sm font-black text-slate-800 dark:text-white">ثبت سریع امروز</h4>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Droplet className="w-5 h-5 text-sky-500 shrink-0" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              آب: {toPersianDigits(todayLog.waterGlasses)} از {toPersianDigits(waterTarget)}
            </span>
          </div>
          <button
            onClick={addWater}
            className="px-4 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold shrink-0"
          >
            یک لیوان +
          </button>
        </div>

        <button
          onClick={toggleSunscreen}
          className={`w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 border transition-colors ${
            todayLog.usedSunscreen
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Sun className="w-4 h-4" />
          {todayLog.usedSunscreen ? 'امروز ضدآفتاب زدم' : 'ضدآفتاب زدم؟'}
        </button>

        <div className="space-y-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">امروز پوستت چطور است؟</span>
          <div className="flex items-center gap-1">
            {[2, 4, 6, 8, 10].map((score) => (
              <button
                key={score}
                onClick={() => setSkinScore(score)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
                  todayLog.skinStatusScore === score
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {toPersianDigits(score)}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            این عدد ملاک نمودار روند پوست و الگوی چرخه‌ات می‌شود.
          </p>
        </div>
      </div>

      {/* چرخه — فقط اگر خود کاربر فعالش کرده باشد */}
      {cycleVisible ? (
        <HormoneCycleCard cycleConfig={userState.cycleConfig} onOpenCycle={() => onOpenSection('cycle')} />
      ) : (
        <button
          onClick={() => onOpenSection('profile')}
          className="w-full p-4 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 text-right flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
              <MoonIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-black text-slate-800 dark:text-white">ردیابی چرخه خاموش است</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                اختیاری است. هر وقت خواستی از پروفایل روشنش کن.
              </span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-slate-400 shrink-0" />
        </button>
      )}

      <WeatherClimateCard weather={weather} />

      <Monthly30DayTracker onOpenProgress={() => onNavigateTab('progress')} />
    </div>
  );
};
