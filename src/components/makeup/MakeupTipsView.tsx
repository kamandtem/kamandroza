import React, { useState } from 'react';
import { ArrowUpLeft, Brush, ChevronDown, Sparkles } from 'lucide-react';

const tips = [
  { title: 'تینت پوست', category: 'پایه آرایش', image: '/assets/makeup/setting.svg', text: 'برای شروع، تینت سبک را از مرکز صورت به بیرون پخش کن. لایه نازک بهتر از پوشش سنگین است و هرجا لازم بود فقط همان نقطه را بیشتر کار کن.', note: 'الهام از توصیه آرتیست‌های آرایش برای محصولات سبک و قابل ساختن.' },
  { title: 'تونر', category: 'آماده‌سازی پوست', image: '/assets/makeup/toner.svg', text: 'تونر برای همه ضروری نیست. اگر استفاده می‌کنی، روی پوست تمیز با دست یا پد نرم بزن و بعد مرطوب‌کننده را فراموش نکن. تونر جای شوینده یا درمان را نمی‌گیرد.' },
  { title: 'رژ لب محو', category: 'لب', image: '/assets/makeup/lipstick.svg', text: 'رنگ را وسط لب بزن، با انگشت به سمت لبه‌ها محو کن و فقط مرکز لب را کمی براق‌تر بگذار. این روش خطای کمتری از کشیدن یک خط کامل دارد.' },
  { title: 'رژگونه کرمی', category: 'گونه', image: '/assets/makeup/blush.svg', text: 'رژگونه کرمی را کم‌کم روی برجستگی گونه بزن و به سمت شقیقه محو کن. فرمول‌های قابل ساختن برای شروع بهترند چون راحت‌تر کنترل می‌شوند.' },
  { title: 'خط چشم قهوه‌ای', category: 'چشم', image: '/assets/makeup/eyeliner.svg', text: 'برای آرایش روزانه، خط قهوه‌ای را از نیمه پلک شروع کن و گوشه بیرونی را کمی بالا ببر. قبل از خشک شدن، لبه آن را کمی محو کن.' },
  { title: 'ریمل مرتب', category: 'چشم', image: '/assets/makeup/mascara.svg', text: 'اضافه ریمل را از برس بگیر، برس را نزدیک ریشه قرار بده و با حرکت آرام به سمت نوک بکش. دو لایه نازک از یک لایه سنگین تمیزتر است.' },
  { title: 'ابروی طبیعی', category: 'ابرو', image: '/assets/makeup/brow.svg', text: 'موهای ابرو را رو به بالا شانه کن و فقط جاهای خالی را با خط‌های کوتاه پر کن. ابتدای ابرو را پررنگ نکن تا چهره طبیعی بماند.' },
  { title: 'هایلایتر کم‌حجم', category: 'چهره', image: '/assets/makeup/highlighter.svg', text: 'هایلایتر را روی بالای گونه و گوشه داخلی چشم بزن. مقدار کم و پخش‌شده، شیک‌تر از یک نقطه خیلی براق دیده می‌شود.' },
  { title: 'براش تمیز', category: 'ابزار', image: '/assets/makeup/brush.svg', text: 'براش‌های صورت را مرتب بشوی و کامل خشک کن. براش کثیف هم نتیجه را لک‌دار می‌کند، هم می‌تواند پوست را تحریک کند.' },
  { title: 'لاک مینیمال', category: 'ناخن', image: '/assets/makeup/nails.svg', text: 'سطح ناخن را خشک کن، سه حرکت باریک بزن و بین لایه‌ها زمان بده. برای ظاهر امروزی، رنگ‌های شیری، صورتی شفاف و زرد کره‌ای انتخاب‌های ساده و قابل استفاده‌اند.' },
];

/** محتوای آموزشی ساده و مبتنی بر توصیه‌های آرتیست‌های حرفه‌ای، با تصاویر آفلاین. */
export const MakeupTipsView: React.FC = () => {
  const [open, setOpen] = useState<string | null>(null);
  return <div className="pb-[220px] pt-3 px-4 max-w-lg mx-auto space-y-4">
    <div className="p-5 rounded-[2rem] bg-gradient-to-br from-[#fff3e8] to-[#f3efff] border border-[#f0dfd2] space-y-2"><div className="flex items-center gap-2 text-[#263b56]"><Brush className="w-5 h-5" /><h2 className="text-lg font-black">ترفندهای آرایش</h2></div><p className="text-sm leading-7 text-slate-600">روش‌های کوتاه، طبیعی و قابل انجام. قرار نیست برای یک آرایش ساده، کیف پر از ابزار داشته باشی.</p></div>
    <div className="space-y-3">{tips.map((tip, index) => { const isOpen = open === tip.title; return <article key={tip.title} className="rounded-[1.7rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm"><button onClick={() => setOpen(isOpen ? null : tip.title)} className="w-full text-right"><div className="relative"><img src={tip.image} alt={tip.title} className="w-full h-44 object-cover" loading="lazy" /><span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-[#263b56] text-xs font-black flex items-center justify-center">{index + 1}</span></div><div className="p-4 flex items-center justify-between gap-3"><div><span className="text-xs font-bold text-rose-500">{tip.category}</span><h3 className="text-base font-black text-[#263b56] dark:text-white mt-1">{tip.title}</h3></div><ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></div></button>{isOpen && <div className="px-4 pb-4 space-y-3"><p className="text-sm leading-8 text-slate-600 dark:text-slate-300 flex gap-2"><Sparkles className="w-4 h-4 mt-2 text-amber-500 shrink-0" /><span>{tip.text}</span></p>{tip.note && <p className="text-xs leading-6 text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center gap-1"><ArrowUpLeft className="w-3.5 h-3.5" />{tip.note}</p>}</div>}</article>; })}</div>
  </div>;
};
