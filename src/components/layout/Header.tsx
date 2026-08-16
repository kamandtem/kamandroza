import React from 'react';
import { Bell, Menu, Moon, Sun, CloudOff } from 'lucide-react';
import { UserState, WeatherData } from '../../types';
import { getTodayPersianHeader, toPersianDigits } from '../../services/jalali';
import { routineAdherence } from '../../services/statsService';

interface HeaderProps {
  userState: UserState;
  weather: WeatherData;
  onOpenDrawer: () => void;
  onToggleTheme: () => void;
}

/** هدر با الگوی مرجع: نوار سفید، گوشه‌های نرم، لوگوی مرکزی و دکمه‌های ساده. */
export const Header: React.FC<HeaderProps> = ({ userState, weather, onOpenDrawer, onToggleTheme }) => {
  const adherence = routineAdherence(7);
  const isDark = userState.themeMode === 'dark';

  return (
    <header className="sticky top-0 z-30 w-full px-4 pt-3 pb-2 bg-[#f8fafc] dark:bg-slate-950">
      <div className="max-w-lg mx-auto h-[76px] rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-[0_10px_30px_rgba(39,55,82,0.08)] flex items-center justify-between gap-3 px-4">
        <button
          onClick={onOpenDrawer}
          aria-label="منوی اصلی"
          className="icon-only p-3 rounded-2xl bg-[#fffaf2] dark:bg-slate-800 text-[#23334b] dark:text-slate-200 border border-[#f2e4d0] dark:border-slate-700 active:scale-95 transition-transform"
        >
          <Menu className="w-6 h-6" strokeWidth={2.4} />
        </button>

        <div className="flex-1 text-center min-w-0">
          <h1 className="text-2xl font-black text-[#17263b] dark:text-white truncate tracking-tight">رزا</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{getTodayPersianHeader()}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            aria-label="اعلان‌ها"
            className="icon-only p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-[#23334b] dark:text-slate-200 border border-slate-100 dark:border-slate-700 relative"
          >
            <Bell className="w-5 h-5" strokeWidth={2.2} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>
          <button
            onClick={onToggleTheme}
            aria-label={isDark ? 'تم روشن' : 'تم تاریک'}
            className="icon-only p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {(adherence.percent !== null || weather.hasData) && (
        <div className="max-w-lg mx-auto flex justify-center gap-2 pt-1.5">
          {adherence.percent !== null && <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">مداومت {toPersianDigits(adherence.percent)}٪</span>}
          {weather.hasData && <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{toPersianDigits(weather.temp)}°</span>}
        </div>
      )}
    </header>
  );
};
