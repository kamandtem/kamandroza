import React, { useState } from 'react';
import { 
  FlaskConical, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  X,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ingredient } from '../../types';
import { INGREDIENTS_DATABASE, SKIN_CONDITIONS_DATABASE } from '../../services/db';
import { toPersianDigits } from '../../services/jalali';

interface SkinLabProps {
  initialTab?: 'ingredients' | 'conflicts' | 'conditions';
}

export const SkinLab: React.FC<SkinLabProps> = ({ initialTab = 'ingredients' }) => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'conflicts' | 'conditions'>(initialTab);

  // Ingredient search state
  const [searchIng, setSearchIng] = useState('');
  const [pregnancyOnly, setPregnancyOnly] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Conditions search state
  const [searchQuery, setSearchQuery] = useState('');

  // Conflict Checker state
  const [ingredientA, setIngredientA] = useState<string>('Retinol (Vitamin A)');
  const [ingredientB, setIngredientB] = useState<string>('Salicylic Acid (BHA)');

  // Filtered ingredients
  const filteredIngredients = INGREDIENTS_DATABASE.filter((ing) => {
    const searchLower = searchIng.trim().toLowerCase();
    const matchesSearch =
      searchLower === '' ||
      (ing.name && ing.name.toLowerCase().includes(searchLower)) ||
      (ing.nameFa && ing.nameFa.includes(searchIng));
    const matchesPregnancy = !pregnancyOnly || ing.pregnancySafety === 'safe';
    return matchesSearch && matchesPregnancy;
  });

  // Filtered skin conditions
  const filteredConditions = SKIN_CONDITIONS_DATABASE.filter(
    (c) =>
      searchQuery.trim() === '' ||
      (c.nameFa && c.nameFa.includes(searchQuery)) ||
      (c.summaryFa && c.summaryFa.includes(searchQuery)) ||
      (c.symptomsFa && c.symptomsFa.some((s) => s && s.includes(searchQuery)))
  );

  // Check Conflict Function
  const getConflictStatus = () => {
    const ing1 = INGREDIENTS_DATABASE.find((i) => i.name === ingredientA || i.nameFa === ingredientA);
    const ing2 = INGREDIENTS_DATABASE.find((i) => i.name === ingredientB || i.nameFa === ingredientB);

    if (!ing1 || !ing2) return null;

    if (ing1.id === ing2.id) {
      return {
        safe: true,
        titleFa: 'یک ترکیب یکسان انتخاب شده است',
        descFa: 'استفاده از یک ماده با خودش مشکلی ندارد، فقط دوز مصرفی آن را کنترل کنید.',
        color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
      };
    }

    const conflict1 = (ing1.avoidCombining || []).some((av) => (ing2.name && ing2.name.includes(av)) || (ing2.nameFa && ing2.nameFa.includes(av)));
    const conflict2 = (ing2.avoidCombining || []).some((av) => (ing1.name && ing1.name.includes(av)) || (ing1.nameFa && ing1.nameFa.includes(av)));

    if (conflict1 || conflict2) {
      return {
        safe: false,
        titleFa: 'تداخل و احتمال سوزش و حساسیت بالا!',
        descFa: `ترکیب ${ing1.nameFa} با ${ing2.nameFa} توصیه نمی‌شود. استفاده همزمان می‌تواند سد دفاعی پوست را تخریب کرده و باعث قرمزی، پوسته ریزی یا سوزش شدید شود. یکی را صبح و دیگری را شب استفاده کنید.`,
        color: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200',
      };
    }

    return {
      safe: true,
      titleFa: 'سازگار و بدون تداخل منفی',
      descFa: `ترکیب ${ing1.nameFa} و ${ing2.nameFa} با یکدیگر سازگار هستند و می‌توانید با رعایت فاصله چند دقیقه‌ای در یک روتین استفاده کنید.`,
      color: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200',
    };
  };

  const conflictResult = getConflictStatus();

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto space-y-4 font-['Vazirmatn',sans-serif] text-slate-800 dark:text-white">
      {/* Title Header */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-200 dark:border-slate-800 text-right space-y-1">
        <h2 className="text-base font-extrabold flex items-center gap-2 text-slate-800 dark:text-white">
          <FlaskConical className="w-5 h-5 text-rose-500" />
          آزمایشگاه تخصصی هوش پوستی
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          بانک اطلاعاتی ترکیبات موثره، چک تداخل هوشمند و دانشنامه ۲۰ عارضه شایع پوستی.
        </p>
      </div>

      {/* Modern Bright Tab Switcher */}
      <div className="p-1 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 flex items-center gap-1 text-xs font-bold shadow-xs">
        <button
          onClick={() => setActiveTab('ingredients')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'ingredients'
              ? 'bg-rose-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800'
          }`}
        >
          ترکیبات ({toPersianDigits(INGREDIENTS_DATABASE.length)})
        </button>
        <button
          onClick={() => setActiveTab('conflicts')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'conflicts'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800'
          }`}
        >
          تداخل‌سنج
        </button>
        <button
          onClick={() => setActiveTab('conditions')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'conditions'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800'
          }`}
        >
          ۲۰ عارضه پوستی
        </button>
      </div>

      {/* TAB 1: INGREDIENTS ENCYCLOPEDIA */}
      {activeTab === 'ingredients' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchIng}
                onChange={(e) => setSearchIng(e.target.value)}
                placeholder="جستجوی ترکیب (نیاسینامید، رتینول، Retinol)..."
                className="w-full py-2.5 pr-10 pl-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-400"
              />
              <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
            </div>

            <button
              onClick={() => setPregnancyOnly(!pregnancyOnly)}
              className={`px-3 py-2.5 rounded-2xl text-[11px] font-extrabold border transition-all shrink-0 ${
                pregnancyOnly
                  ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-rose-100 dark:border-slate-800 hover:bg-rose-50'
              }`}
            >
              ایمن بارداری
            </button>
          </div>

          <div className="space-y-2">
            {filteredIngredients.map((ing) => (
              <motion.div
                key={ing.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedIngredient(ing)}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-2xs hover:border-rose-300 cursor-pointer text-right space-y-2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                      {ing.nameFa}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">{ing.name}</span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                      ing.pregnancySafety === 'safe'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {ing.pregnancySafety === 'safe' ? '✓ ایمن در بارداری' : '✕ پرهیز در بارداری'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {ing.descriptionFa}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: INGREDIENT CONFLICT CHECKER */}
      {activeTab === 'conflicts' && (
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-4 text-right">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">تداخل‌سنج هوشمند دو ترکیب پوستی</h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            دو ترکیب فعال که قصد دارید همزمان در یک روتین استفاده کنید را انتخاب کنید تا احتمال واکنش آلرژیک، سوزش یا تخریب سد دفاعی بررسی شود.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">ترکیب اول (A):</label>
              <select
                value={ingredientA}
                onChange={(e) => setIngredientA(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-rose-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
              >
                {INGREDIENTS_DATABASE.map((i) => (
                  <option key={i.id} value={i.name}>
                    {i.nameFa} ({i.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">ترکیب دوم (B):</label>
              <select
                value={ingredientB}
                onChange={(e) => setIngredientB(e.target.value)}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-rose-100 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white"
              >
                {INGREDIENTS_DATABASE.map((i) => (
                  <option key={i.id} value={i.name}>
                    {i.nameFa} ({i.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conflict Output */}
          {conflictResult && (
            <div className={`p-4 rounded-2xl border ${conflictResult.color} space-y-2 mt-4`}>
              <div className="flex items-center gap-2 font-black text-sm">
                {conflictResult.safe ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                )}
                <span>{conflictResult.titleFa}</span>
              </div>
              <p className="text-xs leading-relaxed">{conflictResult.descFa}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SKIN CONDITIONS ENCYCLOPEDIA (20 items with offline images) */}
      {activeTab === 'conditions' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی عارضه (آکنه، رزاسه، لک، منافذ، چروک)..."
              className="w-full py-2.5 pr-10 pl-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-400"
            />
            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {filteredConditions.map((cond) => (
              <div
                key={cond.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs text-right space-y-3"
              >
                <div className="flex gap-3 items-start">
                  {cond.imageUrl && (
                    <img
                      src={cond.imageUrl}
                      alt={cond.nameFa}
                      className="w-20 h-20 rounded-2xl object-cover shrink-0 border border-slate-100 dark:border-slate-800 shadow-2xs"
                    />
                  )}
                  <div className="space-y-1 flex-1">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
                      {cond.nameFa}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {cond.summaryFa}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-rose-50/50 dark:bg-slate-800/50 p-3 rounded-2xl border border-rose-100 dark:border-slate-700">
                  {cond.descriptionFa}
                </p>

                {cond.symptomsFa && cond.symptomsFa.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      📌 علائم و نشانه‌های اصلی:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cond.symptomsFa.map((sym, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold"
                        >
                          • {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 space-y-1">
                    <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block">
                      ✓ ترکیبات موثره پیشنهادی:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cond.suitableIngredients.map((ing, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 space-y-1">
                    <span className="font-extrabold text-rose-800 dark:text-rose-300 block">
                      ✕ ترکیبات ممنوعه یا مضر:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cond.avoidIngredients.map((ing, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-rose-200/80 dark:bg-rose-900 text-rose-900 dark:text-rose-200 text-[10px] font-bold"
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredient Modal Detail */}
      <AnimatePresence>
        {selectedIngredient && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-slate-900 text-right space-y-4 shadow-2xl border border-rose-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                    {selectedIngredient.nameFa}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">{selectedIngredient.name}</span>
                </div>
                <button
                  onClick={() => setSelectedIngredient(null)}
                  className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-rose-50/50 dark:bg-slate-800/50 p-3 rounded-2xl">
                {selectedIngredient.descriptionFa}
              </p>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-extrabold text-emerald-600 block mb-1">✨ فواید اصلی:</span>
                  <ul className="list-disc pr-4 space-y-1 text-slate-600 dark:text-slate-300">
                    {selectedIngredient.benefitsFa.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-extrabold text-rose-600 block mb-1">⚠️ پرهیز از ترکیب همزمان با:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedIngredient.avoidCombining.map((av, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[11px] font-bold">
                        {av}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedIngredient(null)}
                className="w-full py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md mt-2"
              >
                متوجه شدم
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
