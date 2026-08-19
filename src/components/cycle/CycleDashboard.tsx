import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Droplet, Check, TrendingUp, Trash2, Info, Sparkles, Activity, ChevronDown, X, HeartPulse } from 'lucide-react';
import { CycleSymptom, MenstrualCycleConfig, MenstrualPhase, SkinProfile, SymptomKey, UserState } from '../../types';
import { LocalDB } from '../../services/db';
import {
  buildPersonalPattern,
  computeCycleState,
  describePattern,
  getOpenPeriod,
  logPeriodEnd,
  logPeriodStart,
} from '../../services/cycle/cycleService';
import { CycleWheel } from './CycleWheel';
import { JalaliDatePicker } from '../common/JalaliDatePicker';
import { EmptyState } from '../common/EmptyState';
import { formatJalaliDate, formatJalaliDayMonth, getTodayIsoDate, toPersianDigits } from '../../services/jalali';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { PHASE_INGREDIENTS } from '../../services/cycle/cycleService';
import { ingredientNamesFa } from '../../services/recommendationEngine';

interface CycleDashboardProps {
  userState: UserState;
  onUpdateCycleConfig: (config: MenstrualCycleConfig) => void;
  /** برای پایان‌دادن به حالت بارداری وقتی پریود دوباره شروع شده. */
  onUpdateProfile: (profile: SkinProfile) => void;
}

const SYMPTOMS: { key: SymptomKey; labelFa: string; scale: boolean }[] = [
  { key: 'acne', labelFa: 'جوش', scale: true },
  { key: 'oiliness', labelFa: 'چربی پوست', scale: true },
  { key: 'dryness', labelFa: 'خشکی', scale: true },
  { key: 'sensitivity', labelFa: 'حساسیت و سوزش', scale: true },
  { key: 'pain', labelFa: 'درد', scale: true },
  { key: 'bloating', labelFa: 'نفخ', scale: false },
  { key: 'headache', labelFa: 'سردرد', scale: false },
  { key: 'lowMood', labelFa: 'خلق پایین', scale: false },
  { key: 'irritability', labelFa: 'زود عصبانی شدن', scale: false },
  { key: 'fatigue', labelFa: 'خستگی', scale: false },
  { key: 'cravings', labelFa: 'هوس غذایی', scale: false },
  { key: 'badSleep', labelFa: 'خواب بد', scale: false },
];

/**
 * توضیح کلی هر فاز + چند نکته‌ی رویه‌ای (نه ترکیب) که به شناسه ترکیب ربطی
 * ندارد. خودِ فهرست ترکیبات پیشنهادی/پرهیزی از PHASE_INGREDIENTS ساخته
 * می‌شود — همان جدولی که کارت «ترکیبات امروز» در خانه هم از آن می‌خواند —
 * تا این دو کارت هرگز با هم ناهم‌خوان نشوند.
 */
const PHASE_GUIDE: Record<MenstrualPhase, { titleFa: string; skinFa: string; extraDoFa: string[]; extraAvoidFa: string[] }> = {
  menstrual: {
    titleFa: 'قاعدگی',
    skinFa: 'سد دفاعی حساس‌تر و رطوبت کمتر. احتمال التهاب بیشتر.',
    extraDoFa: ['شوینده ملایم'],
    extraAvoidFa: ['پیلینگ و لیزر'],
  },
  follicular: {
    titleFa: 'فولیکولار',
    skinFa: 'معمولاً مقاوم‌ترین بخش ماه.',
    extraDoFa: ['لایه‌برداری ملایم', 'بهترین زمان لیزر و فیشیال'],
    extraAvoidFa: [],
  },
  ovulation: {
    titleFa: 'تخمک‌گذاری',
    skinFa: 'ترشح چربی رو به افزایش است.',
    extraDoFa: ['مرطوب‌کننده سبک'],
    extraAvoidFa: ['کرم‌های سنگین و چرب'],
  },
  luteal: {
    titleFa: 'لوتئال',
    skinFa: 'منافذ مستعد انسداد و جوش هورمونی.',
    extraDoFa: [],
    extraAvoidFa: ['کرم کومدون‌زا', 'دستکاری جوش', 'نوبت لیزر و اپیلاسیون'],
  },
};

