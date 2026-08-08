import React from 'react';
import { 
  Sparkles, 
  Flame, 
  HeartPulse, 
  Droplet, 
  Moon, 
  Plus, 
  ChevronLeft, 
  ShieldAlert, 
  Sun,
  Camera,
  FlaskConical,
  CheckCircle2,
  BookOpen,
  Bell,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserState, DailyTrackerEntry, WeatherData } from '../../types';
import { generateDailyRecommendations } from '../../services/recommendationEngine';
import { toPersianDigits } from '../../services/jalali';
import { StackCards, StackCardData } from './StackCards';
import { HormoneCycleCard } from './HormoneCycleCard';
import { WeatherClimateCard } from './WeatherClimateCard';
import { Monthly30DayTracker } from './Monthly30DayTracker';

interface HomeDashboardProps {
  userState: UserState;
  todayLog: DailyTrackerEntry;
  weather: WeatherData;
  onUpdateDailyLog: (log: DailyTrackerEntry) => void;
  onNavigateTab: (tab: any) => void;
  onOpenSection: (sectionKey: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  userState,
  todayLog,
  weather,
  onUpdateDailyLog,
  onNavigateTab,
  onOpenSection,
}) => {
  const cycleConfig = userState?.cycleConfig || { lastPeriodDate: '', cycleLength: 28, periodLength: 5 };
  const recommendations = generateDailyRecommendations(
    userState?.profile || {} as any,
    userState?.lifestyle || {} as any,
    cycleConfig.lastPeriodDate || '',
    cycleConfig.cycleLength || 28,
    cycleConfig.periodLength || 5,
    weather,
    []
  );

  const handleAddWater = () => {
    const currentWater = todayLog.waterGlasses || 0;
    onUpdateDailyLog({
      ...todayLog,
      waterGlasses: currentWater + 1,
    });
  };

  const handleSetSleep = (hours: number) => {
    onUpdateDailyLog({
      ...todayLog,
      sleepHours: hours,
    });
  };

  // Stack cards for swipeable / expandable recommendations
  const stackCardsList: StackCardData[] = [
    {
      id: 'card_hormone_today',
      titleFa: 'هوشمندی چرخه هورمونی پوست',
      subtitleFa: `تحلیل چرخه روز ${toPersianDigits(userState.cycleDayCount)}`,
      contentFa: recommendations.cycleInsightFa || recommendations.primaryInsightFa,
      accentColor: 'from-rose-500 via-amber-400 to-rose-600',
      badgeTextFa: 'تحلیل هوشمند هورمون',
      iconName: 'Moon',
    },
    {
      id: 'card_weather_today',
      titleFa: `محافظت خورشیدی (UV: ${toPersianDigits(weather.uvIndex)})`,
      subtitleFa: weather.conditionFa,
      contentFa: recommendations.weatherInsightFa || weather.recommendationFa,
      accentColor: 'from-amber-400 via-orange-400 to-rose-400',
      badgeTextFa: 'اقلیم و هواشناس',
      iconName: 'Sun',
    },
    {
      id: 'card_ingredients_today',
      titleFa: 'ترکیبات کلیدی امروز',
      subtitleFa: 'پیشنهاد متخصص هوش مصنوعی پوست',
      contentFa: `ترکیبات محبوب امروز: ${recommendations.recommendedIngredientsFa.join('، ')}. ${
        recommendations.avoidIngredientsFa.length > 0
          ? `ترکیبات پرهیز: ${recommendations.avoidIngredientsFa.join('، ')}.`
          : ''
      }`,
      accentColor: 'from-emerald-400 via-teal-500 to-sky-500',
      badgeTextFa: 'دانشنامه ترکیبات',
      iconName: 'Sparkles',
    },
  ];

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto space-y-4 font-['Vazirmatn',sans-serif] text-slate-800 dark:text-white">
      {/* Alert Warning if PMS or High Risk */}
      {recommendations.pmsWarningAlert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md flex items-start gap-2.5"
        >
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-white animate-bounce" />
          <div className="space-y-0.5 text-right">
            <h4 className="font-extrabold text-xs">هشدار مراقبت ویژه پوستی:</h4>
            <p className="text-xs text-rose-50 leading-relaxed font-medium">
              {recommendations.pmsWarningAlert}
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Skin Score & Streak Hero Card - Bright Hopeful Gradient */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-rose-500 via-amber-400 to-rose-600 text-white shadow-xl relative overflow-hidden border border-rose-300/40">
        {/* Background decorative glows */}
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-amber-300/30 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white border border-white/30 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              شناسنامه درخشش پوست
            </span>
            <h2 className="text-lg sm:text-xl font-black mt-2 text-white">سلامت و کیفیت پوست</h2>
          </div>

          <div className="text-center px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-xs">
            <span className="block text-[10px] text-white/90 font-bold">امتیاز کل</span>
            <span className="text-2xl sm:text-3xl font-black text-white leading-none">
              {toPersianDigits(recommendations.skinScore)}
            </span>
          </div>
        </div>

        {/* Streak & Level Bar */}
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/25 relative z-10 text-right">
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Flame className="w-4 h-4 fill-white" />
            </div>
            <div>
              <span className="block text-[10px] text-white/90">زنجیره مداومت</span>
              <span className="text-xs font-black text-white">{toPersianDigits(userState.currentStreakDays)} روز متوالی</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[10px] text-white/90">سازگاری هورمونی</span>
              <span className="text-xs font-black text-white">{toPersianDigits(recommendations.hormonalCompatibilityScore)}٪ عالی</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Stack Cards Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
            توصیه‌ها و هوشمندی امروز
          </h3>
          <span className="text-xs text-slate-400">کارت‌های کشویی</span>
        </div>
        <StackCards cards={stackCardsList} />
      </div>

      {/* 1. DEDICATED SMART HORMONE CYCLE CARD */}
      <HormoneCycleCard
        cycleDay={userState.cycleDayCount || 14}
        cycleLength={userState.cycleConfig.cycleLength || 28}
        onOpenCycle={() => onOpenSection('cycle')}
        onLogSymptoms={() => onOpenSection('cycle')}
      />

      {/* 2. DEDICATED CLIMATE & WEATHER CARD WITH MATCHING IMAGE */}
      <WeatherClimateCard weather={weather} />

      {/* 3. DEDICATED 30-DAY MONTHLY HABITS & SKIN PROGRESS TRACKER */}
      <Monthly30DayTracker onOpenProgress={() => onNavigateTab('progress')} />

      {/* 4. PROMINENT 20 SKIN CONDITIONS ENCYCLOPEDIA CARD */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-200 dark:border-slate-800 shadow-xs space-y-3 text-right">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                دانشنامه تخصصی ۲۰ عارضه پوستی
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                راهکار، علائم، ترکیبات مفید و مضر آکنه، رزاسه، لک، منافذ و دهیدراتاسیون
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenSection('conditions')}
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 active:scale-95 transition-all shadow-xs"
          >
            مشاهده ۲۰ عارضه
          </button>
        </div>

        {/* Quick sample chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {['آکنه و جوش', 'رزاسه و قرمزی', 'لک و ملاسما', 'منافذ باز', 'کم‌آبی پوست', 'چروک و پیری'].map((condName, idx) => (
            <span
              key={idx}
              onClick={() => onOpenSection('conditions')}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-amber-100 dark:border-slate-700 hover:border-amber-400 cursor-pointer"
            >
              • {condName}
            </span>
          ))}
        </div>
      </div>

      {/* Recommended & Avoid Ingredients Pill Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-3">
        <h4 className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center justify-between">
          <span>ترکیبات پیشنهادی و ممنوعه امروز</span>
          <button
            onClick={() => onOpenSection('lab')}
            className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-0.5"
          >
            جستجو در آزمایشگاه
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </h4>

        <div className="space-y-2 text-right">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">✓ ترکیباتی که امروز پوست شما دوست دارد:</span>
            <div className="flex flex-wrap gap-1.5">
              {recommendations.recommendedIngredientsFa.map((ing, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/70 dark:border-emerald-800/60"
                >
                  {ing}
                </span>
              ))}
            </div>
          </div>

          {recommendations.avoidIngredientsFa.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-1">✕ ترکیبات بهتر است پرهیز شوند:</span>
              <div className="flex flex-wrap gap-1.5">
                {recommendations.avoidIngredientsFa.map((ing, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200/70 dark:border-rose-800/60"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Water & Sleep Daily Trackers */}
      <div className="grid grid-cols-2 gap-3">
        {/* Water Tracker Card */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <Droplet className="w-5 h-5 fill-sky-500" />
              </span>
              <span className="text-[11px] font-extrabold text-sky-700 dark:text-sky-300">
                {toPersianDigits(todayLog.waterGlasses || 0)} / {toPersianDigits(userState.lifestyle.waterTargetGlasses)} لیوان
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">میزان مصرف آب</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">آب‌رسانی داخلی سلول‌ها</p>
          </div>

          <button
            onClick={handleAddWater}
            className="mt-3 w-full py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/60 text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            افزایش ۱ لیوان
          </button>
        </div>

        {/* Sleep Tracker Card */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Moon className="w-5 h-5 fill-purple-500" />
              </span>
              <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300">
                {toPersianDigits(todayLog.sleepHours || 7)} ساعت
              </span>
            </div>
            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">خواب و استراحت</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">بازسازی کلاژن شبانه</p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-1">
            {[6, 7, 8].map((hrs) => (
              <button
                key={hrs}
                onClick={() => handleSetSleep(hrs)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  todayLog.sleepHours === hrs
                    ? 'bg-purple-500 text-white border-purple-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {toPersianDigits(hrs)} س
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Grid */}
      <div className="space-y-2">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-white px-1">اقدامات سریع و دانشنامه‌ها</h3>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          <button
            onClick={() => onOpenSection('conditions')}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 hover:border-amber-400 text-slate-800 dark:text-white shadow-xs active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-amber-900 dark:text-amber-200">۲۰ عارضه</span>
          </button>

          <button
            onClick={() => onOpenSection('masks')}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-slate-800 hover:border-rose-400 text-slate-800 dark:text-white shadow-xs active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-rose-900 dark:text-rose-200">۱۰ ماسک</span>
          </button>

          <button
            onClick={() => onOpenSection('lab')}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-slate-800 hover:border-sky-400 text-slate-800 dark:text-white shadow-xs active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-300 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-sky-900 dark:text-sky-200">تداخل‌سنج</span>
          </button>

          <button
            onClick={() => onOpenSection('cycle')}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-slate-800 hover:border-purple-400 text-slate-800 dark:text-white shadow-xs active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-purple-900 dark:text-purple-200">چرخه PMS</span>
          </button>

          <button
            onClick={() => onOpenSection('photo')}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-slate-800 hover:border-emerald-400 text-slate-800 dark:text-white shadow-xs active:scale-95 transition-all flex flex-col items-center justify-center gap-1"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-extrabold text-emerald-900 dark:text-emerald-200">عکس پوست</span>
          </button>
        </div>
      </div>
    </div>
  );
};
