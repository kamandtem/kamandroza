import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Check, 
  Clock, 
  Plus, 
  Sparkles, 
  ChevronLeft, 
  Play, 
  RotateCcw, 
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { RoutineStep, Product, UserState, DailyTrackerEntry, WeatherData } from '../../types';
import { generateDailyRecommendations, GeneratedRecommendations } from '../../services/recommendationEngine';
import { toPersianDigits } from '../../services/jalali';

interface RoutineViewProps {
  userState?: UserState;
  todayLog?: DailyTrackerEntry;
  weather?: WeatherData;
  recommendations?: GeneratedRecommendations;
  ownedProducts: Product[];
  onCompleteStep: (stepId: string, type: 'morning' | 'night') => void;
  onAddStep?: (step: RoutineStep, type: 'morning' | 'night') => void;
}

export const RoutineView: React.FC<RoutineViewProps> = ({
  userState,
  todayLog,
  weather,
  recommendations: passedRecommendations,
  ownedProducts,
  onCompleteStep,
}) => {
  const [activeTab, setActiveTab] = useState<'morning' | 'night'>('morning');
  const [activeTimerStep, setActiveTimerStep] = useState<RoutineStep | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Compute recommendations fallback
  const recs = passedRecommendations || (userState && weather ? generateDailyRecommendations(userState.profile, userState.lifestyle, userState.cycleConfig.lastPeriodDate, userState.cycleConfig.cycleLength, userState.cycleConfig.periodLength, weather, ownedProducts) : null);

  const defaultMorning: RoutineStep[] = recs?.morningRoutine || [
    {
      id: 'm1',
      titleFa: 'شوینده ملایم آبرسان',
      category: 'cleanser',
      timeSeconds: 60,
      instructionsFa: 'ماساژ ملایم روی پوست مرطوب به مدت ۶۰ ثانیه و آبکشی با آب ولرم.',
      completed: true,
      reasonFa: 'پاکسازی چربی‌های تجمع یافته در طول شب بدون آسیب به سد دفاعی',
    },
    {
      id: 'm2',
      titleFa: 'سرم هیالورونیک اسید یا نیاسینامید',
      category: 'serum',
      timeSeconds: 30,
      instructionsFa: '۲-۳ قطره روی پوست کمی نم‌دار زده و به آرامی ضربه بزنید تا جذب شود.',
      completed: true,
      reasonFa: 'آبرسانی عمیق و کنترل ترشح سبوم',
    },
    {
      id: 'm3',
      titleFa: 'کرم ضدآفتاب SPF30+ (شارژ ۲ بند انگشت)',
      category: 'sunscreen',
      timeSeconds: 30,
      instructionsFa: '۲ بند انگشت کامل روی صورت و گردن پخش کنید.',
      completed: false,
      reasonFa: 'محافظت اصلی در برابر اشعه UVA/UVB خورشید و جلوگیری از چروک',
    },
  ];

  const defaultNight: RoutineStep[] = recs?.nightRoutine || [
    {
      id: 'n1',
      titleFa: 'پاک‌کننده اول (میسلار واتر یا روغن پاک‌کننده)',
      category: 'cleanser',
      timeSeconds: 60,
      instructionsFa: 'حل کردن ضدآفتاب و آلودگی‌های هوا با میسلار روی پد پنبه‌ای.',
      completed: true,
      reasonFa: 'پاکسازی عمیق منافذ از مواد ضدآفتاب',
    },
    {
      id: 'n2',
      titleFa: 'ژل شوینده سالیسیلیک اسید یا التیام‌بخش',
      category: 'cleanser',
      timeSeconds: 60,
      instructionsFa: 'شستشوی دوم با شوینده ژلی.',
      completed: false,
      reasonFa: 'کنترل چربی و پیشگیری از جوش‌های هورمونی شبانه',
    },
    {
      id: 'n3',
      titleFa: 'کرم ترمیم‌کننده و شب (سرامید و پانتنول)',
      category: 'moisturizer',
      timeSeconds: 30,
      instructionsFa: 'ماساژ کرم مرطوب‌کننده روی کل صورت.',
      completed: false,
      reasonFa: 'قفل کردن رطوبت سلولی و ترمیم سد دفاعی در خواب',
    },
  ];

  const [morningSteps, setMorningSteps] = useState<RoutineStep[]>(defaultMorning);
  const [nightSteps, setNightSteps] = useState<RoutineStep[]>(defaultNight);

  const currentSteps = activeTab === 'morning' ? morningSteps : nightSteps;
  const completedCount = currentSteps.filter((s) => s.completed).length;
  const progressPercent = currentSteps.length > 0 ? Math.round((completedCount / currentSteps.length) * 100) : 0;

  const handleToggleStep = (stepId: string) => {
    const updater = (steps: RoutineStep[]) => {
      return steps.map((st) => {
        if (st.id === stepId) {
          const nextState = !st.completed;
          return { ...st, completed: nextState };
        }
        return st;
      });
    };

    if (activeTab === 'morning') {
      const next = updater(morningSteps);
      setMorningSteps(next);
      if (next.every((s) => s.completed)) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    } else {
      const next = updater(nightSteps);
      setNightSteps(next);
      if (next.every((s) => s.completed)) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    }

    onCompleteStep(stepId, activeTab);
  };

  const startStepTimer = (step: RoutineStep) => {
    setActiveTimerStep(step);
    setTimerSecondsLeft(step.timeSeconds || 60);
    setIsTimerRunning(true);
  };

  React.useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSecondsLeft]);

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto space-y-4 font-['Vazirmatn',sans-serif] text-slate-800 dark:text-white">
      {/* Morning / Night Switcher Tabs */}
      <div className="p-1.5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs flex items-center gap-1">
        <button
          onClick={() => setActiveTab('morning')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'morning'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>روتین صبح ({toPersianDigits(morningSteps.length)} گام)</span>
        </button>

        <button
          onClick={() => setActiveTab('night')}
          className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'night'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800'
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>روتین شب ({toPersianDigits(nightSteps.length)} گام)</span>
        </button>
      </div>

      {/* Progress Tracker Banner */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-2 text-right">
        <div className="flex items-center justify-between text-xs font-extrabold">
          <span className="text-slate-800 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            پیشرفت روتین {activeTab === 'morning' ? 'صبح' : 'شب'}
          </span>
          <span className="text-rose-600 dark:text-rose-400 font-black">
            {toPersianDigits(completedCount)} از {toPersianDigits(currentSteps.length)} (
            {toPersianDigits(progressPercent)}٪)
          </span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6 }}
            className={`h-full rounded-full ${
              activeTab === 'morning'
                ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                : 'bg-gradient-to-r from-purple-500 to-rose-500'
            }`}
          />
        </div>
      </div>

      {/* Routine Steps List */}
      <div className="space-y-3">
        {currentSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-3xl border transition-all text-right ${
              step.completed
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 opacity-90'
                : 'bg-white dark:bg-slate-900 border-rose-100 dark:border-slate-800 shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Checkbox circle */}
              <button
                onClick={() => handleToggleStep(step.id)}
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                  step.completed
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700 hover:border-rose-400'
                }`}
              >
                {step.completed && <Check className="w-4 h-4 stroke-[3]" />}
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-extrabold text-sm ${
                      step.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-white'
                    }`}
                  >
                    گام {toPersianDigits(index + 1)}: {step.titleFa}
                  </h3>
                  {step.timeSeconds && (
                    <button
                      onClick={() => startStepTimer(step)}
                      className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{toPersianDigits(step.timeSeconds)} ثانیه</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.instructionsFa}
                </p>

                {step.reasonFa && (
                  <div className="p-2.5 rounded-2xl bg-rose-50/70 dark:bg-slate-800/60 text-[11px] text-rose-800 dark:text-rose-300 font-medium border border-rose-100 dark:border-slate-700/60 mt-2">
                    <span className="font-extrabold">چرا این گام؟ </span>
                    {step.reasonFa}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Step Timer Modal */}
      <AnimatePresence>
        {activeTimerStep && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-rose-100 dark:border-slate-800 text-center space-y-4"
            >
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
                تایمر: {activeTimerStep.titleFa}
              </h3>

              <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {toPersianDigits(timerSecondsLeft)}
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className="px-4 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                >
                  <Play className="w-4 h-4" />
                  {isTimerRunning ? 'توقف موقت' : 'ادامه تایمر'}
                </button>
                <button
                  onClick={() => setActiveTimerStep(null)}
                  className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
