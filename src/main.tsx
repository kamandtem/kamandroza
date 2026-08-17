import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { flushStore, hydrateStore } from './services/storage/persistence';
import { runMigrations } from './services/db';
import { flushTelemetry } from './services/telemetry';
import './index.css';

/**
 * تنظیم نوار وضعیت (ساعت/آنتن بالای گوشی).
 *
 * مشکل نسخه قبل: هیچ‌جا این پلاگین صدا زده نمی‌شد، پس روی اندروید ۱۵
 * (edge-to-edge اجباری) WebView کل صفحه از جمله زیر نوار وضعیت را
 * می‌پوشاند و ساعت/آنتن دیگر دیده نمی‌شد. این تابع علاوه بر تنظیم
 * capacitor.config.ts، هنگام اجرا هم صریحاً همان رفتار را تضمین می‌کند.
 */
async function setupStatusBar() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setBackgroundColor({ color: '#faf8f5' });
    await StatusBar.setStyle({ style: Style.Light });
  } catch {
    // پلتفرم/نسخه از این متدها پشتیبانی نمی‌کند؛ بی‌خطر است، ادامه بده
  }
}

/**
 * بوت اپ.
 *
 * داده قبل از رندر React از IndexedDB خوانده می‌شود تا بقیه کد بتواند
 * همگام (sync) بخواند. به این ترتیب لازم نشد ۲۰ کامپوننت async شوند.
 */
async function bootstrap() {
  void setupStatusBar();
  await hydrateStore();
  runMigrations();

  // داده را قبل از بسته شدن اپ روی دیسک می‌نویسیم
  window.addEventListener('pagehide', () => {
    void flushStore();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushStore();
  });

  // صف رویدادهای ارجاع — تا وقتی سرور نباشد کاری نمی‌کند
  void flushTelemetry();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
}

void bootstrap();
