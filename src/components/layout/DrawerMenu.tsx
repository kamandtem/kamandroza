import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, Camera, ChevronLeft, FlaskConical, Home, Instagram, Moon, Package, Scissors, Send, Settings, ShieldCheck, ShoppingBag, Sparkles, Stethoscope, Sun, User, X } from 'lucide-react';
import { UserState } from '../../types';
import { APP_VERSION, isFeatureEnabled } from '../../config/appConfig';
import { INGREDIENTS_DATABASE } from '../../services/content/ingredients';
import { toPersianDigits } from '../../services/jalali';
import type { SectionKey } from '../../App';
import type { NavTab } from './BottomNavigation';

interface Props { isOpen: boolean; onClose: () => void; userState: UserState; cycleVisible: boolean; onNavigateTab: (tab: NavTab) => void; onOpenSection: (key: SectionKey) => void; onToggleTheme: () => void; }
const INSTAGRAM_URL = 'https://www.instagram.com/roza_app'; const TELEGRAM_URL = 'https://t.me/roza_app';

const InstagramGlyph = ({ className = '' }: { className?: string }) => <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></svg>;
const TelegramGlyph = ({ className = '' }: { className?: string }) => <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M21.8 4.5 3.2 11.7c-1 .4-1 1 .1 1.3l4.7 1.5 1.8 5.7c.2.6.4.8.8.8.3 0 .5-.1.7-.3l2.5-2.4 4.9 3.6c.7.4 1.2.2 1.4-.6l3.1-14.4c.3-1-.4-1.5-1.4-1.4zM8.6 14.2l9.8-6.1c.5-.3.9-.1.5.2L10.5 15l-.3 3.4-1.6-4.2z" /></svg>;

