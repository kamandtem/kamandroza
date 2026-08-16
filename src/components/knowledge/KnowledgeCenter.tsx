import React, { useState } from 'react';
import { Search, BookOpen, Clock, Tag, X, ChevronLeft, Sparkles, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Article } from '../../types';
import { ARTICLES_DATABASE } from '../../services/db';
import { EXTRA_ARTICLES } from '../../services/content/extraArticles';
import { toPersianDigits } from '../../services/jalali';

export const KnowledgeCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  const categories = [
    { id: 'all', nameFa: 'همه موضوعات' },
    { id: 'cat_hormones', nameFa: 'هورمون‌ها و چرخه ماهانه' },
    { id: 'cat_ingredients', nameFa: 'علم ترکیبات موثره' },
    { id: 'cat_skin_types', nameFa: 'انواع پوست' },
    { id: 'cat_structure', nameFa: 'شناخت ساختار پوست' },
    { id: 'cat_sun_protection', nameFa: 'محافظت در برابر خورشید' },
    { id: 'cat_routines', nameFa: 'روتین‌های روزانه و فصلی' },
    { id: 'cat_myths', nameFa: 'باورهای نادرست پوستی' },
    { id: 'cat_lifestyle', nameFa: 'سبک زندگی و تغذیه' },
    { id: 'cat_hair', nameFa: 'مراقبت از مو و پوست سر' },
  ];

  const allArticles = [...ARTICLES_DATABASE, ...EXTRA_ARTICLES];
  const filteredArticles = allArticles.filter((art) => {
    const matchesCategory = selectedCategory === 'all' || art.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      (art.titleFa && art.titleFa.includes(searchQuery)) ||
      (art.summaryFa && art.summaryFa.includes(searchQuery)) ||
      (art.tagsFa && art.tagsFa.some((t) => t && t.includes(searchQuery)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto space-y-4 font-['Vazirmatn',sans-serif]">
      {/* Header Info Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-emerald-500/10 border border-rose-200/60 dark:border-slate-800 text-right space-y-1">
        <h2 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-rose-500" />
          مقالات کوتاه و کاربردی
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          اول جواب ساده را بخوان؛ جزئیات علمی را فقط اگر خواستی باز کن.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="جستجو در مقالات، ترکیبات، هورمون‌ها..."
          className="w-full py-3 pr-11 pl-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-400 shadow-xs"
        />
        <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />
      </div>

      {/* Category Horizontal Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-right">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`py-1.5 px-3 rounded-2xl text-xs font-bold whitespace-nowrap border transition-all ${
              selectedCategory === cat.id
                ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-rose-100 dark:border-slate-800 hover:bg-rose-50'
            }`}
          >
            {cat.nameFa}
          </button>
        ))}
      </div>

      {/* Articles Cards Grid */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 text-slate-400 text-xs font-bold space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p>هیچ مقاله‌ای با این عنوان یا موضوع یافت نشد.</p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <motion.div
              key={article.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setActiveArticle(article)}
              className="rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs hover:border-rose-300 cursor-pointer text-right overflow-hidden transition-all group"
            >
              {/* Article Cover Image */}
              {article.imageUrl && (
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={article.imageUrl}
                    alt={article.titleFa}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  {/* Category Pill on Image */}
                  <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-rose-600 dark:text-rose-400 text-xs font-extrabold border border-rose-200/60 dark:border-slate-700 shadow-xs">
                    {article.categoryFa}
                  </span>

                  {/* Read Time Pill */}
                  <span className="absolute bottom-3 right-3 flex items-center gap-1 text-white text-[11px] font-bold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                    <Clock className="w-3.5 h-3.5 text-amber-300" />
                    <span>{toPersianDigits(article.readTimeMin)} دقیقه مطالعه</span>
                  </span>
                </div>
              )}

              {/* Article Content */}
              <div className="p-4 space-y-2">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  {article.titleFa}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                  {article.summaryFa}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-rose-600 dark:text-rose-400 font-bold">
                  <span className="flex items-center gap-1">
                    مطالعه مقاله کامل
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    سطح {article.difficultyFa}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Full Article Reader Modal */}
      <AnimatePresence>
        {activeArticle && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-right shadow-2xl border border-rose-100 dark:border-slate-800"
            >
              {/* Modal Cover Image */}
              {activeArticle.imageUrl && (
                <div className="relative h-52 w-full">
                  <img
                    src={activeArticle.imageUrl}
                    alt={activeArticle.titleFa}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  <button
                    onClick={() => setActiveArticle(null)}
                    className="absolute top-3 left-3 p-2 rounded-2xl bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border border-white/20"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="absolute bottom-3 right-4 left-4 space-y-1">
                    <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-extrabold inline-block mb-1">
                      {activeArticle.categoryFa}
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white leading-snug">
                      {activeArticle.titleFa}
                    </h2>
                  </div>
                </div>
              )}

              <div className="p-5 space-y-4">
                {!activeArticle.imageUrl && (
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-black">
                      {activeArticle.categoryFa}
                    </span>
                    <button
                      onClick={() => setActiveArticle(null)}
                      className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-amber-500" />
                    زمان مطالعه: {toPersianDigits(activeArticle.readTimeMin)} دقیقه
                  </span>
                  <span>•</span>
                  <span>سطح: {activeArticle.difficultyFa}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-loose whitespace-pre-line">
                  {activeArticle.fullContentFa}
                </div>

                {/* Tags & Related */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-400 block">برچسب‌های مرتبط:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeArticle.tagsFa.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveArticle(null)}
                  className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md mt-2"
                >
                  بستن مقاله
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
