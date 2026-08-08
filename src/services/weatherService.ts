import { WeatherData } from '../types';

const CACHE_KEY = 'roza_weather_cache_v1';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherSnapshot extends WeatherData {
  latitude?: number;
  longitude?: number;
  weatherCode?: number;
  updatedAt?: string;
  isStale?: boolean;
}

export const EMPTY_WEATHER: WeatherSnapshot = {
  city: '', temp: 0, conditionFa: 'اطلاعات آب‌وهوا در دسترس نیست', humidity: 0,
  uvIndex: 0, recommendationFa: 'برای دریافت آب‌وهوای تازه، اتصال اینترنت را روشن کنید.',
  updatedAt: '', isStale: false,
};

function conditionFromCode(code = -1, isNight = false): string {
  if (code === 0) return isNight ? 'آسمان صاف شب' : 'آفتابی';
  if ([1, 2].includes(code)) return 'کمی ابری';
  if (code === 3) return 'ابری';
  if ([45, 48].includes(code)) return 'مه‌آلود';
  if ([51, 53, 55, 56, 57].includes(code)) return 'نم‌نم باران';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'بارانی';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'برفی';
  if ([95, 96, 99].includes(code)) return 'رعدوبرق';
  return 'وضعیت نامشخص';
}

function makeRecommendation(temp: number, humidity: number, uv: number, code: number, skinType?: string): string {
  if (uv >= 6) return 'تابش آفتاب بالاست؛ ضدآفتاب را فراموش نکنید و در صورت حضور بیرون آن را تجدید کنید.';
  if (humidity < 35 || skinType === 'dry') return 'رطوبت هوا پایین است؛ مرطوب‌کننده را روی پوست کمی نم‌دار استفاده کنید.';
  if (code >= 51 && code <= 82) return 'امروز هوا مرطوب یا بارانی است؛ پوست را بعد از بازگشت به‌آرامی پاکسازی و مرطوب کنید.';
  if (temp >= 32) return 'هوا گرم است؛ در ساعات تابش شدید، سایه و ضدآفتاب را جدی بگیرید.';
  return 'امروز یک روتین ملایم و مرطوب‌کننده برای پوست کافی است.';
}

function readCache(): WeatherSnapshot | null {
  try { const raw = localStorage.getItem(CACHE_KEY); return raw ? { ...JSON.parse(raw), isStale: true } : null; } catch { return null; }
}
function writeCache(value: WeatherSnapshot) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch { /* storage is optional */ } }

export async function fetchWeather(city: string, skinType?: string): Promise<WeatherSnapshot> {
  const fallback = readCache();
  if (!city.trim()) return fallback || EMPTY_WEATHER;
  try {
    const geoResponse = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=fa&format=json`);
    if (!geoResponse.ok) throw new Error('geocoding_failed');
    const geo = await geoResponse.json();
    const place = geo.results?.[0];
    if (!place) return fallback || { ...EMPTY_WEATHER, city, recommendationFa: 'شهر پیدا نشد؛ نام شهر را بررسی کنید.' };
    const query = new URLSearchParams({ latitude: String(place.latitude), longitude: String(place.longitude), current: 'temperature_2m,relative_humidity_2m,weather_code,is_day', daily: 'uv_index_max,precipitation_probability_max', timezone: 'auto' });
    const response = await fetch(`${FORECAST_URL}?${query}`);
    if (!response.ok) throw new Error('forecast_failed');
    const json = await response.json();
    const current = json.current || {};
    const uv = Number(json.daily?.uv_index_max?.[0] || 0);
    const snapshot: WeatherSnapshot = {
      city: place.name || city, temp: Math.round(Number(current.temperature_2m || 0)),
      conditionFa: conditionFromCode(Number(current.weather_code), Number(current.is_day) === 0),
      humidity: Math.round(Number(current.relative_humidity_2m || 0)), uvIndex: Math.round(uv * 10) / 10,
      weatherCode: Number(current.weather_code), recommendationFa: makeRecommendation(Number(current.temperature_2m || 0), Number(current.relative_humidity_2m || 0), uv, Number(current.weather_code), skinType),
      updatedAt: new Date().toISOString(), latitude: place.latitude, longitude: place.longitude, isStale: false,
    };
    writeCache(snapshot); return snapshot;
  } catch { return fallback || { ...EMPTY_WEATHER, city, isStale: false }; }
}
