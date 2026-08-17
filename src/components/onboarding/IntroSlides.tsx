import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

interface IntroSlidesProps { onDone: () => void; }

/** سه اسلاید معرفی — وکتورهای مرتبط با مراقبت پوست، هم‌رنگ با پالت برنامه. */
const slides = [
  { title: 'مراقبت را ساده شروع کن', text: 'رزا با چند سؤال کوتاه، روتینی متناسب با پوست و سبک زندگی تو می‌سازد.', image: '/assets/onboarding/skincare-amico.svg' },
  { title: 'الگوی پوستت را بشناس', text: 'اگر خواستی چرخه و علائمت را ثبت کن تا الگوی واقعی بدنت را ببینی.', image: '/assets/onboarding/skincare-rafiki.svg' },
  { title: 'همه مراقبت‌ها یک‌جا', text: 'محصولات، نوبت‌های آرایشگاه و پزشک، عکس‌ها و آموزش‌های کوتاه در یک مسیر.', image: '/assets/onboarding/skincare-bro.svg' },
];

export const IntroSlides: React.FC<IntroSlidesProps> = ({ onDone }) => {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;
  const finish = () => { localStorage.setItem('roza_intro_seen_v3', '1'); onDone(); };
  return (
    <main className="min-h-screen bg-[#fffdf7] flex items-center justify-center px-5 py-8">
      <section className="w-full max-w-md space-y-5 text-right">
        <div className="flex items-center justify-between"><span className="text-base font-black text-[#263b56]">رزا</span><button onClick={finish} className="text-xs font-bold text-slate-500">رد کردن</button></div>
        <div className="rounded-[2rem] bg-[#fffdf9] border border-[#f0e5d6] p-5 shadow-[0_18px_50px_rgba(82,62,45,.1)]">
          {/* پس‌زمینه‌ی وکتور دیگر یک کارت جدا نیست؛ همان سفید شیری کارت اصلی است */}
          <div className="h-[260px] flex items-center justify-center overflow-hidden"><img src={slide.image} alt="تصویرسازی معرفی رزا" className="h-full w-full object-contain" /></div>
          <div className="pt-4 space-y-2"><h1 className="text-xl font-black text-[#20334d] leading-8">{slide.title}</h1><p className="text-sm leading-7 text-slate-600">{slide.text}</p></div>
        </div>
        <div className="flex justify-center gap-2">{slides.map((item, itemIndex) => <span key={item.title} className={`h-2 rounded-full transition-all ${itemIndex === index ? 'w-8 bg-[#c47b62]' : 'w-2 bg-[#ddcfc0]'}`} />)}</div>
        <div className="flex items-center gap-3">{index > 0 && <button onClick={() => setIndex((value) => value - 1)} className="rounded-2xl bg-[#f1ece6] px-5 py-3 text-sm font-bold text-[#40506a]">قبلی</button>}<button onClick={() => (isLast ? finish() : setIndex((value) => value + 1))} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#263b56] py-3 text-sm font-bold text-white shadow-md">{isLast ? <><Check className="h-4 w-4" /> شروع</> : <>ادامه <ArrowLeft className="h-4 w-4" /></>}</button></div>
      </section>
    </main>
  );
};
