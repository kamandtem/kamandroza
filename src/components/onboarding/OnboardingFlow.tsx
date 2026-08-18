import React, { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { ArrowLeft, Check, Moon, ShieldCheck, Sparkles, HeartPulse } from 'lucide-react';
import { motion } from 'motion/react';
import { MenstrualCycleConfig, SkinType, UserState } from '../../types';
import { LocalDB } from '../../services/db';
import { logPeriodStart } from '../../services/cycle/cycleService';
import { JalaliDatePicker } from '../common/JalaliDatePicker';
import { BirthDatePicker } from '../common/BirthDatePicker';
import { CityAutocomplete } from '../common/CityAutocomplete';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { toPersianDigits } from '../../services/jalali';

interface OnboardingFlowProps {
  onComplete: (state: UserState) => void;
}

const SKIN_TYPES: { type: SkinType; titleFa: string; hintFa: string }[] = [
  { type: 'combination', titleFa: 'مختلط', hintFa: 'پیشانی و بینی چرب، گونه‌ها نرمال یا خشک' },
  { type: 'oily', titleFa: 'چرب', hintFa: 'برق افتادن مداوم و مستعد جوش' },
  { type: 'dry', titleFa: 'خشک', hintFa: 'احساس کشیدگی و پوسته‌ریزی' },
  { type: 'sensitive', titleFa: 'حساس', hintFa: 'قرمزی و سوزش سریع با محصولات' },
  { type: 'dehydrated', titleFa: 'کم‌آب', hintFa: 'هم چرب هم خشک، خطوط ریز کم‌آبی' },
  { type: 'normal', titleFa: 'نرمال', hintFa: 'متعادل و بدون دغدغه خاص' },
];

const TOTAL_STEPS = 4;

/**
 * انبوردینگ.
 *
 * بزرگ‌ترین باگ نسخه ۱ اینجا بود: فقط تاریخ آخرین پریود پرسیده می‌شد
 * و طول چرخه، طول پریود و روزهای PMS صفر می‌ماندند. نتیجه: فاز قاعدگی
 * هرگز تشخیص داده نمی‌شد و هشدار PMS و اعلان چرخه هرگز فعال نمی‌شدند
 * — دقیقاً قابلیتی که در همین صفحه به کاربر قول داده می‌شد.
 */
export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'denied'>('idle');
  const [birthDateIso, setBirthDateIso] = useState('');
  const [skinType, setSkinType] = useState<SkinType>('normal');
  const [sensitivity, setSensitivity] = useState(5);

  const [isPregnant, setIsPregnant] = useState(false);
  const [isBreastfeeding, setIsBreastfeeding] = useState(false);

  const [cycleEnabled, setCycleEnabled] = useState(false);
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [pmsDays, setPmsDays] = useState(5);
  const [regularity, setRegularity] = useState<MenstrualCycleConfig['regularity']>('unknown');
  const [dontKnowLength, setDontKnowLength] = useState(false);

  /*
   * قبلاً مستقیم navigator.geolocation صدا زده می‌شد که داخل اپ نصب‌شده
   * (Capacitor WebView) معمولاً پرامپت دسترسی را درست نشان نمی‌دهد و این
   * دکمه در عمل هیچ‌وقت کار نمی‌کرد. با پلاگین Geolocation کپسیتور، هم
   * پرامپت بومی اندروید/iOS و هم حالت وب (برای پیش‌نمایش مرورگری) پشتیبانی
   * می‌شود.
   */
  const requestLocation = async () => {
    setLocationStatus('loading');
    try {
      const current = await Geolocation.checkPermissions();
      let granted = current.location === 'granted' || current.coarseLocation === 'granted';
      if (!granted) {
        const requested = await Geolocation.requestPermissions();
        granted = requested.location === 'granted' || requested.coarseLocation === 'granted';
      }
      if (!granted) { setLocationStatus('denied'); return; }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 86400000 });
      localStorage.setItem('roza_weather_coords_v1', JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude }));
      localStorage.setItem('roza_location_permission_requested_v1', '1');
      setLocationStatus('success');
      if (!city.trim()) setCity('موقعیت من');
    } catch {
      setLocationStatus('denied');
    }
  };

  const finish = () => {
    const current = LocalDB.getUserState();

    const state: UserState = {
      ...current,
      profile: {
        ...current.profile,
        name: name.trim() || undefined,
        city: city.trim(),
        birthDateIso: birthDateIso || undefined,
        skinType,
        sensitivityScore: sensitivity,
        isPregnant,
        isBreastfeeding,
      },
      cycleConfig: {
        ...current.cycleConfig,
        enabled: cycleEnabled,
        // مقادیر واقعی، نه صفر. اگر کاربر نمی‌داند، میانگین رایج می‌گذاریم
        // و بعد از دو چرخه، موتور خودش عدد واقعی را یاد می‌گیرد.
        cycleLength: dontKnowLength ? 28 : cycleLength,
        periodLength,
        pmsStartDaysBefore: pmsDays,
        regularity: dontKnowLength ? 'unknown' : regularity,
      },
      onboardingCompleted: true,
    };

    LocalDB.saveUserState(state);

    // تاریخ آخرین پریود به تاریخچه می‌رود، نه یک فیلد تنها.
    if (cycleEnabled && lastPeriod) logPeriodStart(lastPeriod);

    onComplete(state);
  };

  const NextButton: React.FC<{ label: string; onClick: () => void; disabled?: boolean }> = ({
    label,
    onClick,
    disabled,
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 rounded-2xl bg-[#8e5241] hover:bg-[#784334] disabled:opacity-40 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
    >
      {label}
      <ArrowLeft className="w-4 h-4" />
    </button>
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fdf1e9] via-[#faf5fb] to-[#eef4fb] dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 flex items-center justify-center p-4 overflow-hidden">
      {/* حباب‌های رنگی پس‌زمینه — بدون این‌ها افکت شیشه‌ای (glassmorphism) کارت دیده نمی‌شود */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 rounded-full bg-rose-300/40 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-amber-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-10 w-80 h-80 rounded-full bg-purple-300/30 blur-3xl" />

      <div className="relative w-full max-w-md p-6 rounded-3xl bg-white/45 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_40px_rgba(142,82,65,.18)] text-right space-y-5">
        {/* نوار پیشرفت */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                index < step ? 'bg-[#8e5241]' : 'bg-white/50 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#8e5241] to-[#ca7f6a] text-white flex items-center justify-center text-3xl font-black mx-auto shadow-lg">
              R
            </div>
            <h1 className="text-xl font-black text-[#2e2621] dark:text-white text-center">به رزا خوش آمدید</h1>
            <p className="text-sm text-[#6e5d50] dark:text-slate-400 leading-relaxed text-center">
              همراه مراقبت از پوست، مو، چرخه ماهانه و نوبت‌های آرایشگاه و پزشک، به زبان فارسی و تقویم شمسی.
            </p>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 backdrop-blur-md border border-emerald-200/70 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4" />
                حریم خصوصی
              </div>
              <p className="text-sm leading-relaxed opacity-90">
                اطلاعات پوست، چرخه، عکس‌ها و پرونده پزشکی شما روی همین گوشی می‌مانند و به هیچ سروری ارسال نمی‌شوند. تنها قابلیت اینترنتی، آب‌وهوای شهر شماست که می‌توانید خاموشش کنید.
              </p>
            </div>

            <NextButton label="شروع" onClick={() => setStep(2)} />
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-black text-[#2e2621] dark:text-white">کمی از خودت بگو</h2>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-bold text-[#5c4a3e] dark:text-slate-300 block mb-1">نام (اختیاری)</label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="مثلاً مهتاب"
                  className="w-full py-3 px-4 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 text-sm font-bold"
                />
              </div>

              <BirthDatePicker value={birthDateIso} onChange={setBirthDateIso} labelFa="تاریخ تولد" />
              <p className="text-xs text-[#8a766c] dark:text-slate-500">
                تاریخ تولد برای متناسب کردن توصیه‌های پوستی با سنت استفاده می‌شود.
              </p>

              <CityAutocomplete value={city} onChange={setCity} labelFa="شهر" />
              <p className="text-xs text-[#8a766c] dark:text-slate-500">
                شهر فقط برای آب‌وهوا و پیشنهاد محافظت از آفتاب است.
              </p>
              <button
                type="button"
                onClick={requestLocation}
                disabled={locationStatus === 'loading'}
                className="w-full rounded-2xl border border-sky-200 bg-sky-50 py-3 text-sm font-bold text-sky-700 disabled:opacity-50 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300"
              >
                {locationStatus === 'loading' ? 'در حال دریافت موقعیت...' : locationStatus === 'success' ? 'موقعیت برای آب‌وهوا ثبت شد' : 'استفاده از موقعیت دقیق من'}
              </button>
              {locationStatus === 'denied' && <p className="text-xs font-bold text-rose-600">اجازه موقعیت داده نشد. می‌توانی شهر را دستی وارد کنی.</p>}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-5 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md text-[#5c4a3e] dark:text-slate-300 font-bold text-sm"
              >
                قبلی
              </button>
              <div className="flex-1">
                <NextButton label="بعدی" onClick={() => setStep(3)} />
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-black text-[#2e2621] dark:text-white">پوستت را بشناسیم</h2>

            <div className="space-y-2">
              {SKIN_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSkinType(item.type)}
                  className={`w-full p-3.5 rounded-2xl text-right border transition-all ${
                    skinType === item.type
                      ? 'bg-[#8e5241] text-white border-[#8e5241]'
                      : 'bg-white/40 dark:bg-slate-800/50 backdrop-blur-md text-[#5c4a3e] dark:text-slate-300 border-white/60 dark:border-slate-700/60'
                  }`}
                >
                  <span className="block text-sm font-black">{item.titleFa}</span>
                  <span className={`block text-xs mt-0.5 ${skinType === item.type ? 'text-rose-100' : 'opacity-70'}`}>
                    {item.hintFa}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60 space-y-2">
              <div className="flex justify-between text-sm font-bold text-[#5c4a3e] dark:text-slate-300">
                <span>پوستت چقدر حساس است؟</span>
                <span className="text-rose-600">{toPersianDigits(sensitivity)} از ۱۰</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sensitivity}
                onChange={(event) => setSensitivity(parseInt(event.target.value, 10))}
                className="w-full accent-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-5 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md text-[#5c4a3e] dark:text-slate-300 font-bold text-sm"
              >
                قبلی
              </button>
              <div className="flex-1">
                <NextButton label="بعدی" onClick={() => setStep(4)} />
              </div>
            </div>
          </motion.div>
        )}

        {/* مرحله ایمنی — نسخه ۱ اصلاً این را نمی‌پرسید */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-black text-[#2e2621] dark:text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-rose-500" />
              دو سؤال کوتاه برای پیشنهاد امن‌تر
            </h2>
            <p className="text-sm text-[#705c4f] dark:text-slate-400 leading-relaxed">
              بعضی ترکیبات مانند رتینول در بارداری و شیردهی توصیه نمی‌شوند. پاسخ‌ها فقط روی گوشی خودت می‌مانند.
            </p>

            <div className="space-y-2">
              {[
                { value: isPregnant, set: setIsPregnant, labelFa: 'باردار هستم' },
                { value: isBreastfeeding, set: setIsBreastfeeding, labelFa: 'در دوران شیردهی هستم' },
              ].map((item) => (
                <div
                  key={item.labelFa}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60"
                >
                  <span className="text-sm font-bold text-[#3a2f27] dark:text-slate-200">{item.labelFa}</span>
                  <ToggleSwitch checked={item.value} onChange={item.set} labelFa={item.labelFa} />
                </div>
              ))}
            </div>

            {(isPregnant || isBreastfeeding) && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                روتین تو بر این اساس تنطیم می‌شود و ترکیبات نامناسب حذف می‌شوند. با این حال، رزا جای پزشک را نمی‌گیرد.
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(3)}
                className="py-3 px-5 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md text-[#5c4a3e] dark:text-slate-300 font-bold text-sm"
              >
                قبلی
              </button>
              <div className="flex-1">
                <NextButton label="بعدی" onClick={() => setStep(5)} />
              </div>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-black text-[#2e2621] dark:text-white flex items-center gap-2">
              <Moon className="w-5 h-5 text-rose-500" />
              چرخه ماهانه
            </h2>
            <p className="text-sm text-[#705c4f] dark:text-slate-400 leading-relaxed">
              این بخش کاملاً اختیاری است. اگر فعالش کنی، رزا می‌تواند الگوی پوستت را در طول چرخه پیدا کند و بگوید روزهای مناسب لیزر و فیشیال کدامند.
            </p>

            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 backdrop-blur-md border border-rose-200/60 dark:border-rose-900/40">
              <span className="text-sm font-black text-[#3a2f27] dark:text-slate-200">ردیابی چرخه را فعال کن</span>
              <ToggleSwitch checked={cycleEnabled} onChange={setCycleEnabled} labelFa="ردیابی چرخه را فعال کن" />
            </div>

            {cycleEnabled && (
              <div className="space-y-4 p-4 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-700/60">
                <JalaliDatePicker
                  labelFa="روز اول آخرین پریود"
                  value={lastPeriod}
                  onChange={setLastPeriod}
                  allowFuture={false}
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#5c4a3e] dark:text-slate-300">طول چرخه‌ام را نمی‌دانم</span>
                  <ToggleSwitch checked={dontKnowLength} onChange={setDontKnowLength} labelFa="طول چرخه‌ام را نمی‌دانم" />
                </div>

                {dontKnowLength ? (
                  <p className="text-sm text-[#705c4f] dark:text-slate-400 leading-relaxed">
                    اشکالی ندارد. فعلاً میانگین رایج را در نطر می‌گیریم و بعد از دو بار ثبت پریود، رزا عدد واقعی خودت را یاد می‌گیرد.
                  </p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm font-bold text-[#5c4a3e] dark:text-slate-300">
                        <span>طول چرخه (فاصله دو پریود)</span>
                        <span className="text-rose-600">{toPersianDigits(cycleLength)} روز</span>
                      </div>
                      <input
                        type="range"
                        min="21"
                        max="45"
                        value={cycleLength}
                        onChange={(event) => setCycleLength(parseInt(event.target.value, 10))}
                        className="w-full accent-rose-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-[#5c4a3e] dark:text-slate-300 block mb-2">
                        چرخه‌ات منطم است؟
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          [
                            { value: 'regular', labelFa: 'منطم' },
                            { value: 'somewhat_irregular', labelFa: 'تقریباً' },
                            { value: 'irregular', labelFa: 'نامنطم' },
                          ] as const
                        ).map((item) => (
                          <button
                            key={item.value}
                            onClick={() => setRegularity(item.value)}
                            className={`py-2.5 rounded-xl text-sm font-bold border ${
                              regularity === item.value
                                ? 'bg-[#8e5241] text-white border-[#8e5241]'
                                : 'bg-white/40 dark:bg-slate-900/40 backdrop-blur-md text-[#5c4a3e] dark:text-slate-300 border-white/60 dark:border-slate-700/60'
                            }`}
                          >
                            {item.labelFa}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-bold text-[#5c4a3e] dark:text-slate-300">
                    <span>چند روز خونریزی داری؟</span>
                    <span className="text-rose-600">{toPersianDigits(periodLength)} روز</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    value={periodLength}
                    onChange={(event) => setPeriodLength(parseInt(event.target.value, 10))}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm font-bold text-[#5c4a3e] dark:text-slate-300">
                    <span>چند روز قبل، علامت‌ها شروع می‌شوند؟</span>
                    <span className="text-rose-600">{toPersianDigits(pmsDays)} روز</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    value={pmsDays}
                    onChange={(event) => setPmsDays(parseInt(event.target.value, 10))}
                    className="w-full accent-rose-500"
                  />
                  <p className="text-xs text-[#8a766c] dark:text-slate-500">
                    ملاک هشدار پیشگیرانه جوش و پیشنهاد نگذاشتن نوبت لیزر در این روزها.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStep(4)}
                className="py-3 px-5 rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md text-[#5c4a3e] dark:text-slate-300 font-bold text-sm"
              >
                قبلی
              </button>
              <button
                onClick={finish}
                disabled={cycleEnabled && !lastPeriod}
                className="flex-1 py-3.5 rounded-2xl bg-[#8e5241] hover:bg-[#784334] disabled:opacity-40 text-white font-bold text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                شروع برنامه
              </button>
            </div>

            {cycleEnabled && !lastPeriod && (
              <p className="text-xs text-rose-600 font-bold text-center">
                برای محاسبه چرخه، تاریخ آخرین پریود لازم است. یا ردیابی را خاموش کن.
              </p>
            )}

            <p className="text-xs text-[#8a766c] dark:text-slate-500 text-center flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              بعداً همه این‌ها را در پروفایل تغییر می‌دهی.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
