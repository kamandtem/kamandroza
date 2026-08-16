import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bell, BookOpen, Camera, ChevronLeft, Download, FlaskConical, Home, Instagram,
  Moon, Package, Palette, Scissors, Settings, ShieldCheck, ShoppingBag, Send, Sparkles,
  Stethoscope, Sun, Trash2, Upload, User, X,
} from 'lucide-react';
import { UserState } from '../../types';
import { LocalDB } from '../../services/db';
import { wipeAllData } from '../../services/storage/persistence';
import { clearPin } from '../../services/security/appLock';
import { APP_VERSION, isFeatureEnabled } from '../../config/appConfig';
import { INGREDIENTS_DATABASE } from '../../services/content/ingredients';
import { SKIN_CONDITIONS_DATABASE } from '../../services/content/conditions';
import { toPersianDigits } from '../../services/jalali';
import type { SectionKey } from '../../App';
import type { NavTab } from './BottomNavigation';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userState: UserState;
  cycleVisible: boolean;
  onNavigateTab: (tab: NavTab) => void;
  onOpenSection: (sectionKey: SectionKey) => void;
  onToggleTheme: () => void;
}

const INSTAGRAM_URL = 'https://www.instagram.com/roza_app';
const TELEGRAM_URL = 'https://t.me/roza_app';

