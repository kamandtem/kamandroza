import React from 'react';
import { Sun, Cloud, CloudRain, ShieldAlert, Thermometer, Droplets, Wind, Sparkles } from 'lucide-react';
import { WeatherData } from '../../types';
import { toPersianDigits } from '../../services/jalali';

interface WeatherClimateCardProps {
  weather: WeatherData;
}

export const WeatherClimateCard: React.FC<WeatherClimateCardProps> = ({ weather }) => {
  // Get matching image and icon for weather
  let bgImage = '/assets/roza-illustration.svg'; // Sunny
  let weatherIcon = <Sun className="w-5 h-5 text-amber-500" />;
  let uvColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  const uv = weather?.uvIndex ?? 4;
  if (uv >= 6) {
    uvColor = 'bg-rose-100 text-rose-800 border-rose-300';
  } else if (uv >= 3) {
    uvColor = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  const cond = weather?.conditionFa || '';
  const aqi = '';

  if (cond.includes('بارانی') || cond.includes('باران')) {
    bgImage = '/assets/roza-illustration.svg';
    weatherIcon = <CloudRain className="w-5 h-5 text-sky-500" />;
  } else if (cond.includes('ابری') || cond.includes('نیمه ابری')) {
    bgImage = '/assets/roza-illustration.svg';
    weatherIcon = <Cloud className="w-5 h-5 text-slate-500" />;
  } else if (aqi.includes('ناسالم') || cond.includes('آلودگی')) {
    bgImage = '/assets/roza-illustration.svg';
    weatherIcon = <ShieldAlert className="w-5 h-5 text-rose-500" />;
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs overflow-hidden text-right space-y-3">
      {/* Weather Photo Banner */}
      <div className="relative h-36 w-full overflow-hidden">
        <img src={bgImage} alt="وضعیت آب و هوا" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex flex-col justify-end p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                {weatherIcon}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  اقلیم و هواشناسی {weather.city || 'شهر شما'}
                </h3>
                <span className="text-[11px] font-bold text-slate-200">{weather.conditionFa}</span>
              </div>
            </div>

            <div className="text-left bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/30">
              <span className="text-xl font-black text-white block leading-none">
                {toPersianDigits(weather.temp)}°C
              </span>
              <span className="text-[9px] text-amber-200 font-bold">دما روزانه</span>
            </div>
          </div>
        </div>
      </div>

      {/* Climate Metrics */}
      <div className="px-4 pb-4 space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">شاخص UV خورشید</span>
            <span className="font-extrabold text-amber-600 dark:text-amber-400">
              {toPersianDigits(weather.uvIndex)} از ۱۰
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">رطوبت هوا</span>
            <span className="font-extrabold text-sky-600 dark:text-sky-400">
              {toPersianDigits(weather.humidity)}٪
            </span>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-rose-100 dark:border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">کیفیت هوا (AQI)</span>
            <span className="font-extrabold text-rose-600 dark:text-rose-400">
              {aqi || 'کیفیت هوا در این نسخه دریافت نمی‌شود'}
            </span>
          </div>
        </div>

        {/* Climate Protection Skincare Recommendation */}
        <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs space-y-1">
          <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            توصیه ضدآفتاب و آنتی‌اکسیدانی اقلیم امروز:
          </span>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {weather.recommendationFa}{weather.isStale && weather.updatedAt ? ` (آخرین به‌روزرسانی: ${new Date(weather.updatedAt).toLocaleString('fa-IR')})` : ''}
          </p>
        </div>
      </div>
    </div>
  );
};
