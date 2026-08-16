import React, { useState } from 'react';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';

interface IntroSlidesProps { onDone: () => void; }

const Character: React.FC<{ variant: number }> = ({ variant }) => {
  const colors = ['#ffd1dc', '#ded5ff', '#bdeee8'];
  return (
    <svg viewBox="0 0 160 160" className="h-28 w-28" role="img" aria-label="تصویرسازی رزا">
      <circle cx="80" cy="80" r="66" fill={colors[variant]} />
      <path d="M36 69c8-31 83-42 91 4-18-10-43-16-91-4Z" fill="#5e3e47" />
      <circle cx="59" cy="86" r="5" fill="#4b3440" />
      <circle cx="101" cy="86" r="5" fill="#4b3440" />
      <path d="M69 108c8 7 14 7 22 0" fill="none" stroke="#a85a6b" strokeWidth="5" strokeLinecap="round" />
      {variant === 0 && <path d="M80 22c-8-18-26-13-20 3-18-7-25 9-9 17 11 5 23-1 29-20Z" fill="#f6b63b" />}
      {variant === 1 && <path d="M119 32a27 27 0 1 0 0 54 23 23 0 1 1 0-54Z" fill="#fff0b5" />}
      {variant === 2 && <><circle cx="80" cy="20" r="8" fill="#f6b63b" /><path d="M80 5v30M65 20h30" stroke="#f6b63b" strokeWidth="4" strokeLinecap="round" /></>}
    </svg>
  );
};

const slides = [
  { eyebrow: 'پوست و مو', title: 'مراقبت را ساده شروع کن', text: 'رزا بر اساس نوع پوست، حساسیت، آب‌وهوا و محصولاتی که داری، یک روتین کوتاه و قابل انجام می‌سازد.', color: 'from-rose-500 to-orange-400', variant: 0 },
  { eyebrow: 'چرخه و حال پوست', title: 'الگوی بدن خودت را پیدا کن', text: 'اگر خواستی، چرخه و علائمت را ثبت کن تا بعد از چند ماه، الگوی واقعی جوش، درد و حساسیت پوستت را ببینی.', color: 'from-purple-600 to-rose-500', variant: 1 },
  { eyebrow: 'نوبت‌ها و آینده', title: 'همه مراقبت‌ها یک‌جا', text: 'نوبت آرایشگاه، پزشک، عکس‌های پیشرفت و بعداً خرید محصولات، همه در مسیر مراقبت شخصی تو قرار می‌گیرند.', color: 'from-teal-500 to-sky-500', variant: 2 },
];

export const IntroSlides: React.FC<IntroSlidesProps> = ({ onDone }) => {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const finish = () => { localStorage.setItem('roza_intro_seen_v2', '1'); onDone(); };

  return (
    <main className="min-h-screen bg-[#fbf8f5] dark:bg-slate-950 flex items-center justify-center px-5 py-8">
      <section className="w-full max-w-md space-y-6 text-right">
        <div className="flex items-center justify-between"><span className="text-sm font-black text-rose-600">رزا</span><button onClick={finish} className="text-sm font-bold text-slate-500 dark:text-slate-400">رد کردن</button></div>
        <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${slide.color} p-7 text-white min-h-[360px]`}>
          <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-white/15" /><div className="absolute -bottom-14 -right-8 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative flex h-full min-h-[305px] flex-col justify-between">
            <div className="flex items-center justify-between"><span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">{slide.eyebrow}</span><Character variant={slide.variant} /></div>
            <div className="space-y-3"><div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 border-white/60 bg-white/20 shadow-lg"><Character variant={slide.variant} /></div><h1 className="text-center text-2xl font-black leading-tight">{slide.title}</h1><p className="text-center text-sm leading-8 text-white/90">{slide.text}</p></div>
          </div>
        </div>
        <div className="flex justify-center gap-2">{slides.map((item, itemIndex) => <span key={item.eyebrow} className={`h-2 rounded-full transition-all ${itemIndex === index ? 'w-8 bg-rose-500' : 'w-2 bg-slate-300 dark:bg-slate-700'}`} />)}</div>
        <div className="flex items-center gap-3">{index > 0 && <button onClick={() => setIndex((value) => value - 1)} className="rounded-2xl bg-slate-100 px-5 py-3.5 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">قبلی</button>}<button onClick={() => (isLast ? finish() : setIndex((value) => value + 1))} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#8e5241] py-3.5 text-sm font-bold text-white shadow-md">{isLast ? <><Check className="h-4 w-4" /> شروع شناخت رزا</> : <>ادامه <ArrowLeft className="h-4 w-4" /></>}</button></div>
        <p className="flex items-center justify-center gap-2 text-center text-xs leading-6 text-slate-500 dark:text-slate-400"><ShieldCheck className="h-4 w-4 text-emerald-500" /> اطلاعات شخصی و عکس‌ها روی همین گوشی می‌مانند.</p>
      </section>
    </main>
  );
};
