import React, { useMemo, useState } from 'react';
import { FlaskConical, Search, AlertTriangle, CheckCircle2, X, ShieldAlert } from 'lucide-react';
import { Ingredient, Product, UserState } from '../../types';
import { INGREDIENTS_DATABASE } from '../../services/content/ingredients';
import { SKIN_CONDITIONS_DATABASE } from '../../services/content/conditions';
import { checkPairConflict, evaluateIngredientSafety } from '../../services/safety';
import { LocalDB } from '../../services/db';
import { toPersianDigits } from '../../services/jalali';

interface SkinLabProps {
  initialTab?: 'ingredients' | 'conflicts' | 'conditions';
  userState: UserState;
  products: Product[];
}

const SAFETY_STYLE = {
  blocked: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200',
  caution:
    'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200',
  safe: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200',
} as const;

const SAFETY_LABEL = {
  blocked: 'برای تو توصیه نمی‌شود',
  caution: 'با احتیاط',
  safe: 'مناسب تو',
} as const;

/**
 * ترکیبات و تداخل‌سنج.
 *
 * دو تغییر مهم:
 *  ۱) تداخل بر اساس شناسه محاسبه می‌شود نه includes() روی متن نام.
 *  ۲) وضعیت ایمنی هر ترکیب برای این کاربر خاص (بارداری، شیردهی، دارو،
 *     حساسیت) نمایش داده می‌شود. نسخه ۱ فیلدهای ایمنی را داشت ولی هرگز استفاده نمی‌کرد.
 */
