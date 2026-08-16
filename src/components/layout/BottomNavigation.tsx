import React from 'react';
import { Home, CheckCircle2, BookOpen, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export type NavTab = 'home' | 'routine' | 'knowledge' | 'progress';
interface BottomNavigationProps { activeTab: NavTab; onTabChange: (tab: NavTab) => void; }

/** نوبار پایین با الگوی مرجع: کپسول سفید و تب فعال خاکستری-آبی. */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'خانه', icon: Home },
    { id: 'routine' as NavTab, label: 'روتین', icon: CheckCircle2 },
    { id: 'knowledge' as NavTab, label: 'دانش', icon: BookOpen },
    { id: 'progress' as NavTab, label: 'پیشرفت', icon: TrendingUp },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 pointer-events-none">
      <nav className="max-w-lg mx-auto pointer-events-auto rounded-[2rem] bg-white/95 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-800 shadow-[0_10px_30px_rgba(39,55,82,0.14)] p-2 flex items-center gap-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`relative flex-1 min-h-[52px] rounded-[1.35rem] flex flex-col items-center justify-center gap-0.5 text-sm font-bold transition-colors ${active ? 'text-[#22344e] dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
            >
              {active && <motion.div layoutId="nav-active" className="absolute inset-0 rounded-[1.35rem] bg-[#eef3fa] dark:bg-slate-800" transition={{ duration: 0.22 }} />}
              <Icon className="relative z-10 w-5 h-5" strokeWidth={active ? 2.6 : 2} />
              <span className="relative z-10 text-xs">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
