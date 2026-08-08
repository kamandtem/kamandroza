import React, { useState, useEffect } from 'react';
import { UserState, WeatherData, DailyTrackerEntry, Product } from './types';
import { LocalDB } from './services/db';
import { generateDailyRecommendations } from './services/recommendationEngine';
import { getTodayIsoDate } from './services/jalali';
import { EMPTY_WEATHER, WeatherSnapshot, fetchWeather } from './services/weatherService';
import { scheduleRozaNotifications } from './services/notificationService';

import { Header } from './components/layout/Header';
import { BottomNavigation, NavTab } from './components/layout/BottomNavigation';
import { DrawerMenu } from './components/layout/DrawerMenu';

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

export default function App() {
  const [userState, setUserState] = useState<UserState>(() => {
    const st = LocalDB.getUserState();
    // Default to cheerful light theme
    if (!st.themeMode) st.themeMode = 'light';
    return st;
  });
  const [products, setProducts] = useState<Product[]>(() => LocalDB.getProducts());
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Initialize Theme Mode (Light Bright / Dark Night / System)
  useEffect(() => {
    if (userState.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userState.themeMode]);

  // Today log state
  const todayStr = getTodayIsoDate();
  const [todayLog, setTodayLog] = useState<DailyTrackerEntry>(() => {
    const logs = LocalDB.getDailyLogs();
    const found = logs.find((l) => l.date === todayStr);
    return (
      found || {
        id: `log_${todayStr}`,
        date: todayStr,
        waterGlasses: 0,
        sleepHours: 0,
        stressLevel: 0 as 1,
        exerciseMinutes: 0,
        junkFood: false,
        sugarIntake: 'low',
        skinStatusScore: 0,
        mood: '',
        rednessScore: 0,
        drynessScore: 0,
        acneScore: 0,
        oilinessScore: 0,
      }
    );
  });

  const [weather, setWeather] = useState<WeatherSnapshot>(EMPTY_WEATHER);
  useEffect(() => {
    let alive = true;
    fetchWeather(userState.profile.city, userState.profile.skinType).then((value) => { if (alive) setWeather(value); });
    return () => { alive = false; };
  }, [userState.profile.city, userState.profile.skinType]);

  const handleUpdateTodayLog = (newLog: DailyTrackerEntry) => {
    setTodayLog(newLog);
    LocalDB.saveDailyLog(newLog);
  };

  const handleUpdateUserState = (newState: UserState) => {
    setUserState(newState);
    LocalDB.saveUserState(newState);
  };

  const handleUpdateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    LocalDB.saveProducts(newProducts);
  };

  const handleToggleTheme = () => {
    const nextTheme = userState.themeMode === 'dark' ? 'light' : 'dark';
    const updated = { ...userState, themeMode: nextTheme };
    setUserState(updated);
    LocalDB.saveUserState(updated);
  };

  // Step completion callback
  const handleCompleteRoutineStep = (stepId: string, type: 'morning' | 'night') => {
    const updatedState: UserState = {
      ...userState,
      userXp: userState.userXp + 15,
      currentStreakDays: Math.max(userState.currentStreakDays, 1),
    };
    handleUpdateUserState(updatedState);
  };

  useEffect(() => {
    if (!userState.onboardingCompleted) return;
    void scheduleRozaNotifications(userState);
  }, [userState.onboardingCompleted, userState.cycleConfig.enabled, userState.cycleConfig.lastPeriodDate, userState.cycleConfig.cycleLength, userState.cycleConfig.pmsStartDaysBefore, userState.notifications]);

  // Show onboarding wizard if not completed
  if (!userState.onboardingCompleted) {
    return <OnboardingFlow onComplete={(newState) => setUserState(newState)} />;
  }

  // Render Section overlay if selected from Drawer
  const renderDrawerSectionOverlay = () => {
    if (!activeSection) return null;

    return (
      <div className="fixed inset-0 z-40 bg-[#faf8f5]/95 dark:bg-slate-950/95 backdrop-blur-xl text-slate-800 dark:text-white overflow-y-auto pb-24 pt-16 font-['Vazirmatn',sans-serif]">
        <div className="max-w-lg mx-auto px-4 mb-4 flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
          <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
            {activeSection === 'profile' && 'پروفایل کاربر و تنظیمات برنامه'}
            {activeSection === 'cycle' && 'هوشمندی چرخه هورمونی و PMS'}
            {activeSection === 'lab' && 'آزمایشگاه پوست و تداخل ترکیبات'}
            {activeSection === 'products' && 'کیف محصولات پوستی من'}
            {activeSection === 'photo' && 'گالری و تایم‌لاین پیشرفت پوست'}
            {activeSection === 'masks' && '۱۰ ماسک محبوب پوستی'}
            {activeSection === 'conditions' && 'دانشنامه ۲۰ عارضه پوستی'}
          </h2>
          <button
            onClick={() => setActiveSection(null)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-xs transition-all"
          >
            بازگشت به برنامه
          </button>
        </div>

        {activeSection === 'profile' && (
          <ProfileView
            userState={userState}
            onUpdateState={handleUpdateUserState}
            onClose={() => setActiveSection(null)}
          />
        )}
        {activeSection === 'cycle' && (
          <CycleDashboard
            userState={userState}
            onUpdateCycleConfig={(cfg) =>
              handleUpdateUserState({ ...userState, cycleConfig: cfg })
            }
          />
        )}
        {activeSection === 'lab' && <SkinLab initialTab="ingredients" />}
        {activeSection === 'conditions' && <SkinLab initialTab="conditions" />}
        {activeSection === 'products' && (
          <ProductShelf products={products} onUpdateProducts={handleUpdateProducts} />
        )}
        {activeSection === 'photo' && <ProgressTracker userState={userState} />}
        {activeSection === 'masks' && <FaceMasksView onClose={() => setActiveSection(null)} />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-slate-950 text-slate-800 dark:text-white font-['Vazirmatn',sans-serif] relative overflow-hidden transition-colors duration-300">
      {/* Background Ambient Glowing Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[55vw] h-[55vw] max-w-[500px] max-h-[500px] bg-rose-300/20 dark:bg-rose-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[55vw] h-[55vw] max-w-[500px] max-h-[500px] bg-amber-300/20 dark:bg-amber-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Intelligent Dynamic Header */}
        <Header
          userState={userState}
          weather={weather}
          onOpenDrawer={() => setIsDrawerOpen(true)}
          onToggleTheme={handleToggleTheme}
          routineAdherencePct={undefined}
        />

        {/* Drawer Overlay Menu */}
        <DrawerMenu
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          userState={userState}
          onNavigateTab={(tab) => {
            setActiveSection(null);
            setActiveTab(tab);
          }}
          onOpenSection={(section) => {
            setActiveSection(section);
          }}
        />

        {/* Section Overlay (if opened from drawer) */}
        {renderDrawerSectionOverlay()}

        {/* Main Tab Content */}
        {!activeSection && (
          <main className="w-full">
            {activeTab === 'home' && (
              <HomeDashboard
                userState={userState}
                todayLog={todayLog}
                weather={weather}
                onUpdateDailyLog={handleUpdateTodayLog}
                onNavigateTab={setActiveTab}
                onOpenSection={setActiveSection}
              />
            )}

            {activeTab === 'routine' && (
              <RoutineView
                userState={userState}
                todayLog={todayLog}
                weather={weather}
                ownedProducts={products}
                onCompleteStep={handleCompleteRoutineStep}
              />
            )}

            {activeTab === 'knowledge' && <KnowledgeCenter />}

            {activeTab === 'progress' && <ProgressTracker userState={userState} />}
          </main>
        )}

        {/* Floating Bottom Navigation */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveSection(null);
            setActiveTab(tab);
          }}
        />
      </div>
    </div>
  );
};