export const SkinLab: React.FC<SkinLabProps> = ({ initialTab = 'ingredients', userState }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [firstId, setFirstId] = useState('ing_retinol');
  const [secondId, setSecondId] = useState('ing_salicylic_acid');
  const [conditionSearch, setConditionSearch] = useState('');

  const medications = useMemo(() => LocalDB.getMedications(), []);

  const filtered = INGREDIENTS_DATABASE.filter((ingredient) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return ingredient.name.toLowerCase().includes(needle) || ingredient.nameFa.includes(search.trim());
  });

  const filteredConditions = SKIN_CONDITIONS_DATABASE.filter((condition) => {
    const needle = conditionSearch.trim();
    if (!needle) return true;
    return (
      condition.nameFa.includes(needle) ||
      condition.summaryFa.includes(needle) ||
      condition.symptomsFa.some((symptom) => symptom.includes(needle))
    );
  });

  const first = INGREDIENTS_DATABASE.find((item) => item.id === firstId);
  const second = INGREDIENTS_DATABASE.find((item) => item.id === secondId);
  const pairResult = first && second ? checkPairConflict(first, second) : null;

  return (
    <div className="pb-28 px-4 max-w-lg mx-auto space-y-4">
      <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1">
        {(
          [
            { key: 'ingredients' as const, labelFa: `ترکیبات (${toPersianDigits(INGREDIENTS_DATABASE.length)})` },
            { key: 'conflicts' as const, labelFa: 'تداخل‌سنج' },
            { key: 'conditions' as const, labelFa: `عوارض (${toPersianDigits(SKIN_CONDITIONS_DATABASE.length)})` },
          ]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-900 text-[#8e5241] dark:text-rose-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {tab.labelFa}
          </button>
        ))}
      </div>

      {/* ------------------------- ترکیبات ------------------------- */}
      {activeTab === 'ingredients' && (
        <div className="space-y-3">
          <div className="relative">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجوی ترکیب"
              className="w-full py-3 pr-11 pl-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 text-sm font-bold"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>

          {filtered.map((ingredient) => {
            const verdict = evaluateIngredientSafety(ingredient, userState.profile, medications);
            return (
              <button
                key={ingredient.id}
                onClick={() => setSelected(ingredient)}
                className="w-full p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 text-right space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  {ingredient.imageUrl && <img src={ingredient.imageUrl} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0" loading="lazy" />}
                  <div className="min-w-0">
                    <h4 className="font-black text-sm text-slate-800 dark:text-white">{ingredient.nameFa}</h4>
                    <p className="text-xs text-slate-400">{ingredient.name}</p>
                  </div>

                  {/* برچسب ایمنی مخصوص این کاربر */}
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${SAFETY_STYLE[verdict.level]}`}
                  >
                    {SAFETY_LABEL[verdict.level]}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">{ingredient.descriptionFa}</p><p className="text-xs text-slate-500 dark:text-slate-500 leading-6"><strong>یعنی:</strong> {ingredient.id === 'ing_retinol' ? 'کمک به نوسازی پوست، مثل یک برنامه تمرینی آرام برای سلول‌های پوست.' : ingredient.id === 'ing_hyaluronic_acid' ? 'آب‌رسانی، مثل یک اسفنج کوچک که رطوبت را نگه می‌دارد.' : ingredient.id === 'ing_niacinamide' ? 'کمک به آرام‌تر شدن چربی و ظاهر منافذ پوست.' : 'یک ماده مراقبتی که برای هدف مشخصی در محصول استفاده شده است.'}</p>

                {verdict.reasonsFa.length > 0 && (
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{verdict.reasonsFa[0]}</p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ------------------------- تداخل‌سنج ------------------------- */}
      {activeTab === 'conflicts' && (
        <div className="space-y-3">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-3">
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-rose-500" />
              می‌توانم این دو را با هم بزنم؟
            </h3>

            {[
              { value: firstId, set: setFirstId, labelFa: 'ترکیب اول' },
              { value: secondId, set: setSecondId, labelFa: 'ترکیب دوم' },
            ].map((slot) => (
              <div key={slot.labelFa}>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {slot.labelFa}
                </label>
                <select
                  value={slot.value}
                  onChange={(event) => slot.set(event.target.value)}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                >
                  {INGREDIENTS_DATABASE.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.nameFa}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {pairResult && (
            <div
              className={`p-4 rounded-3xl border space-y-2 ${
                pairResult.conflict ? SAFETY_STYLE.blocked : SAFETY_STYLE.safe
              }`}
            >
              <h4 className="font-black text-sm flex items-center gap-1.5">
                {pairResult.conflict ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    تداخل دارند
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    مشکلی ندارند
                  </>
                )}
              </h4>
              <p className="text-sm leading-relaxed">{pairResult.reasonFa}</p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------- عوارض ------------------------- */}
      {activeTab === 'conditions' && (
        <div className="space-y-3">
          <div className="relative">
            <input
              value={conditionSearch}
              onChange={(event) => setConditionSearch(event.target.value)}
              placeholder="جستجو در عوارض پوستی"
              className="w-full py-3 pr-11 pl-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 text-sm font-bold"
            />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>

          {filteredConditions.map((condition) => (
            <details
              key={condition.id}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800"
            >
              <summary className="font-black text-sm text-slate-800 dark:text-white cursor-pointer">
                {condition.nameFa}
              </summary>

              <div className="pt-3 space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{condition.descriptionFa}</p>

                {condition.symptomsFa.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">علائم</span>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 pr-4 list-disc leading-relaxed">
                      {condition.symptomsFa.map((symptom, index) => (
                        <li key={index}>{symptom}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {condition.recommendedHabitsFa.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">عادت‌های مفید</span>
                    <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 pr-4 list-disc leading-relaxed">
                      {condition.recommendedHabitsFa.map((habit, index) => (
                        <li key={index}>{habit}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {condition.needsDoctorFa ||
                      'اگر علامت‌ها شدید یا ماندگار هستند، به متخصص پوست مراجعه کن. رزا تشخیص نمی‌دهد.'}
                  </span>
                </p>
              </div>
            </details>
          ))}
        </div>
      )}

      {/* جزئیات ترکیب */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-black text-base text-slate-800 dark:text-white">{selected.nameFa}</h3>
                <p className="text-xs text-slate-400">{selected.name}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="بستن"
                className="icon-only p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const verdict = evaluateIngredientSafety(selected, userState.profile, medications);
              if (verdict.reasonsFa.length === 0) return null;
              return (
                <div className={`p-3.5 rounded-2xl border space-y-1 ${SAFETY_STYLE[verdict.level]}`}>
                  <span className="text-sm font-black block">{SAFETY_LABEL[verdict.level]}</span>
                  {verdict.reasonsFa.map((reason, index) => (
                    <p key={index} className="text-sm leading-relaxed">
                      {reason}
                    </p>
                  ))}
                </div>
              );
            })()}

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{selected.descriptionFa}</p>

            <div className="space-y-1">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">فواید</span>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 pr-4 list-disc leading-relaxed">
                {selected.benefitsFa.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>

            {selected.avoidCombiningIds.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-black text-rose-700 dark:text-rose-400">با این‌ها همزمان نزن</span>
                <div className="flex flex-wrap gap-1.5">
                  {selected.avoidCombiningIds.map((id) => (
                    <span
                      key={id}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-bold"
                    >
                      {INGREDIENTS_DATABASE.find((item) => item.id === id)?.nameFa || id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selected.sideEffectsFa && (
              <p className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                {selected.sideEffectsFa}
              </p>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              زمان مصرف:{' '}
              {selected.usageTime === 'morning' ? 'صبح' : selected.usageTime === 'night' ? 'شب' : 'صبح و شب'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
