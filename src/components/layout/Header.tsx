import React, { useState } from 'react';
import { Menu, Bell, Sun, Moon, CheckCircle2, Droplet, Sparkles, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState, WeatherData } from '../../types';
import { toPersianDigits } from '../../services/jalali';

interface HeaderProps {
  userState: UserState;
  weather: WeatherData;
  onOpenDrawer: () => void;
  onToggleTheme?: () => void;
  routineAdherencePct?: number; // e.g., 75
  morningCompletedCount?: number;
  morningTotalCount?: number;
  nightCompletedCount?: number;
  nightTotalCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  userState,
  weather,
  onOpenDrawer,
  onToggleTheme,
  routineAdherencePct = 75,
  morningCompletedCount = 3,
  morningTotalCount = 3,
  nightCompletedCount = 1,
  nightTotalCount = 2,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const totalCompleted = morningCompletedCount + nightCompletedCount;
  const totalSteps = morningTotalCount + nightTotalCount;
  const adherencePercent = Math.round((totalCompleted / Math.max(totalSteps, 1)) * 100);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-rose-100 dark:border-slate-800 px-4 py-2.5 shadow-xs transition-all text-slate-800 dark:text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Right side: Burger Menu button ONLY */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenDrawer}
              className="p-2.5 rounded-2xl bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 active:scale-95 transition-transform border border-rose-200/60 dark:border-slate-700"
              aria-label="منوی اصلی"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Super Clean Minimal Title */}
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h1 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">
                رزا <span className="text-xs font-bold text-rose-500">| دستیار پوست</span>
              </h1>
            </div>
          </div>

          {/* Left side: Theme Switch, Notification Bell & Weather */}
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle Switch */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-300/40 dark:border-amber-500/30 active:scale-95 transition-all"
                aria-label="تغییر تم روز و شب"
                title="تغییر تم برنامه (روشن / تاریک)"
              >
                {userState.themeMode === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 text-purple-600" />
                )}
              </button>
            )}

            {/* Weather Pill */}
            <div className="hidden xs:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-xs font-bold">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{toPersianDigits(weather.temp)}°C</span>
            </div>

            {/* Notification Bell with Badge */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative p-2.5 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-300/40 dark:border-rose-500/30 active:scale-95 transition-all"
              aria-label="اعلان‌ها و میزان پایبندی"
              title="میزان پایبندی و یادآورها"
            >
              <Bell className="w-5 h-5" />
              {/* Notification Counter Dot */}
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border border-white shadow-xs">
                {toPersianDigits(2)}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Daily Routine Adherence & Notifications Modal */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-2xl border border-rose-100 dark:border-slate-800 text-right space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <Bell className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-slate-800 dark:text-white">
                    میزان پایبندی و یادآورهای امروز
                  </h3>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Routine Adherence Card & Progress Bar */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-emerald-500/10 border border-rose-200/60 dark:border-rose-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    پایبندی به روتین پوستی امروز:
                  </span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {toPersianDigits(adherencePercent)}٪
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-300/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${adherencePercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 rounded-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 font-bold text-slate-600 dark:text-slate-300">
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl text-center border border-slate-200/60 dark:border-slate-700">
                    <span>روتین صبح: </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {toPersianDigits(morningCompletedCount)} از {toPersianDigits(morningTotalCount)}
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl text-center border border-slate-200/60 dark:border-slate-700">
                    <span>روتین شب: </span>
                    <span className="text-rose-600 dark:text-rose-400">
                      {toPersianDigits(nightCompletedCount)} از {toPersianDigits(nightTotalCount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 block px-1">اعلان‌ها و توصیه‌های فعال:</span>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 flex items-start gap-2.5">
                  <Sun className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      تجدید ضدآفتاب (شاخص UV: {toPersianDigits(weather.uvIndex)})
                    </h4>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300/80 mt-0.5">
                      نور خورشید امروز قوی است. در صورت خروج از منزل، ضدآفتاب را شارژ کنید.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/40 flex items-start gap-2.5">
                  <Droplet className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-sky-900 dark:text-sky-200">
                      یادآور مصرف آب
                    </h4>
                    <p className="text-[10px] text-sky-700 dark:text-sky-300/80 mt-0.5">
                      برای حفظ رطوبت سلولی پوست، یک لیوان آب بنوشید.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowNotifications(false)}
                className="w-full py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-sm transition-all"
              >
                متوجه شدم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
