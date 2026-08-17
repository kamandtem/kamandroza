import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { DailyTrackerEntry, Product, UserState } from './types';
import { LocalDB } from './services/db';
import { getTodayIsoDate } from './services/jalali';
import { EMPTY_WEATHER, WeatherSnapshot, fetchWeather, requestWeatherLocation } from './services/weatherService';
import { scheduleRozaNotifications } from './services/notificationService';
import { isLockConfigured } from './services/security/appLock';
import { computeStreak } from './services/routineService';
import { isFeatureEnabled } from './config/appConfig';

import { Header } from './components/layout/Header';
import { BottomNavigation, NavTab } from './components/layout/BottomNavigation';
import { DrawerMenu } from './components/layout/DrawerMenu';
import { LockScreen } from './components/common/LockScreen';
import { FeatureTourOverlay, TourKey } from './components/common/FeatureTourOverlay';
import { IntroSlides } from './components/onboarding/IntroSlides';

import { HomeDashboard } from './components/home/HomeDashboard';
import { RoutineView } from './components/routine/RoutineView';
import { KnowledgeCenter } from './components/knowledge/KnowledgeCenter';
import { SkinLab } from './components/lab/SkinLab';
import { ProductShelf } from './components/products/ProductShelf';
import { ProgressTracker } from './components/progress/ProgressTracker';
import { ProfileView } from './components/profile/ProfileView';
import { CycleDashboard } from './components/cycle/CycleDashboard';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { FaceMasksView } from './components/masks/FaceMasksView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { MakeupTipsView } from './components/makeup/MakeupTipsView';
import { DayPlanFab } from './components/routine/DayPlanFab';
import { PersonalRoutineView } from './components/routine/PersonalRoutineView';
import { SplashScreen } from './components/common/SplashScreen';

export type SectionKey =
  | 'profile'
  | 'cycle'
  | 'lab'
  | 'conditions'
  | 'products'
  | 'photo'
  | 'masks'
  | 'salon'
  | 'clinic'
  | 'makeup'
  | 'personalRoutine'
  | 'knowledge';

const SECTION_TITLES: Record<SectionKey, string> = {
  profile: 'پروفایل و تنطیمات',
  cycle: 'چرخه ماهانه من',
  lab: 'ترکیبات و تداخل‌سنج',
  conditions: 'دانشنامه عوارض پوستی',
  products: 'قفسه محصولات من',
  photo: 'عکس‌ها و پیشرفت پوست',
  masks: 'ماسک‌های پوستی',
  salon: 'آرایشگاه و نوبت‌های من',
  clinic: 'پزشک و پرونده پوست',
  makeup: 'ترفندهای آرایش',
  personalRoutine: 'روتین پوستی من',
  knowledge: 'مقالات کوتاه',
};

/**
 * فقط این بخش‌ها راهنمای اولین‌بار (تور) دارند؛ بقیه‌ی SectionKey ها
 * (پروفایل/تنطیمات، ترکیبات، عکس‌ها، ماسک‌ها، روتین شخصی) تور ندارند.
 *
 * باگ نسخه قبل: هر SectionKey بدون بررسی به TourKey تبدیل می‌شد
 * (`section as TourKey`). چون TourKey فقط ۹ مقدار دارد ولی SectionKey
 * بیشتر است، باز کردن «تنظیمات» (یا لب/عکس/ماسک/روتین شخصی) برای اولین
 * بار باعث می‌شد FeatureTourOverlay با یک tourKey نامعتبر رندر شود و
 * بلافاصله خطا بدهد — همان صفحه‌ی «متاسفم رزا مشکلی پیدا کرد».
 */
const TOUR_SECTIONS = new Set<string>(['products', 'salon', 'clinic', 'knowledge', 'makeup']);
function sectionTourKey(section: SectionKey): TourKey | null {
  return TOUR_SECTIONS.has(section) ? (section as unknown as TourKey) : null;
}

