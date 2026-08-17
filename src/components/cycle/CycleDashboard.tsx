import React, { useEffect, useMemo, useState } from 'react';
import { Droplet, Check, TrendingUp, Trash2, Info, Sparkles, Activity } from 'lucide-react';
import { CycleSymptom, MenstrualCycleConfig, MenstrualPhase, SymptomKey, UserState } from '../../types';
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

interface CycleDashboardProps {
  userState: UserState;
  onUpdateCycleConfig: (config: MenstrualCycleConfig) => void;
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

const PHASE_GUIDE: Record<MenstrualPhase, { titleFa: string; skinFa: string; doFa: string[]; avoidFa: string[] }> = {
  menstrual: {
    titleFa: 'قاعدگی',
    skinFa: 'سد دفاعی حساس‌تر و رطوبت کمتر. احتمال التهاب بیشتر.',
    doFa: ['شوینده ملایم', 'سرامید و پانتنول', 'سیکا برای تسکین'],
    avoidFa: ['لایه‌بردار قوی', 'پیلینگ و لیزر', 'رتینول با دوز بالا'],
  },
  follicular: {
    titleFa: 'فولیکولار',
    skinFa: 'معمولاً مقاوم‌ترین بخش ماه.',
    doFa: ['ویتامین C', 'لایه‌برداری ملایم', 'بهترین زمان لیزر و فیشیال'],
    avoidFa: [],
  },
  ovulation: {
    titleFa: 'تخمک‌گذاری',
    skinFa: 'ترشح چربی رو به افزایش است.',
    doFa: ['نیاسینامید', 'مرطوب‌کننده سبک'],
    avoidFa: ['کرم‌های سنگین و چرب'],
  },
  luteal: {
    titleFa: 'لوتئال',
    skinFa: 'منافذ مستعد انسداد و جوش هورمونی.',
    doFa: ['نیاسینامید', 'آزلائیک اسید', 'سالیسیلیک اسید ملایم'],
    avoidFa: ['کرم کومدون‌زا', 'دستکاری جوش', 'نوبت لیزر و اپیلاسیون'],
  },
};

/**
 * بخش چرخه.
 *
 * کار ویژه این بخش (وجه تمایز اپ): بعد از دو چرخه ثبت، به جای متن
 * عمومی مقالات، الگوی واقعی خود کاربر را نشان می‌دهد:
 * «جوش‌های تو معمولاً از روز ۲۳ شروع و روز ۲۷ به اوج می‌رسند».
 * این تنها چیزی است که کاربر جای دیگری تولید نمی‌شود.
 */
export const CycleDashboard: React.FC<CycleDashboardProps> = ({ userState, onUpdateCycleConfig }) => {
  const [refresh, setRefresh] = useState(0);
  const bump = () => setRefresh((value) => value + 1);
  const todayIso = getTodayIsoDate();

  const periodLogs = useMemo(() => LocalDB.getPeriodLogs(), [refresh]);
  const symptoms = useMemo(() => LocalDB.getCycleSymptoms(), [refresh]);
  const state = useMemo(
    () => computeCycleState(userState.cycleConfig, periodLogs, todayIso),
    [userState.cycleConfig, periodLogs, todayIso],
  );
  const openPeriod = useMemo(() => getOpenPeriod(), [refresh]);

  const [selectedPhase, setSelectedPhase] = useState<MenstrualPhase>(state.phase || 'follicular');
  const [selectedDay, setSelectedDay] = useState(state.cycleDay || 1);
  useEffect(() => { if (state.cycleDay !== null) setSelectedDay(state.cycleDay); }, [state.cycleDay]);
  const [manualDate, setManualDate] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false);

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

  return (
    <div className="pb-28 px-4 max-w-lg mx-auto space-y-4">
      {/* چرخ فازها */}
      {state.available && state.cycleDay !== null && (
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
            onEditPeriod={() => setShowManual(true)}
          />
        </div>
      )}

      {/* مودال ویرایش پریود — فقط یک تقویم شمسی و یک دکمه‌ی ثبت */}
      {showManual && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          onClick={() => setShowManual(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-4 space-y-3 text-right shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-sm font-black text-slate-800 dark:text-white">روز شروع پریود را انتخاب کن</h3>
            <JalaliDatePicker value={manualDate} onChange={setManualDate} allowFuture={false} inline />
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
        </div>
      )}

      {/* راهنمای فاز */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-3">
        <h3 className="text-sm font-black text-slate-800 dark:text-white">فاز {phaseGuide.titleFa}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{phaseGuide.skinFa}</p>

        {phaseGuide.doFa.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">مناسب این فاز</span>
            <div className="flex flex-wrap gap-1.5">
              {phaseGuide.doFa.map((item) => (
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

        {phaseGuide.avoidFa.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-black text-rose-700 dark:text-rose-400">بهتر است پرهیز کنی</span>
            <div className="flex flex-wrap gap-1.5">
              {phaseGuide.avoidFa.map((item) => (
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

      {/* ثبت علائم — نسخه ۱ از ۱۰ فیلد فقط ۳ اسلایدر داشت */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-rose-500" />
          علائم امروز
        </h3>

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
            <span>چند روز قبل، علامت‌ها شروع می‌شوند؟</span>
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
