import React from 'react';
import { Home, CheckCircle2, BookOpen, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export type NavTab = 'home' | 'routine' | 'knowledge' | 'progress';

interface BottomNavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'routine', label: 'روتین امروز', icon: CheckCircle2 },
    { id: 'knowledge', label: 'دانش پوست', icon: BookOpen },
    { id: 'progress', label: 'پیشرفت و آمار', icon: TrendingUp },
  ];

  return (
    <div className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none">
      <nav className="max-w-md mx-auto pointer-events-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-rose-200/60 dark:border-slate-800 rounded-3xl p-1.5 shadow-xl shadow-rose-900/5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 py-2 flex flex-col items-center justify-center transition-all rounded-2xl ${
                isActive
                  ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-rose-50 dark:bg-rose-950/40 rounded-2xl -z-10 border border-rose-200/80 dark:border-rose-800/50 shadow-xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-rose-500 dark:text-rose-400' : 'scale-100'}`} />
              <span className={`text-[11px] mt-0.5 whitespace-nowrap font-bold ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
