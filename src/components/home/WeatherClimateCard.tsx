import React from 'react';
import { Sun, Droplets, Wind, CloudSun } from 'lucide-react';
import { WeatherData } from '../../types';
import { toPersianDigits } from '../../services/jalali';

interface WeatherClimateCardProps {
  weather: WeatherData;
}

/**
 * کارت آب‌وهوا.
 *
 * مشکل نسخه ۱: در حالت آفلاین صفر نشان می‌داد و پیام «اینترنت را
 * روشن کنید» روی صفحه اول می‌ماند. الان اگر داده نیست، کارت کاملاً
 * مخفی می‌ماند. قابلیت اختیاری نباید شبیه نقص دائمی باشد.
 */
export const WeatherClimateCard: React.FC<WeatherClimateCardProps> = ({ weather }) => {
  if (!weather.hasData) return null;

  const highUv = weather.uvIndex >= 6;

  return (
    <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
            <CloudSun className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-black text-sm text-slate-800 dark:text-white truncate">
              {weather.city} · {toPersianDigits(weather.temp)} درجه
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {weather.conditionFa}
              {weather.isStale ? ' · داده قدیمی' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div
          className={`p-3 rounded-2xl border ${
            highUv
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
        >
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Sun className="w-4 h-4" />
            فرابنفش
          </span>
          <span
            className={`text-base font-black ${
              highUv ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-white'
            }`}
          >
            {toPersianDigits(weather.uvIndex)}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Droplets className="w-4 h-4" />
            رطوبت
          </span>
          <span className="text-base font-black text-slate-800 dark:text-white">
            {toPersianDigits(weather.humidity)}٪
          </span>
        </div>
      </div>

      {weather.recommendationFa && (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
          <Wind className="w-4 h-4 text-rose-500 shrink-0 mt-1" />
          <span>{weather.recommendationFa}</span>
        </p>
      )}
    </div>
  );
};