/** فهرست نهایی do/avoid یک فاز: نام ترکیبات (از همان منبع کارت خانه) + نکات رویه‌ای فاز. */
function buildPhaseLists(phase: MenstrualPhase) {
  const ingredients = PHASE_INGREDIENTS[phase];
  const guide = PHASE_GUIDE[phase];
  return {
    doFa: [...ingredientNamesFa(ingredients.recommendedIds), ...guide.extraDoFa],
    avoidFa: [...ingredientNamesFa(ingredients.avoidIds), ...guide.extraAvoidFa],
  };
}

/**
 * بخش چرخه.
 *
 * کار ویژه این بخش (وجه تمایز اپ): بعد از دو چرخه ثبت، به جای متن
 * عمومی مقالات، الگوی واقعی خود کاربر را نشان می‌دهد:
 * «جوش‌های تو معمولاً از روز ۲۳ شروع و روز ۲۷ به اوج می‌رسند».
 * این تنها چیزی است که کاربر جای دیگری تولید نمی‌شود.
 */
export const CycleDashboard: React.FC<CycleDashboardProps> = ({ userState, onUpdateCycleConfig, onUpdateProfile }) => {
  const [refresh, setRefresh] = useState(0);
  const bump = () => setRefresh((value) => value + 1);
  const todayIso = getTodayIsoDate();

  /* ------------------------- حالت بارداری ------------------------- */
  // وقتی «باردار هستم» در پروفایل روشن است، کل بخش چرخه غیرفعال می‌شود
  // و به‌جایش همین کارت دیده می‌شود — چون پیش‌بینی پریود در بارداری
  // بی‌معنی است. تنها راه خروج از این حالت، ثبت شروع دوباره پریود از
  // همین‌جاست؛ همان لحظه هم isPregnant خاموش می‌شود و هم یک رکورد پریود
  // تازه ثبت می‌شود تا تقویم چرخه بلافاصله برگردد.
  const [restartDate, setRestartDate] = useState(getTodayIsoDate());
  const [showRestart, setShowRestart] = useState(false);

  if (userState.profile.isPregnant) {
    const confirmRestart = () => {
      logPeriodStart(restartDate);
      onUpdateProfile({ ...userState.profile, isPregnant: false });
      setShowRestart(false);
    };

    return (
      <div className="pb-[calc(var(--safe-bottom)+7rem)] px-4 max-w-lg mx-auto space-y-4">
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-amber-900 dark:text-amber-100">وضعیت بارداری فعاله</h3>
          <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
            تا وقتی این گزینه در پروفایل روشن است، ردیابی چرخه، پیش‌بینی پریود و فاز ماهانه نمایش داده نمی‌شوند.
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-3">
          <h4 className="text-sm font-black text-slate-800 dark:text-white">پریودت دوباره شروع شده؟</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            اگه پریودت دوباره شروع شده، اینجا ثبتش کن تا تقویم پریود به اکانتت برگرده و دوباره حواسمون به چرخه‌ات باشه.
          </p>

          {!showRestart ? (
            <button
              onClick={() => setShowRestart(true)}
              className="w-full py-3 rounded-2xl bg-[#8e5241] hover:bg-[#784334] text-white text-sm font-bold flex items-center justify-center gap-1.5"
            >
              <Droplet className="w-4 h-4" />
              پریودم شروع شده
            </button>
          ) : (
            <div className="space-y-3">
              <JalaliDatePicker labelFa="روز اول پریود" value={restartDate} onChange={setRestartDate} allowFuture={false} inline />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowRestart(false)}
                  className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmRestart}
                  className="py-3 rounded-2xl bg-rose-500 text-white text-sm font-bold"
                >
                  ثبت و برگشت به ردیابی
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const periodLogs = useMemo(() => LocalDB.getPeriodLogs(), [refresh]);
  const symptoms = useMemo(() => LocalDB.getCycleSymptoms(), [refresh]);
  const state = useMemo(
    () => computeCycleState(userState.cycleConfig, periodLogs, todayIso),
    [userState.cycleConfig, periodLogs, todayIso],
  );
  const openPeriod = useMemo(() => getOpenPeriod(), [refresh]);

  const [selectedPhase, setSelectedPhase] = useState<MenstrualPhase>(state.phase || 'follicular');
  const [selectedDay, setSelectedDay] = useState(state.cycleDay || 1);
  // باگ قبلی: با ویرایش تاریخ شروع پریود (مثلاً تصحیح از ۲۰ مرداد به ۱۰
  // مرداد)، «روز» انتخاب‌شده روی چرخ به‌درستی به‌روز می‌شد ولی «فاز»
  // انتخاب‌شده (که راهنما/توصیه‌های زیر چرخ از رویش خوانده می‌شوند)
  // فقط یک‌بار در mount مقداردهی شده بود و دیگر با state.phase هم‌گام
  // نمی‌شد. نتیجه: بعد از ویرایش، روز روی چرخ درست نشان داده می‌شد ولی
  // توصیه‌ها هنوز مال فاز قدیمی (مثلاً «قاعدگی») بودند نه فاز واقعی روز
  // جدید (مثلاً «تخمک‌گذاری»). هر دو باید با تغییر state هم‌گام شوند.
  useEffect(() => {
    if (state.cycleDay !== null) setSelectedDay(state.cycleDay);
    if (state.phase !== null) setSelectedPhase(state.phase);
  }, [state.cycleDay, state.phase]);
  const [manualDate, setManualDate] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);
  // به‌طور پیش‌فرض بسته است؛ کاربر با یک لمس روی هدر بازش می‌کند
  const [symptomsOpen, setSymptomsOpen] = useState(false);
  // راهنمای «این ثبت‌ها فقط روی همین گوشی می‌مانند...» فقط تا وقتی کاربر
  // آن را نخوانده و نبسته نشان داده می‌شود؛ بعد از بستن، دیگر برنمی‌گردد
  // و جای خودش را کامل آزاد می‌کند (رندر نمی‌شود، نه فقط مخفی).
  const [showSymptomInfo, setShowSymptomInfo] = useState(
    () => localStorage.getItem('roza_symptom_info_dismissed_v1') !== '1',
  );
  const dismissSymptomInfo = () => {
    localStorage.setItem('roza_symptom_info_dismissed_v1', '1');
    setShowSymptomInfo(false);
  };
  const [editCycleLength, setEditCycleLength] = useState(userState.cycleConfig.cycleLength || 28);
  const [editPeriodLength, setEditPeriodLength] = useState(userState.cycleConfig.periodLength || 5);

  /** باز کردن مودال ویرایش، همراه با تاریخ و طول چرخه‌ی فعلی — نه فرم خالی. */
  const openEditPeriod = () => {
    setManualDate(periodLogs[0]?.startIso || todayIso);
    setEditCycleLength(userState.cycleConfig.cycleLength || 28);
    setEditPeriodLength(userState.cycleConfig.periodLength || 5);
    setShowManual(true);
  };

  /* ------------------------- ثبت علائم امروز ------------------------- */
  const existingToday = symptoms.find((item) => item.date === todayIso);
  const [draft, setDraft] = useState<Partial<Record<SymptomKey, number>>>(existingToday?.scores || {});
  const [saved, setSaved] = useState(false);

  const saveSymptoms = () => {
    const entry: CycleSymptom = {
      date: todayIso,
      scores: draft,
      updatedAt: new Date().toISOString(),
    };
    LocalDB.saveCycleSymptom(entry);
    setSaved(true);
    bump();
    setTimeout(() => setSaved(false), 2500);
  };

  /* ------------------------- الگوی شخصی ------------------------- */
  const acnePattern = useMemo(() => buildPersonalPattern('acne', periodLogs, symptoms), [periodLogs, symptoms]);
  const painPattern = useMemo(() => buildPersonalPattern('pain', periodLogs, symptoms), [periodLogs, symptoms]);
  const acneSentence = describePattern(acnePattern, 'جوش');
  const painSentence = describePattern(painPattern, 'درد');
  const maxBucket = Math.max(1, ...(acnePattern?.buckets || []).map((bucket) => bucket.average));

  const phaseGuide = PHASE_GUIDE[selectedPhase];
  const phaseLists = buildPhaseLists(selectedPhase);

  return (
    <div className="pb-[calc(var(--safe-bottom)+7rem)] px-4 max-w-lg mx-auto space-y-4">
      {/* چرخ فازها */}
      {state.available && state.cycleDay !== null ? (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-3 text-center">
          <CycleWheel
            currentDay={state.cycleDay}
            cycleLength={state.cycleLength}
            periodLength={state.stats.averagePeriodLength || userState.cycleConfig.periodLength}
            pmsStartDaysBefore={userState.cycleConfig.pmsStartDaysBefore}
            todayIso={todayIso}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onSelectPhase={setSelectedPhase}
            onEditPeriod={openEditPeriod}
          />
        </div>
      ) : (
        // اگر ردیابی چرخه بعداً از تنطیمات فعال شده و هنوز هیچ پریودی ثبت
        // نشده، چرخ فازها (که تنها راه باز کردن فرم ثبت پریود بود) اصلاً
        // رندر نمی‌شود و کاربر هیچ راهی برای شروع ندارد. این کارت همیشه
        // یک راه ورودی مستقل به همان فرم می‌دهد.
        <EmptyState
          icon={Droplet}
          titleFa="هنوز پریودی ثبت نشده"
          descriptionFa="روز اول آخرین پریودت را ثبت کن تا رزا بتواند فاز چرخه و روزهای مناسب لیزر یا فیشیال را نشان بدهد."
          actionLabelFa="ثبت اولین پریود"
          onAction={openEditPeriod}
        />
      )}

      {/* مودال ویرایش پریود — طول چرخه، مدت خونریزی و تاریخ شروع، هر سه با هم قابل تصحیح */}
      {/* با createPortal مستقیم به document.body می‌رود؛ وگرنه وقتی این کامپوننت از منو
          (به‌صورت Section، داخل کانتینر fixed z-20) باز شده، مودال با وجود z-50 داخل همان
          stacking context گیر می‌افتد و زیر هدر/نوبار پایین (که بیرون از آن کانتینرند) دیده می‌شود. */}
      {showManual && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          onClick={() => setShowManual(false)}
        >
          <div
            className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 p-4 space-y-4 text-right shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-sm font-black text-slate-800 dark:text-white">ویرایش پریود</h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>طول چرخه شما</span>
                  <span className="text-rose-600">{toPersianDigits(editCycleLength)} روز</span>
                </div>
                <input
                  type="range"
                  min="21"
                  max="45"
                  value={editCycleLength}
                  onChange={(event) => setEditCycleLength(parseInt(event.target.value, 10))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                  <span>مدت زمان خونریزی</span>
                  <span className="text-rose-600">{toPersianDigits(editPeriodLength)} روز</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={editPeriodLength}
                  onChange={(event) => setEditPeriodLength(parseInt(event.target.value, 10))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-sm font-black text-slate-800 dark:text-white">روز اول پریود را انتخاب کن</h4>
              <JalaliDatePicker value={manualDate} onChange={setManualDate} allowFuture={false} inline />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setShowManual(false)}
                className="py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  if (manualDate) {
                    onUpdateCycleConfig({
                      ...userState.cycleConfig,
                      cycleLength: editCycleLength,
                      periodLength: editPeriodLength,
                    });
                    logPeriodStart(manualDate);
                    setManualDate('');
                    setShowManual(false);
                    bump();
                  }
                }}
                disabled={!manualDate}
                className="py-3 rounded-2xl bg-rose-500 disabled:opacity-40 text-white text-sm font-bold"
              >
                ثبت
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* راهنمای فاز */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-black text-slate-800 dark:text-white">فاز {phaseGuide.titleFa}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{phaseGuide.skinFa}</p>

        {phaseLists.doFa.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">مناسب این فاز</span>
            <div className="flex flex-wrap gap-1.5">
              {phaseLists.doFa.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {phaseLists.avoidFa.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-black text-rose-700 dark:text-rose-400">بهتر است پرهیز کنی</span>
            <div className="flex flex-wrap gap-1.5">
              {phaseLists.avoidFa.map((item) => (
                <span
                  key={item}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-bold"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 dark:text-slate-500 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>این محتوا آموزشی است و جای پزشک را نمی‌گیرد.</span>
        </p>
      </div>

      {/* الگوی شخصی */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 overflow-hidden">
        <button onClick={() => setPatternOpen((value) => !value)} className="w-full p-4 flex items-center justify-between text-right">
          <span className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-purple-600" />الگوی شخصی تو</span><span className={`text-slate-400 transition-transform ${patternOpen ? 'rotate-180' : ''}`}>⌄</span>
        </button>
        {patternOpen && <div className="p-4 pt-0 space-y-3">
        {acneSentence || painSentence ? (
          <>
            {acneSentence && (
              <p className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-sm text-purple-900 dark:text-purple-200 leading-relaxed">
                {acneSentence}
                {acnePattern?.riseDay ? ` از روز ${toPersianDigits(Math.max(1, acnePattern.riseDay - 2))} روتین پیشگیرانه را شروع کن.` : ''}
              </p>
            )}

            {painSentence && (
              <p className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-sm text-rose-900 dark:text-rose-200 leading-relaxed">
                {painSentence}
              </p>
            )}

            {/* نمودار از داده واقعی کاربر، نه منحنی ریاضی تزئینی */}
            {acnePattern && acnePattern.buckets.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">شدت جوش در طول چرخه</span>
                <div className="flex items-end gap-1 h-24">
                  {acnePattern.buckets.map((bucket) => (
                    <div
                      key={bucket.fromDay}
                      title={`روز ${bucket.fromDay} تا ${bucket.toDay} — میانگین ${bucket.average}`}
                      className="flex-1 flex flex-col items-center justify-end gap-1"
                    >
                      <div
                        className={`w-full rounded-t-lg ${bucket.samples > 0 ? 'bg-purple-500' : 'bg-slate-100 dark:bg-slate-800'}`}
                        style={{ height: `${Math.max(4, (bucket.average / maxBucket) * 100)}%` }}
                      />
                      <span className="text-xs text-slate-400">{toPersianDigits(bucket.fromDay)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={Sparkles}
            titleFa="رزا دارد الگوی تو را یاد می‌گیرد"
            descriptionFa="وقتی دو چرخه علائمت را ثبت کنی، می‌توانیم بگوییم جوش‌های تو دقیقاً از کدام روز شروع می‌شوند و از کدام روز باید پیشگیری را شروع کنی."
            progress={{
              current: acnePattern?.cyclesCovered || 0,
              required: 2,
              unitFa: 'چرخه داده‌دار',
            }}
          />
        )}
      </div>}
      </div>

      {/* ثبت علائم — به‌شکل آکاردئونی: هدر همیشه دیده می‌شود، فیلدها با یک لمس باز/بسته می‌شوند */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setSymptomsOpen((value) => !value)}
          className="w-full p-4 flex items-center justify-between gap-2 text-right"
        >
          <span className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-rose-500" />
            علائم امروز
            {existingToday && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">ثبت شده</span>}
          </span>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${symptomsOpen ? 'rotate-180' : ''}`} />
        </button>

        {symptomsOpen && (
          <div className="px-4 pb-4 space-y-4">
            {showSymptomInfo && (
              <p className="p-3 rounded-2xl bg-[#fdf3ee] dark:bg-slate-800 text-xs leading-6 text-[#8e5241] dark:text-rose-200 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">این ثبت‌ها فقط روی همین گوشی می‌مانند. بعد از چند چرخه، رزا از همین‌ها الگوی شخصی تو را می‌سازد — مثلاً اینکه جوش یا درد تو معمولاً از کدام روز چرخه شروع می‌شود (پایین همین صفحه) — و به هیچ سروری فرستاده نمی‌شوند.</span>
                <button
                  type="button"
                  onClick={dismissSymptomInfo}
                  aria-label="بستن این راهنما"
                  className="icon-only p-1 -m-1 rounded-lg text-[#8e5241] dark:text-rose-200 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </p>
            )}

            <div className="space-y-3">
              {SYMPTOMS.filter((item) => item.scale).map((item) => (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                    <span>{item.labelFa}</span>
                    <span className="text-rose-600">{toPersianDigits(draft[item.key] ?? 0)} از ۵</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={draft[item.key] ?? 0}
                    onChange={(event) => setDraft({ ...draft, [item.key]: parseInt(event.target.value, 10) })}
                    className="w-full accent-rose-500"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">امروز کدام‌ها را داشتی؟</span>
              <div className="flex flex-wrap gap-1.5">
                {SYMPTOMS.filter((item) => !item.scale).map((item) => {
                  const isOn = (draft[item.key] ?? 0) > 0;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setDraft({ ...draft, [item.key]: isOn ? 0 : 3 })}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        isOn
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {item.labelFa}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={saveSymptoms}
              className="w-full py-3 rounded-2xl bg-[#8e5241] hover:bg-[#784334] text-white text-sm font-bold flex items-center justify-center gap-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  ذخیره شد
                </>
              ) : (
                'ثبت علائم امروز'
              )}
            </button>
          </div>
        )}
      </div>

      {/* تاریخچه پریودها — نسخه ۱ اصلاً تاریخچه نداشت */}
      {periodLogs.length > 0 && (
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <h3 className="text-sm font-black text-slate-800 dark:text-white">تاریخچه پریودها</h3>

          {state.stats.averageLength !== null && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              میانگین طول چرخه: {toPersianDigits(state.stats.averageLength)} روز
              {state.stats.shortestLength !== null && state.stats.longestLength !== null
                ? ` (بین ${toPersianDigits(state.stats.shortestLength)} تا ${toPersianDigits(state.stats.longestLength)})`
                : ''}
              {state.stats.looksIrregular ? ' · چرخه‌ات نامنطم به نطر می‌رسد.' : ''}
            </p>
          )}

          {state.stats.looksIrregular && (
            <p className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              نامنطم بودن ممکن است دلایل مختلفی داشته باشد. می‌توانی گزارش همین ثبت‌ها را برای پزشک زنانت ببری. رزا تشخیص نمی‌دهد.
            </p>
          )}

          <div className="space-y-1.5">
            {periodLogs.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60"
              >
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {formatJalaliDate(log.startIso)}
                  {log.endIso ? ` تا ${formatJalaliDayMonth(log.endIso)}` : ' · در جریان'}
                </span>
                <button
                  onClick={() => {
                    LocalDB.deletePeriodLog(log.id);
                    bump();
                  }}
                  aria-label="حذف"
                  className="icon-only p-2 rounded-xl text-slate-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* تنطیمات چرخه */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-black text-slate-800 dark:text-white">تنطیمات</h3>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
            <span>چند روز قبل، علائم PMS شروع می‌شوند؟</span>
            <span className="text-rose-600">{toPersianDigits(userState.cycleConfig.pmsStartDaysBefore)} روز</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            value={userState.cycleConfig.pmsStartDaysBefore}
            onChange={(event) =>
              onUpdateCycleConfig({
                ...userState.cycleConfig,
                pmsStartDaysBefore: parseInt(event.target.value, 10),
              })
            }
            className="w-full accent-rose-500"
          />
          <p className="text-xs text-slate-400 leading-relaxed">
            یعنی از چند روز قبل از شروع پریودت، PMS (علائم پیش از قاعدگی مثل نوسان خلق، نفخ یا حساسیت پوستی) شروع می‌شود.
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            چرخه‌ام نامنطم است یا مشکوک به PCOS هستم
          </span>
          <ToggleSwitch
            checked={userState.cycleConfig.pcosFlagged}
            onChange={(value) => onUpdateCycleConfig({ ...userState.cycleConfig, pcosFlagged: value })}
            labelFa="چرخه‌ام نامنطم است یا مشکوک به PCOS هستم"
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
          با روشن بودن این گزینه، رزا پیش‌بینی را با بازه بازتر و با لحن محتاط‌تر نشان می‌دهد.
        </p>
      </div>
    </div>
  );
};
