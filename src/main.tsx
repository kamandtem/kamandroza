import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { flushStore, hydrateStore } from './services/storage/persistence';
import { runMigrations } from './services/db';
import { flushTelemetry } from './services/telemetry';
import './index.css';

/**
 * بوت اپ.
 *
 * داده قبل از رندر React از IndexedDB خوانده می‌شود تا بقیه کد بتواند
 * همگام (sync) بخواند. به این ترتیب لازم نشد ۲۰ کامپوننت async شوند.
 */
async function bootstrap() {
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
