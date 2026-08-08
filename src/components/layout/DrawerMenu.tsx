import React from 'react';
import { 
  X, 
  User, 
  Moon, 
  FlaskConical, 
  Package, 
  Camera, 
  Calendar, 
  Trophy, 
  Download, 
  ShieldCheck, 
  Sparkles,
  BookOpen,
  ChevronLeft,
  Settings,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../../types';
import { LocalDB } from '../../services/db';
import { toPersianDigits } from '../../services/jalali';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  onNavigateTab: (tab: any) => void;
  onOpenSection: (sectionKey: string) => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  userState,
  onNavigateTab,
  onOpenSection,
}) => {
  const handleExportBackup = () => {
    const backupObj = LocalDB.exportBackupData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `roza_skincare_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const userName = userState.profile.name || 'کاربر عزیز';
  const avatarUrl = userState.profile.avatarUrl;

  const menuItems = [
    {
      key: 'profile',
      labelFa: 'پروفایل و تنظیمات برنامه',
      descFa: 'ویرایش نام، عکس، نوع پوست و تم برنامه',
      icon: User,
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      action: () => { onOpenSection('profile'); onClose(); }
    },
    {
      key: 'cycle',
      labelFa: 'هوشمندی چرخه ماهانه و هورمون',
      descFa: 'بررسی فازهای هورمونی و جوش PMS',
      icon: Moon,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300',
      action: () => { onOpenSection('cycle'); onClose(); }
    },
    {
      key: 'lab',
      labelFa: 'آزمایشگاه پوست و ترکیبات',
      descFa: 'تداخل‌سنج ترکیبات و دانشنامه ۲۰۰۰+',
      icon: FlaskConical,
      color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
      action: () => { onOpenSection('lab'); onClose(); }
    },
    {
      key: 'products',
      labelFa: 'کیف محصولات من',
      descFa: 'مدیریت سرم‌ها، شوینده‌ها و تاریخ انقضا',
      icon: Package,
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
      action: () => { onOpenSection('products'); onClose(); }
    },
    {
      key: 'photo',
      labelFa: 'گالری و تایم‌لاین پیشرفت',
      descFa: 'ثبت عکس روزانه و مقایسه قبل و بعد',
      icon: Camera,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      action: () => { onOpenSection('photo'); onClose(); }
    },
    {
      key: 'masks',
      labelFa: 'ماسک‌های پوستی (۱۰ ماسک محبوب)',
      descFa: 'آموزش انواع ماسک‌های طبیعی خانگی و درمانی',
      icon: Sparkles,
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      action: () => { onOpenSection('masks'); onClose(); }
    },
    {
      key: 'conditions',
      labelFa: 'دانشنامه ۲۰ عارضه پوستی',
      descFa: 'راهکار، علائم، ترکیبات مفید و مضر آکنه، رزاسه، لک و منافذ',
      icon: BookOpen,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
      action: () => { onOpenSection('conditions'); onClose(); }
    },
    {
      key: 'calendar',
      labelFa: 'تقویم جلالی پوست',
      descFa: 'نمایش روزانه روتین‌ها و علائم در تقویم',
      icon: Calendar,
      color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
      action: () => { onNavigateTab('progress'); onClose(); }
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-2xl flex flex-col overflow-y-auto border-l border-rose-100 dark:border-slate-800 font-['Vazirmatn',sans-serif]"
          >
            {/* Header */}
            <div className="p-5 border-b border-rose-100 dark:border-slate-800 bg-rose-50/50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white font-black text-xl shadow-md">
                  R
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-1.5">
                    رزا | دستیار پوست
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">نسخه ۱.۰ | ۱۰۰٪ آفلاین</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Summary Card inside Drawer */}
            <button
              onClick={() => {
                onOpenSection('profile');
                onClose();
              }}
              className="m-4 p-4 rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-rose-500/10 border border-rose-200/80 dark:border-slate-800 text-right hover:border-rose-400 transition-all shadow-xs group"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-300 p-0.5 shadow-sm shrink-0 flex items-center justify-center">
                  {avatarUrl ? (
                    avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') ? (
                      <img src={avatarUrl} alt={userName} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <span className="text-2xl">{avatarUrl}</span>
                    )
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 font-extrabold text-xl">
                      {userName.charAt(0) || 'R'}
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-800 dark:text-white group-hover:text-rose-600 transition-colors">
                      {userName}
                    </h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                      سطح {toPersianDigits(userState.userLevel)}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ویرایش عکس، مشخصات و تم روز/شب
                  </p>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden mt-1">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full"
                      style={{ width: `${Math.min(100, (userState.userXp % 200) / 2)}%` }}
                    />
                  </div>
                </div>

                <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Menu Links */}
            <div className="flex-1 px-4 space-y-2">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 px-2 block mb-1">منوی اصلی و دسترسی‌ها</span>
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={item.action}
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50/60 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-right transition-all group active:scale-98 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-sm text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                          {item.labelFa}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.descFa}</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                  </button>
                );
              })}
            </div>

            {/* Footer / Offline Backup / Privacy */}
            <div className="p-4 border-t border-rose-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-3 mt-4">
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
              >
                <Download className="w-4 h-4 text-rose-500" />
                دانلود فایل پشتیبان (JSON)
              </button>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200 text-right">
                <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  حفظ ۱۰۰٪ حریم خصوصی شما
                </div>
                <p className="text-[10px] leading-relaxed text-emerald-600 dark:text-emerald-300/80">
                  تمامی داده‌ها و عکس‌های شما بصورت کاملاً محلی روی همین مرورگر نگهداری می‌شوند.
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
