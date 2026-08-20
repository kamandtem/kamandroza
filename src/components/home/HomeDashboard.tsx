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
import { SEVERITY_LABEL_FA, SEVERITY_STYLE } from '../../services/advice/severity';
import { findGuideTopicForSource, findWhyTopicForIngredientAdvice } from '../../services/content/guideContent';
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
  onRequestWeatherLocation?: () => void;
  weatherLocationLoading?: boolean;
  weatherLocationError?: boolean;
  cycleVisible: boolean;
  onUpdateDailyLog: (log: DailyTrackerEntry) => void;
  onNavigateTab: (tab: NavTab) => void;
  onOpenSection: (section: SectionKey) => void;
  onOpenGuideTopic?: (topicId: string) => void;
}

const WhyButton: React.FC<{ topicId?: string; onOpenGuideTopic?: (topicId: string) => void; className?: string }> = ({ topicId, onOpenGuideTopic, className = '' }) => {
  if (!topicId || !onOpenGuideTopic) return null;
  return (
    <button
      onClick={() => onOpenGuideTopic(topicId)}
      className={`shrink-0 text-[11px] font-black underline underline-offset-2 ${className}`}
    >
      چرا؟
    </button>
  );
};

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
  onRequestWeatherLocation,
  weatherLocationLoading,
  weatherLocationError,
  cycleVisible,
  onUpdateDailyLog,
  onNavigateTab,
  onOpenSection,
  onOpenGuideTopic,
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
    <div className="pb-[calc(var(--safe-bottom)+7rem)] px-4 max-w-lg mx-auto space-y-4">
      {weather.hasData || onRequestWeatherLocation ?       <WeatherClimateCard weather={weather} onRequestLocation={onRequestWeatherLocation} locationLoading={weatherLocationLoading} locationError={weatherLocationError} /> : null}

      {/* در حالت بارداری، کارت چرخه به‌جای پیش‌بینی پریود فقط وضعیت بارداری را نشان می‌دهد */}
      {cycleVisible && userState.profile.isPregnant && (
        <button
          onClick={() => onOpenSection('cycle')}
          className="w-full p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-right flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <MoonIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-black text-amber-900 dark:text-amber-100">وضعیت بارداری فعاله</span>
              <span className="block text-xs text-amber-900/70 dark:text-amber-200/70">پریودت شروع شده؟ اینجا ثبتش کن</span>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 text-amber-700/60 dark:text-amber-300/60 shrink-0" />
        </button>
      )}
      {cycleVisible && !userState.profile.isPregnant && (
        <HormoneCycleCard cycleConfig={userState.cycleConfig} onOpenCycle={() => onOpenSection('cycle')} compact />
      )}

      {/* هشدارهای ایمنی — بالاترین اولویت */}
      {guidance.safetyWarningsFa.map((warning, index) => (
        <div
          key={index}
          className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 flex items-start justify-between gap-2">
            <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">{warning}</p>
            <WhyButton topicId="guide_l3_why_not_today" onOpenGuideTopic={onOpenGuideTopic} className="text-amber-800 dark:text-amber-200" />
          </div>
        </div>
      ))}

      {/* پرهیز مربوط به نوبت آرایشگاه یا کلینیک */}
      {guidance.procedureInsightFa && (
        <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/50 flex items-start gap-2">
          <Scissors className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="flex-1 flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <h4 className="text-sm font-black text-sky-900 dark:text-sky-200">روتین امروز تنطیم شد</h4>
              <p className="text-sm text-sky-900 dark:text-sky-200 leading-relaxed">{guidance.procedureInsightFa}</p>
            </div>
            <WhyButton topicId={findGuideTopicForSource('procedure')?.id} onOpenGuideTopic={onOpenGuideTopic} className="text-sky-800 dark:text-sky-200" />
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
          <div className="flex-1 flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <h4 className="font-black text-sm">مراقبت پیشگیرانه</h4>
              <p className="text-sm leading-relaxed text-rose-50">{guidance.pmsWarningFa}</p>
            </div>
            <WhyButton topicId={findGuideTopicForSource('cycle')?.id} onOpenGuideTopic={onOpenGuideTopic} className="text-white" />
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            روتین امروز
          </span>

          {userState.currentStreakDays > 0 && (
            <div className="px-3 py-2 rounded-2xl bg-white/20 text-center shrink-0">
              <Flame className="w-4 h-4 mx-auto mb-0.5" />
              <span className="block text-xs font-black whitespace-nowrap">
                {toPersianDigits(userState.currentStreakDays)} روز
              </span>
            </div>
          )}
        </div>

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

      {guidance.ageInsightFa && (
        <div className="p-4 rounded-3xl bg-purple-50 dark:bg-purple-950/25 border border-purple-200 dark:border-purple-900/50">
          <p className="text-sm text-purple-900 dark:text-purple-200 leading-relaxed">{guidance.ageInsightFa}</p>
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

          {guidance.ingredientAdvice.length > 0 && (
            <div className="space-y-2">
              {(['PROFESSIONAL_INSTRUCTION', 'IMPORTANT', 'CAUTION', 'SUGGESTION', 'INFO'] as const)
                .map((severity) => ({
                  severity,
                  items: guidance.ingredientAdvice.filter((advice) => advice.severity === severity),
                }))
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <div key={group.severity}>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                      {SEVERITY_LABEL_FA[group.severity]}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((advice) => {
                        const whyTopicId = findWhyTopicForIngredientAdvice({ ingredientId: advice.ingredientId, source: advice.source })?.id;
                        return (
                          <span
                            key={advice.ruleId}
                            title={advice.reasonFa}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${SEVERITY_STYLE[advice.severity]}`}
                          >
                            {advice.ingredientNameFa}
                            {advice.educationalOnly ? ' (آموزشی)' : ''}
                            <WhyButton topicId={whyTopicId} onOpenGuideTopic={onOpenGuideTopic} />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {guidance.ingredientAdvice.length === 0 && guidance.avoidIngredientIds.length > 0 && (
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

      <Monthly30DayTracker onOpenProgress={() => onNavigateTab('progress')} />
    </div>
  );
};