export const DrawerMenu: React.FC<Props> = ({ isOpen, onClose, userState, cycleVisible, onNavigateTab, onOpenSection, onToggleTheme }) => {
  const drawerRef = useRef<HTMLElement>(null); const touchRef = useRef<{ x: number; y: number } | null>(null); const [dragX, setDragX] = useState(0); const [dragging, setDragging] = useState(false);
  useEffect(() => { document.body.style.overflow = isOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [isOpen]);
  const goTab = (tab: NavTab) => { onNavigateTab(tab); onClose(); }; const goSection = (key: SectionKey) => { onOpenSection(key); onClose(); };
  const handleStart = (e: React.TouchEvent) => { const t = e.touches[0]; touchRef.current = { x: t.clientX, y: t.clientY }; };
  const handleMove = (e: React.TouchEvent) => { if (!touchRef.current) return; const t = e.touches[0]; const dx = t.clientX - touchRef.current.x; const dy = t.clientY - touchRef.current.y; if (Math.abs(dx) > Math.abs(dy) && dx > 8) { setDragging(true); setDragX(dx); } };
  const handleEnd = () => { if (dragX > (drawerRef.current?.offsetWidth || 320) * 0.28) onClose(); setDragX(0); setDragging(false); touchRef.current = null; };
  const items = [
    { label: 'خانه', desc: 'داشبورد اصلی رزا', icon: Home, click: () => goTab('home') },
    { label: 'روتین امروز', desc: 'مراحل صبح و شب', icon: Sparkles, click: () => goTab('routine') },
    ...(cycleVisible ? [{ label: 'چرخه ماهانه من', desc: 'ثبت پریود و علائم', icon: Moon, click: () => goSection('cycle') }] : []),
    { label: 'قفسه محصولات', desc: 'محصولات و تاریخ انقضا', icon: Package, click: () => goSection('products') },
    { label: 'آرایشگاه و نوبت‌ها', desc: 'خدمات زیبایی و یادآوری', icon: Scissors, click: () => goSection('salon') },
    { label: 'پزشک و پرونده پوست', desc: 'ویزیت، دارو و یادداشت', icon: Stethoscope, click: () => goSection('clinic') },
    { label: 'ترکیبات و تداخل‌سنج', desc: `${toPersianDigits(INGREDIENTS_DATABASE.length)} ترکیب ثبت‌شده`, icon: FlaskConical, click: () => goSection('lab') },
    { label: 'مقالات کوتاه', desc: 'دانش کاربردی پوست و مو', icon: BookOpen, click: () => goTab('knowledge') },
    { label: 'ترفندهای آرایش', desc: 'رژ لب، خط چشم، رژگونه و لاک', icon: Sparkles, click: () => goSection('makeup') },
    { label: 'عکس‌ها و پیشرفت', desc: 'تقویم و عکس‌های خصوصی', icon: Camera, click: () => goSection('photo') },
  ];
  return <AnimatePresence>{isOpen && <><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-[#23334b]/35" /><motion.aside ref={drawerRef} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} style={{ transform: `translateX(${dragX}px)`, transition: dragging ? 'none' : 'transform 240ms cubic-bezier(.16,1,.3,1)' }} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.26 }} className="fixed top-[calc(env(safe-area-inset-top)+12px)] right-0 bottom-0 z-50 w-[calc(100%-16px)] max-w-sm rounded-l-[2.2rem] bg-[#fffdfb] dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden border border-white dark:border-slate-800 touch-pan-y">
    <div className="overflow-y-auto flex-1">
      <div className="p-5 pb-4 border-b border-slate-100 dark:border-slate-800"><div className="flex items-center gap-3 text-right"><div className="w-16 h-16 rounded-[1.4rem] bg-[#fff0d8] dark:bg-amber-950/40 border-2 border-[#f2ba61] flex items-center justify-center text-4xl overflow-hidden">{userState.profile.avatarUrl?.startsWith('data:') ? <img src={userState.profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : userState.profile.avatarUrl || '🌸'}</div><div className="flex-1 min-w-0"><p className="text-xs text-slate-500 dark:text-slate-400">خوش آمدی</p><h2 className="text-xl font-black text-[#17263b] dark:text-white truncate">{userState.profile.name || 'کاربر رزا'}</h2><span className="inline-flex mt-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">همراه رزا</span></div><div className="flex flex-col gap-2"><button onClick={() => goSection('profile')} aria-label="تنظیمات" className="icon-only p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500"><Settings className="w-5 h-5" /></button><button onClick={onToggleTheme} aria-label="تغییر تم" className="icon-only p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-amber-500 dark:text-indigo-300">{userState.themeMode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button></div></div></div>
      <div className="px-5 py-4 space-y-1.5"><p className="px-1 pb-1 text-sm font-black text-slate-400">دسترسی‌ها</p>{items.map(({ label, desc, icon: Icon, click }) => <button key={label} onClick={click} className="w-full min-h-[64px] rounded-2xl px-3 py-2 flex items-center gap-3 text-right hover:bg-[#f4f7fb] dark:hover:bg-slate-800"><span className="w-11 h-11 rounded-2xl bg-[#f1f5fb] dark:bg-slate-800 text-[#93a5bb] flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span><span className="flex-1 min-w-0"><strong className="block text-sm font-black text-[#26384f] dark:text-white">{label}</strong><small className="block text-xs text-slate-400 mt-0.5">{desc}</small></span><ChevronLeft className="w-4 h-4 text-slate-300" /></button>)}{isFeatureEnabled('shop') && <button onClick={onClose} className="w-full min-h-[64px] rounded-2xl px-3 py-2 flex items-center gap-3 text-right"><span className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center"><ShoppingBag className="w-5 h-5" /></span><strong className="text-sm font-black">فروشگاه رزا</strong></button>}</div>
    </div>
    <div className="border-t border-slate-100 dark:border-slate-800 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)] bg-[#fffdfb] dark:bg-slate-900"><p className="text-center text-sm font-black text-slate-400 mb-3">ما را در شبکه‌های اجتماعی دنبال کنید</p><div className="flex justify-center gap-3"><a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="تلگرام رزا" className="icon-only w-14 h-14 rounded-2xl bg-[#eef5ff] text-[#229ed9] flex items-center justify-center"><TelegramGlyph className="w-7 h-7" /></a><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام رزا" className="icon-only w-14 h-14 rounded-2xl bg-[#fff0f5] text-[#d9467a] flex items-center justify-center"><InstagramGlyph className="w-7 h-7" /></a></div><p className="mt-3 text-center text-xs text-slate-400"><ShieldCheck className="inline w-3 h-3 text-emerald-500" /> اطلاعات روی گوشی شما · نسخه {toPersianDigits(APP_VERSION)}</p></div>
  </motion.aside></>}</AnimatePresence>;
};
