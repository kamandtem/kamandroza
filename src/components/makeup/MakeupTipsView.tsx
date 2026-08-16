import React, { useState } from 'react';
import { Brush, ChevronDown, Sparkles } from 'lucide-react';

const tips = [
  { title: 'رژ لب محو و طبیعی', category: 'لب', image: '/assets/makeup/lipstick.svg', text: 'اول لب را مرطوب کن، رنگ را از مرکز لب بزن و با انگشت به سمت لبه‌ها محو کن. برای ظاهر امروزی، مرکز لب را کمی براق‌تر نگه دار.' },
  { title: 'رژگونه روی گونه و شقیقه', category: 'چهره', image: '/assets/makeup/blush.svg', text: 'رژگونه را از برجستگی گونه به سمت شقیقه ببر تا چهره کشیده‌تر دیده شود. مقدار کم بزن و لایه‌لایه اضافه کن، نه یک‌باره.' },
  { title: 'خط چشم قهوه‌ای نرم', category: 'چشم', image: '/assets/makeup/eyeliner.svg', text: 'برای آرایش روزانه، قهوه‌ای به جای مشکی نرم‌تر است. خط را از وسط پلک شروع کن، گوشه بیرونی را کمی بالا ببر و مرزش را محو کن.' },
  { title: 'لاک تمیز و مینیمال', category: 'ناخن', image: '/assets/makeup/nails.svg', text: 'قبل از لاک، سطح ناخن را خشک و تمیز کن. سه حرکت باریک بزن، بین دو لایه صبر کن و در پایان روی لبه آزاد ناخن هم پوشش بده.' },
];

/** ترفندهای آرایش با متن کوتاه و تصویرسازی آفلاین. */
export const MakeupTipsView: React.FC = () => {
  const [open, setOpen] = useState<string | null>(null);
  return <div className="pb-28 px-4 max-w-lg mx-auto space-y-4">
    <div className="p-5 rounded-[2rem] bg-gradient-to-br from-[#fff3e8] to-[#f3efff] border border-[#f0dfd2] space-y-2"><div className="flex items-center gap-2 text-[#263b56]"><Brush className="w-5 h-5" /><h2 className="text-lg font-black">ترفندهای آرایش</h2></div><p className="text-sm leading-7 text-slate-600">ترفندهای سریع و کاربردی برای آرایش روزانه، با تمرکز روی نتیجه طبیعی و قابل انجام.</p></div>
    <div className="space-y-3">{tips.map((tip) => { const isOpen = open === tip.title; return <div key={tip.title} className="rounded-[1.7rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm"><button onClick={() => setOpen(isOpen ? null : tip.title)} className="w-full text-right"><img src={tip.image} alt={tip.title} className="w-full h-44 object-cover" loading="lazy" /><div className="p-4 flex items-center justify-between gap-3"><div><span className="text-xs font-bold text-rose-500">{tip.category}</span><h3 className="text-base font-black text-[#263b56] dark:text-white mt-1">{tip.title}</h3></div><ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} /></div></button>{isOpen && <div className="px-4 pb-4 text-sm leading-8 text-slate-600 dark:text-slate-300 flex gap-2"><Sparkles className="w-4 h-4 mt-2 text-amber-500 shrink-0" /><p>{tip.text}</p></div>}</div>; })}</div>
  </div>;
};