function createEmptyLog(dateIso: string): DailyTrackerEntry {
  return {
    id: `log_${dateIso}`,
    date: dateIso,
    waterGlasses: 0,
    sleepHours: 0,
    stressLevel: 0,
    exerciseMinutes: 0,
    usedSunscreen: false,
    junkFood: false,
    sugarIntake: 'moderate',
    skinStatusScore: 0,
    mood: '',
    rednessScore: 0,
    drynessScore: 0,
    acneScore: 0,
    oilinessScore: 0,
    updatedAt: new Date().toISOString(),
  };
}

export default function App() {
  const [userState, setUserState] = useState<UserState>(() => LocalDB.getUserState());
  const [products, setProducts] = useState<Product[]>(() => LocalDB.getProducts());
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const lastBackAt = React.useRef(0);
  const [showSplash, setShowSplash] = useState(true);
  const [showIntro, setShowIntro] = useState(() => localStorage.getItem('roza_intro_seen_v4') !== '1');
  const [tourKey, setTourKey] = useState<TourKey | null>(() => {
    if (localStorage.getItem('roza_intro_seen_v4') !== '1') return null;
    return localStorage.getItem('roza_tour_home_v1') === '1' ? null : 'home';
  });

  const lockRequired = isFeatureEnabled('appLock') && userState.privacy.lockEnabled && isLockConfigured();
  const [isUnlocked, setIsUnlocked] = useState(!lockRequired);

  const todayIso = getTodayIsoDate();
  const [todayLog, setTodayLog] = useState<DailyTrackerEntry>(
    () => LocalDB.getDailyLog(todayIso) || createEmptyLog(todayIso),
  );
  const [weather, setWeather] = useState<WeatherSnapshot>(EMPTY_WEATHER);
  const [weatherLocationStatus, setWeatherLocationStatus] = useState<'idle' | 'loading' | 'denied'>('idle');
  const requestWeatherGps = async () => { setWeatherLocationStatus('loading'); try { const coords = await requestWeatherLocation(); const value = await fetchWeather(userState.profile.city, userState.profile.skinType, coords); setWeather(value); setWeatherLocationStatus('idle'); } catch { setWeatherLocationStatus('denied'); } };

  /* --------------------------- تم --------------------------- */
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const isDark = userState.themeMode === 'dark' || (userState.themeMode === 'system' && prefersDark);
    root.classList.toggle('dark', Boolean(isDark));
  }, [userState.themeMode]);

  /* --------------------------- آب‌وهوا --------------------------- */
  useEffect(() => {
    let alive = true;
    const rawCoords = localStorage.getItem('roza_weather_coords_v1');
    const coords = rawCoords ? (() => { try { return JSON.parse(rawCoords) as { latitude: number; longitude: number }; } catch { return undefined; } })() : undefined;
    if (!userState.profile.city && !coords) return;
    void fetchWeather(userState.profile.city, userState.profile.skinType, coords).then((value) => {
      if (alive) setWeather(value);
    });
    return () => { alive = false; };
  }, [userState.profile.city, userState.profile.skinType]);

  /* ----------------------- زنجیره روزهای متوالی ----------------------- */
  // محاسبه واقعی، یک‌بار در هر بوت. در نسخه ۱ این عدد max(streak, 1) بود.
  useEffect(() => {
    if (!userState.onboardingCompleted) return;
    const streak = computeStreak(todayIso);
    if (streak.current === userState.currentStreakDays && streak.best === userState.bestStreakDays) return;
    const updated = { ...userState, currentStreakDays: streak.current, bestStreakDays: streak.best };
    setUserState(updated);
    LocalDB.saveUserState(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userState.onboardingCompleted, todayIso]);

  /* --------------------------- اعلان‌ها --------------------------- */
  useEffect(() => {
    if (!userState.onboardingCompleted) return;
    void scheduleRozaNotifications(userState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userState.onboardingCompleted,
    userState.cycleConfig.enabled,
    userState.cycleConfig.pmsStartDaysBefore,
    userState.notifications,
    userState.privacy.hideCycleSection,
  ]);

  /* --------------------- دکمه برگشت اندروید --------------------- */
  // مشکل نسخه ۱: پلاگین نصب بود ولی استفاده نمی‌شد؛ کاربر برای بستن
  // یک صفحه، کل اپ را می‌بست.
  const handleBack = useCallback((): boolean => {
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      return true;
    }
    if (activeSection) {
      setActiveSection(null);
      return true;
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
      return true;
    }
    const now = Date.now();
    if (now - lastBackAt.current < 1800) {
      setShowExitConfirm(true);
      lastBackAt.current = 0;
    } else {
      lastBackAt.current = now;
    }
    return true;
  }, [isDrawerOpen, activeSection, activeTab]);

  useEffect(() => {
    let remove: (() => void) | undefined;
    void CapacitorApp.addListener('backButton', () => {
      const handled = handleBack();
      if (!handled) void CapacitorApp.exitApp();
    })
      .then((listener) => {
        remove = () => void listener.remove();
      })
      .catch(() => undefined);

    return () => remove?.();
  }, [handleBack]);

  /* --------------------------- هندلرها --------------------------- */
  const handleUpdateTodayLog = (log: DailyTrackerEntry) => {
    setTodayLog(log);
    LocalDB.saveDailyLog(log);
  };

  const handleUpdateUserState = (state: UserState) => {
    setUserState(state);
    LocalDB.saveUserState(state);
  };

  const handleUpdateProducts = (next: Product[]) => {
    setProducts(next);
    LocalDB.saveProducts(next);
  };

  const handleToggleTheme = () => {
    handleUpdateUserState({ ...userState, themeMode: userState.themeMode === 'dark' ? 'light' : 'dark' });
  };

  /** چرخه فقط وقتی دیده می‌شود که خود کاربر فعالش کرده باشد. */
  const cycleVisible = userState.cycleConfig.enabled && !userState.privacy.hideCycleSection;

  const sectionTitle = useMemo(() => (activeSection ? SECTION_TITLES[activeSection] : ''), [activeSection]);

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />;

  if (showIntro) {
    return <IntroSlides onDone={() => { setShowIntro(false); setTourKey(null); }} />;
  }

  if (!userState.onboardingCompleted) {
    return <OnboardingFlow onComplete={(state) => { setUserState(state); setTourKey('home'); }} />;
  }

  if (lockRequired && !isUnlocked) {
    return <LockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  const renderSection = () => {
    if (!activeSection) return null;

    return (
      <div className="fixed inset-0 z-40 bg-[#faf8f5] dark:bg-slate-950 overflow-y-auto pb-28 pt-3">
        <div className="max-w-lg mx-auto px-4 mb-3 flex items-center justify-between gap-3 border-b border-rose-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-white">{sectionTitle}</h2>
          <button
            onClick={() => setActiveSection(null)}
            className="px-4 py-2 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold shrink-0"
          >
            بازگشت
          </button>
        </div>

        {activeSection === 'profile' && (
          <ProfileView userState={userState} onUpdateState={handleUpdateUserState} />
        )}
        {activeSection === 'cycle' && (
          <CycleDashboard
            userState={userState}
            onUpdateCycleConfig={(config) => handleUpdateUserState({ ...userState, cycleConfig: config })}
          />
        )}
        {activeSection === 'lab' && <SkinLab initialTab="ingredients" userState={userState} products={products} />}
        {activeSection === 'conditions' && (
          <SkinLab initialTab="conditions" userState={userState} products={products} />
        )}
        {activeSection === 'products' && (
          <ProductShelf products={products} onUpdateProducts={handleUpdateProducts} userState={userState} />
        )}
        {activeSection === 'photo' && <ProgressTracker initialTab="photos" />}
        {activeSection === 'masks' && <FaceMasksView onClose={() => setActiveSection(null)} />}
        {activeSection === 'salon' && <AppointmentsView kind="salon" userState={userState} />}
        {activeSection === 'clinic' && <AppointmentsView kind="clinic" userState={userState} />}
        {activeSection === 'makeup' && <MakeupTipsView />}
        {activeSection === 'personalRoutine' && <PersonalRoutineView />}
        {activeSection === 'knowledge' && <KnowledgeCenter />}
      </div>
    );
  };

  if (showExitConfirm) {
    return <div className="fixed inset-0 z-[90] bg-[#20334d]/45 flex items-center justify-center p-5"><div className="w-full max-w-sm rounded-[2rem] bg-[#fffdf9] dark:bg-slate-900 p-5 text-center shadow-2xl space-y-4"><h2 className="text-base font-black text-[#263b56] dark:text-white">از برنامه خارج می‌شوی؟</h2><p className="text-sm leading-7 text-slate-500 dark:text-slate-400">برای بستن برنامه، تأیید کن.</p><div className="flex gap-2"><button onClick={() => setShowExitConfirm(false)} className="flex-1 rounded-2xl bg-slate-100 dark:bg-slate-800 py-3 text-sm font-bold">انصراف</button><button onClick={() => void CapacitorApp.exitApp()} className="flex-1 rounded-2xl bg-rose-500 py-3 text-sm font-bold text-white">خروج</button></div></div></div>;
  }

  return (
    <div className="min-h-screen pt-[92px] bg-[#faf8f5] dark:bg-slate-950 text-slate-800 dark:text-white relative transition-colors duration-300">
      <Header
        userState={userState}
        weather={weather}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onToggleTheme={handleToggleTheme}
        onNavigateTab={(tab) => { setActiveTab(tab); setActiveSection(null); }}
        onOpenSection={(section) => { setActiveSection(section); setIsDrawerOpen(false); }}
      />

      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        userState={userState}
        cycleVisible={cycleVisible}
        onNavigateTab={(tab) => {
          setActiveSection(null);
          setActiveTab(tab);
          const key = tab as TourKey;
          setTourKey(localStorage.getItem(`roza_tour_${key}_v1`) === '1' ? null : key);
        }}
        onOpenSection={(section) => {
          setActiveSection(section);
          const key = sectionTourKey(section);
          setTourKey(!key || localStorage.getItem(`roza_tour_${key}_v1`) === '1' ? null : key);
        }}
        onToggleTheme={handleToggleTheme}
      />

      {renderSection()}

      {!activeSection && (
        <main className="w-full">
          {activeTab === 'home' && (
            <HomeDashboard
              userState={userState}
              products={products}
              todayLog={todayLog}
              weather={weather}
              onRequestWeatherLocation={requestWeatherGps}
              weatherLocationLoading={weatherLocationStatus === 'loading'}
              weatherLocationError={weatherLocationStatus === 'denied'}
              cycleVisible={cycleVisible}
              onUpdateDailyLog={handleUpdateTodayLog}
              onNavigateTab={(tab) => { setActiveTab(tab); const key = tab as TourKey; setTourKey(localStorage.getItem(`roza_tour_${key}_v1`) === '1' ? null : key); }}
              onOpenSection={(section) => {
                setActiveSection(section);
                const key = sectionTourKey(section);
                setTourKey(!key || localStorage.getItem(`roza_tour_${key}_v1`) === '1' ? null : key);
              }}
            />
          )}

          {activeTab === 'routine' && (
            <RoutineView userState={userState} weather={weather} products={products} />
          )}

          {activeTab === 'cycle' && <CycleDashboard userState={userState} onUpdateCycleConfig={(config) => handleUpdateUserState({ ...userState, cycleConfig: config })} />}

          {activeTab === 'progress' && <ProgressTracker initialTab="photos" />}
        </main>
      )}

      <BottomNavigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveSection(null);
          setActiveTab(tab);
          const key = tab as TourKey;
          setTourKey(localStorage.getItem(`roza_tour_${key}_v1`) === '1' ? null : key);
        }}
      />
      {tourKey && <FeatureTourOverlay tourKey={tourKey} onDone={() => setTourKey(null)} />}
      <DayPlanFab onOpen={() => setActiveSection('personalRoutine')} />
    </div>
  );
}