/** منوی کشویی بازطراحی‌شده طبق رفرنس: پروفایل، تنظیمات، تم، لینک‌های اصلی و شبکه‌های اجتماعی. */
export const DrawerMenu: React.FC<DrawerMenuProps> = ({ isOpen, onClose, userState, cycleVisible, onNavigateTab, onOpenSection, onToggleTheme }) => {
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const userName = userState.profile.name || 'کاربر رزا';

  const openSection = (section: SectionKey) => { onOpenSection(section); onClose(); };
  const goTab = (tab: NavTab) => { onNavigateTab(tab); onClose(); };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(LocalDB.exportBackupData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `roza-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
  };

  const importBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => {
      try {
        const result = LocalDB.importBackupData(JSON.parse(String(reader.result)));
        setImportMessage(result.ok ? 'پشتیبان بازگردانده شد. برنامه را دوباره باز کن.' : result.errorFa || 'فایل معتبر نیست.');
      } catch { setImportMessage('فایل پشتیبان خوانده نشد.'); }
    }; reader.readAsText(file);
  };

  const wipe = async () => { clearPin(); await wipeAllData(); window.location.reload(); };

  const items = [
    { label: 'خانه', desc: 'داشبورد اصلی رزا', icon: Home, onClick: () => goTab('home') },
    { label: 'روتین امروز', desc: 'مراحل صبح و شب', icon: Sparkles, onClick: () => goTab('routine') },
    ...(cycleVisible ? [{ label: 'چرخه ماهانه من', desc: 'ثبت پریود و علائم', icon: Moon, onClick: () => openSection('cycle') }] : []),
    { label: 'قفسه محصولات', desc: `${toPersianDigits(0)} محصول آماده اضافه شدن`, icon: Package, onClick: () => openSection('products') },
    { label: 'آرایشگاه و نوبت‌ها', desc: 'خدمات زیبایی و یادآوری', icon: Scissors, onClick: () => openSection('salon') },
    { label: 'پزشک و پرونده پوست', desc: 'ویزیت، دارو و یادداشت', icon: Stethoscope, onClick: () => openSection('clinic') },
    { label: 'ترکیبات و تداخل‌سنج', desc: `${toPersianDigits(INGREDIENTS_DATABASE.length)} ترکیب ثبت‌شده`, icon: FlaskConical, onClick: () => openSection('lab') },
    { label: 'مقالات کوتاه', desc: 'دانش کاربردی پوست و مو', icon: BookOpen, onClick: () => goTab('knowledge') },
    { label: 'عکس‌ها و پیشرفت', desc: 'تقویم و عکس‌های خصوصی', icon: Camera, onClick: () => openSection('photo') },
  ];

  return (
    <AnimatePresence>
      {isOpen && <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-[#23334b]/30 backdrop-blur-sm" />
        <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.28 }} className="fixed top-3 right-3 bottom-3 z-50 w-[calc(100%-24px)] max-w-sm rounded-[2.5rem] bg-[#fffdfb] dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden border border-white/80 dark:border-slate-800">
          <div className="overflow-y-auto flex-1">
            <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <button onClick={onClose} aria-label="بستن منو" className="icon-only p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500"><X className="w-5 h-5" /></button>
                <div className="flex items-center gap-3 text-right">
                  <div className="w-16 h-16 rounded-[1.4rem] bg-[#fff0d8] dark:bg-amber-950/40 border-2 border-[#f2ba61] flex items-center justify-center text-4xl">🌸</div>
                  <div><p className="text-xs text-slate-500 dark:text-slate-400">خوش آمدی</p><h2 className="text-xl font-black text-[#17263b] dark:text-white">{userName}</h2><span className="inline-flex mt-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">همراه رزا</span></div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => openSection('profile')} className="flex-1 rounded-2xl bg-[#eef3fa] dark:bg-slate-800 py-3 text-sm font-bold text-[#243752] dark:text-slate-200 flex items-center justify-center gap-2"><User className="w-4 h-4" /> پروفایل</button>
                <button onClick={() => setShowSettings((value) => !value)} className={`icon-only p-3 rounded-2xl ${showSettings ? 'bg-[#e9eef7] text-[#243752]' : 'bg-slate-50 text-slate-500'} dark:bg-slate-800`} aria-label="تنظیمات"><Settings className="w-5 h-5" /></button>
                <button onClick={() => setShowTheme((value) => !value)} className={`icon-only p-3 rounded-2xl ${showTheme ? 'bg-[#e9eef7] text-[#243752]' : 'bg-slate-50 text-slate-500'} dark:bg-slate-800`} aria-label="تغییر تم">{userState.themeMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
              </div>
              {showTheme && <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex gap-2"><button onClick={() => { if (userState.themeMode === 'dark') onToggleTheme(); }} className={`flex-1 py-2 rounded-xl bg-white dark:bg-slate-700 text-xs font-bold ${userState.themeMode === 'light' ? 'text-rose-600' : ''}`}>تم روشن</button><button onClick={() => { if (userState.themeMode !== 'dark') onToggleTheme(); }} className={`flex-1 py-2 rounded-xl bg-white dark:bg-slate-700 text-xs font-bold ${userState.themeMode === 'dark' ? 'text-rose-600' : ''}`}>تم شب</button><p className="absolute opacity-0">برای تغییر سریع از دکمه هدر استفاده کن.</p></div>}
              {showSettings && <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-7">تنظیمات کامل اعلان، حریم خصوصی، قفل برنامه و اطلاعات تکمیلی در بخش پروفایل قرار دارد.</div>}
            </div>

            <div className="px-5 py-4 space-y-2">
              <p className="px-1 pb-1 text-sm font-black text-slate-400">بخش‌های اصلی</p>
              {items.map(({ label, desc, icon: Icon, onClick }) => <button key={label} onClick={onClick} className="w-full min-h-[64px] rounded-2xl px-3 py-2 flex items-center gap-3 text-right hover:bg-[#f4f7fb] dark:hover:bg-slate-800 transition-colors"><span className="w-11 h-11 rounded-2xl bg-[#f1f5fb] dark:bg-slate-800 text-[#93a5bb] flex items-center justify-center shrink-0"><Icon className="w-5 h-5" strokeWidth={2.1} /></span><span className="flex-1 min-w-0"><strong className="block text-sm font-black text-[#26384f] dark:text-white">{label}</strong><small className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</small></span><ChevronLeft className="w-4 h-4 text-slate-300 shrink-0" /></button>)}
              {isFeatureEnabled('shop') && <button onClick={() => onClose()} className="w-full min-h-[64px] rounded-2xl px-3 py-2 flex items-center gap-3 text-right hover:bg-[#f4f7fb]"><span className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center"><ShoppingBag className="w-5 h-5" /></span><span className="text-sm font-black text-[#26384f]">فروشگاه رزا</span></button>}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 px-5 pt-4 pb-5 bg-[#fffdfb] dark:bg-slate-900">
            <p className="text-center text-sm font-black text-slate-400 mb-3">ما را در شبکه‌های اجتماعی دنبال کنید</p>
            <div className="flex justify-center gap-3 mb-4">
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="تلگرام رزا" className="icon-only w-14 h-14 rounded-2xl bg-[#eef5ff] text-[#229ed9] flex items-center justify-center shadow-sm"><Send className="w-7 h-7" /></a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام رزا" className="icon-only w-14 h-14 rounded-2xl bg-[#fff0f5] text-[#d9467a] flex items-center justify-center shadow-sm"><Instagram className="w-7 h-7" /></a>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportBackup} className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1"><Download className="w-4 h-4" /> پشتیبان</button>
              <label className="flex-1 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"><Upload className="w-4 h-4" /> بازگردانی<input type="file" accept=".json" onChange={importBackup} className="hidden" /></label>
            </div>
            {importMessage && <p className="text-xs text-center text-slate-500 mt-2">{importMessage}</p>}
            {!confirmWipe ? <button onClick={() => setConfirmWipe(true)} className="mt-2 w-full py-2 text-xs font-bold text-rose-600 flex items-center justify-center gap-1"><Trash2 className="w-4 h-4" /> پاک کردن کامل داده‌ها</button> : <div className="mt-2 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-200 space-y-2"><p>همه اطلاعات پاک می‌شود و قابل بازگشت نیست.</p><div className="flex gap-2"><button onClick={() => setConfirmWipe(false)} className="flex-1 py-2 rounded-xl bg-white dark:bg-slate-800 font-bold">انصراف</button><button onClick={wipe} className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold">پاک کن</button></div></div>}
            <p className="mt-3 text-center text-xs text-slate-400">نسخه {toPersianDigits(APP_VERSION)} · <ShieldCheck className="inline w-3 h-3 text-emerald-500" /> اطلاعات روی گوشی شما</p>
          </div>
        </motion.aside>
      </>}
    </AnimatePresence>
  );
};
