import React, { useState } from 'react';
import {
  User as UserIcon,
  Camera,
  Check,
  Palette,
  Bell,
  Sun,
  Moon,
  Settings,
  Lock,
  HeartPulse,
  Sparkles,
  EyeOff,
} from 'lucide-react';
import { SkinConcern, SkinType, UserState } from '../../types';
import { LocalDB } from '../../services/db';
import { clearPin, isLockConfigured, setPin } from '../../services/security/appLock';
import { isFeatureEnabled } from '../../config/appConfig';
import { toPersianDigits } from '../../services/jalali';

interface ProfileViewProps {
  userState: UserState;
  onUpdateState: (state: UserState) => void;
}

const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  dry: 'خشک',
  oily: 'چرب',
  combination: 'مختلط',
  normal: 'نرمال',
  sensitive: 'حساس',
  dehydrated: 'کم‌آب',
};

const CONCERN_LABELS: Record<SkinConcern, string> = {
  acne: 'جوش و آکنه',
  hyperpigmentation: 'لک و تیرگی',
  wrinkles: 'چروک',
  fine_lines: 'خطوط ریز',
  dryness: 'خشکی',
  oiliness: 'چربی زیاد',
  redness: 'قرمزی',
  rosacea: 'رزاسه',
  eczema: 'اگزما',
  pores: 'منافذ باز',
  texture: 'ناهمواری بافت',
  dark_circles: 'تیرگی دور چشم',
};

const PRESET_AVATARS = ['🌸', '✨', '🌿', '💧', '🌺', '☀️'];

/**
 * پروفایل و تنطیمات.
 *
 * افزوده شد: فیلدهای ایمنی (بارداری، شیردهی، رتینوئید خوراکی)،
 * قفل PIN، کنترل دیده شدن بخش چرخه و متن خنطی اعلان‌ها.
 * حذف شد: XP و سطح که هیچ منطقی نداشتند.
 */
export const ProfileView: React.FC<ProfileViewProps> = ({ userState, onUpdateState }) => {
  const [draft, setDraft] = useState<UserState>(userState);
  const [savedMessage, setSavedMessage] = useState(false);

  const [pinInput, setPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [lockConfigured, setLockConfigured] = useState(isLockConfigured());

  const save = () => {
    onUpdateState(draft);
    LocalDB.saveUserState(draft);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft({ ...draft, profile: { ...draft.profile, avatarUrl: String(reader.result) } });
    };
    reader.readAsDataURL(file);
  };

  const toggleConcern = (concern: SkinConcern) => {
    const current = draft.profile.primaryConcerns;
    setDraft({
      ...draft,
      profile: {
        ...draft.profile,
        primaryConcerns: current.includes(concern)
          ? current.filter((item) => item !== concern)
          : [...current, concern],
      },
    });
  };

  const handleSetPin = async () => {
    const result = await setPin(pinInput);
    if (!result.ok) {
      setPinMessage(result.errorFa || 'رمز معتبر نیست.');
      return;
    }
    setLockConfigured(true);
    setPinInput('');
    setPinMessage('رمز ذخیره شد.');
    const updated = { ...draft, privacy: { ...draft.privacy, lockEnabled: true } };
    setDraft(updated);
    onUpdateState(updated);
    LocalDB.saveUserState(updated);
  };

  const handleClearPin = () => {
    clearPin();
    setLockConfigured(false);
    setPinMessage('قفل برداشته شد.');
    const updated = { ...draft, privacy: { ...draft.privacy, lockEnabled: false } };
    setDraft(updated);
    onUpdateState(updated);
    LocalDB.saveUserState(updated);
  };

  const Section: React.FC<{ titleFa: string; icon: React.ElementType; children: React.ReactNode }> = ({
    titleFa,
    icon: Icon,
    children,
  }) => (
    <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-3">
      <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
        <Icon className="w-4 h-4 text-rose-500" />
        {titleFa}
      </h3>
      {children}
    </div>
  );

  const Toggle: React.FC<{ labelFa: string; value: boolean; onChange: (value: boolean) => void; hintFa?: string }> = ({
    labelFa,
    value,
    onChange,
    hintFa,
  }) => (
    <label className="cursor-pointer flex items-start justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{labelFa}</span>
        {hintFa && <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hintFa}</span>}
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        className="w-5 h-5 accent-rose-500 shrink-0 mt-0.5"
      />
    </label>
  );

  return (
    <div className="pb-28 px-4 max-w-lg mx-auto space-y-4">
      {/* کارت هویت */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-400 to-amber-300 p-0.5 flex items-center justify-center">
            {draft.profile.avatarUrl?.startsWith('data:') ? (
              <img src={draft.profile.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : draft.profile.avatarUrl ? (
              <span className="text-3xl">{draft.profile.avatarUrl}</span>
            ) : (
              <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 font-black text-2xl">
                {(draft.profile.name || 'ر').charAt(0)}
              </div>
            )}
          </div>

          <label className="cursor-pointer absolute -bottom-1 -left-1 p-2 rounded-xl bg-rose-500 text-white">
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <h2 className="font-black text-base text-slate-800 dark:text-white truncate">
            {draft.profile.name || 'کاربر رزا'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            پوست {SKIN_TYPE_LABELS[draft.profile.skinType]}
            {draft.profile.city ? ` · ${draft.profile.city}` : ''}
          </p>
          {userState.currentStreakDays > 0 && (
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {toPersianDigits(userState.currentStreakDays)} روز متوالی ثبت کرده‌ای
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {PRESET_AVATARS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => setDraft({ ...draft, profile: { ...draft.profile, avatarUrl: emoji } })}
            className={`icon-only w-11 h-11 rounded-2xl text-xl flex items-center justify-center border shrink-0 ${
              draft.profile.avatarUrl === emoji
                ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <Section titleFa="مشخصات" icon={UserIcon}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">نام</label>
            <input
              value={draft.profile.name || ''}
              onChange={(event) => setDraft({ ...draft, profile: { ...draft.profile, name: event.target.value } })}
              className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">سن</label>
            <input
              value={draft.profile.age || ''}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  profile: { ...draft.profile, age: parseInt(event.target.value.replace(/\D/g, ''), 10) || 0 },
                })
              }
              inputMode="numeric"
              className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">شهر</label>
            <input
              value={draft.profile.city}
              onChange={(event) => setDraft({ ...draft, profile: { ...draft.profile, city: event.target.value } })}
              className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
            />
          </div>
        </div>
      </Section>

      {/* فیلدهای ایمنی — در نسخه ۱ هیچ‌جا قابل تغییر نبودند */}
      <Section titleFa="ایمنی و وضعیت فعلی" icon={HeartPulse}>
        <Toggle
          labelFa="باردار هستم"
          value={draft.profile.isPregnant}
          onChange={(value) => setDraft({ ...draft, profile: { ...draft.profile, isPregnant: value } })}
          hintFa="ترکیبات نامناسب از روتین حذف می‌شوند"
        />
        <Toggle
          labelFa="دوران شیردهی"
          value={draft.profile.isBreastfeeding}
          onChange={(value) => setDraft({ ...draft, profile: { ...draft.profile, isBreastfeeding: value } })}
        />
        <Toggle
          labelFa="رتینوئید خوراکی مصرف می‌کنم"
          value={draft.profile.onOralRetinoid}
          onChange={(value) => setDraft({ ...draft, profile: { ...draft.profile, onOralRetinoid: value } })}
          hintFa="روتین ملایم می‌شود و لایه‌برداری و لیزر هشدار می‌گیرند"
        />
      </Section>

      <Section titleFa="پوست من" icon={Sparkles}>
        <div>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">نوع پوست</label>
          <select
            value={draft.profile.skinType}
            onChange={(event) =>
              setDraft({ ...draft, profile: { ...draft.profile, skinType: event.target.value as SkinType } })
            }
            className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
          >
            {Object.entries(SKIN_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
            <span>درجه حساسیت</span>
            <span className="text-rose-600">{toPersianDigits(draft.profile.sensitivityScore)} از ۱۰</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={draft.profile.sensitivityScore}
            onChange={(event) =>
              setDraft({
                ...draft,
                profile: { ...draft.profile, sensitivityScore: parseInt(event.target.value, 10) },
              })
            }
            className="w-full accent-rose-500"
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">دغدغه‌های اصلی</span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CONCERN_LABELS).map(([key, label]) => {
              const isOn = draft.profile.primaryConcerns.includes(key as SkinConcern);
              return (
                <button
                  key={key}
                  onClick={() => toggleConcern(key as SkinConcern)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    isOn
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <Section titleFa="مو و سبک زندگی" icon={Sparkles}>
        <div>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">نوع مو</label>
          <select
            value={draft.profile.hairType}
            onChange={(event) => setDraft({ ...draft, profile: { ...draft.profile, hairType: event.target.value as UserState['profile']['hairType'] } })}
            className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
          >
            <option value="straight">صاف</option><option value="wavy">موج‌دار</option><option value="curly">فر</option><option value="coily">خیلی فر</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">هدف آب در روز</label>
            <input type="number" min="1" max="20" value={draft.lifestyle.waterTargetGlasses || 8} onChange={(event) => setDraft({ ...draft, lifestyle: { ...draft.lifestyle, waterTargetGlasses: parseInt(event.target.value, 10) || 8 } })} className="w-full py-3 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold" />
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">هدف خواب</label>
            <input type="number" min="4" max="14" step="0.5" value={draft.lifestyle.sleepTargetHours || 8} onChange={(event) => setDraft({ ...draft, lifestyle: { ...draft.lifestyle, sleepTargetHours: parseFloat(event.target.value) || 8 } })} className="w-full py-3 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold" />
          </div>
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">استرس معمول</label>
          <select value={draft.lifestyle.stressLevel} onChange={(event) => setDraft({ ...draft, lifestyle: { ...draft.lifestyle, stressLevel: event.target.value as UserState['lifestyle']['stressLevel'] } })} className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold">
            <option value="low">کم</option><option value="medium">متوسط</option><option value="high">زیاد</option>
          </select>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">این اطلاعات فقط برای تنظیم پیشنهادهای آب، خواب، روتین مو و لحن یادآوری‌ها استفاده می‌شوند.</p>
      </Section>

      {/* چرخه */}
      <Section titleFa="چرخه ماهانه" icon={Moon}>
        <Toggle
          labelFa="ردیابی چرخه فعال باشد"
          value={draft.cycleConfig.enabled}
          onChange={(value) => setDraft({ ...draft, cycleConfig: { ...draft.cycleConfig, enabled: value } })}
          hintFa="کاملاً اختیاری. با خاموش بودن، هیچ محتوای چرخه‌ای دیده نمی‌شود"
        />
        {draft.cycleConfig.enabled && (
          <Toggle
            labelFa="بخش چرخه را از منو و صفحه اول مخفی کن"
            value={draft.privacy.hideCycleSection}
            onChange={(value) => setDraft({ ...draft, privacy: { ...draft.privacy, hideCycleSection: value } })}
            hintFa="داده‌ها حفط می‌شوند، فقط دیده نمی‌شوند"
          />
        )}
      </Section>

      {/* قفل */}
      {isFeatureEnabled('appLock') && (
        <Section titleFa="قفل برنامه" icon={Lock}>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            گوشی در خانواده دست به دست می‌شود. با رمز عددی، داده چرخه، عکس‌ها و پرونده پزشکی محفوط می‌ماند.
          </p>

          {lockConfigured ? (
            <button
              onClick={handleClearPin}
              className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold"
            >
              برداشتن قفل
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={(event) => setPinInput(event.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="رمز ۴ تا ۸ رقمی"
                className="w-full py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-center tracking-widest"
              />
              <button
                onClick={handleSetPin}
                disabled={pinInput.length < 4}
                className="w-full py-3 rounded-2xl bg-rose-500 disabled:opacity-40 text-white text-sm font-bold"
              >
                فعال‌سازی قفل
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                رمز قابل بازیابی نیست. جایی یادداشت کن.
              </p>
            </div>
          )}

          {pinMessage && <p className="text-sm font-bold text-emerald-600">{pinMessage}</p>}
        </Section>
      )}

      {/* اعلان‌ها */}
      <Section titleFa="یادآوری‌ها" icon={Bell}>
        <Toggle
          labelFa="یادآوری‌ها فعال باشند"
          value={draft.notifications.enabled}
          onChange={(value) => setDraft({ ...draft, notifications: { ...draft.notifications, enabled: value } })}
        />

        {draft.notifications.enabled && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">روتین صبح</label>
                <input
                  type="time"
                  value={`${String(draft.notifications.morningHour).padStart(2, '0')}:${String(
                    draft.notifications.morningMinute,
                  ).padStart(2, '0')}`}
                  onChange={(event) => {
                    const [hour, minute] = event.target.value.split(':').map(Number);
                    setDraft({
                      ...draft,
                      notifications: { ...draft.notifications, morningHour: hour || 0, morningMinute: minute || 0 },
                    });
                  }}
                  className="w-full py-3 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1.5">روتین شب</label>
                <input
                  type="time"
                  value={`${String(draft.notifications.nightHour).padStart(2, '0')}:${String(
                    draft.notifications.nightMinute,
                  ).padStart(2, '0')}`}
                  onChange={(event) => {
                    const [hour, minute] = event.target.value.split(':').map(Number);
                    setDraft({
                      ...draft,
                      notifications: { ...draft.notifications, nightHour: hour || 0, nightMinute: minute || 0 },
                    });
                  }}
                  className="w-full py-3 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                />
              </div>
            </div>

            <Toggle
              labelFa="یادآوری نوبت آرایشگاه و پزشک"
              value={draft.notifications.appointmentReminder}
              onChange={(value) =>
                setDraft({ ...draft, notifications: { ...draft.notifications, appointmentReminder: value } })
              }
            />

            {draft.cycleConfig.enabled && (
              <Toggle
                labelFa="یادآوری بازه پیش از قاعدگی"
                value={draft.notifications.cycleInsight}
                onChange={(value) =>
                  setDraft({ ...draft, notifications: { ...draft.notifications, cycleInsight: value } })
                }
              />
            )}

            <Toggle
              labelFa="متن اعلان‌ها خنطی باشد"
              value={draft.notifications.discreetText}
              onChange={(value) =>
                setDraft({ ...draft, notifications: { ...draft.notifications, discreetText: value } })
              }
              hintFa="روی صفحه قفل چیزی درباره چرخه یا نوبتت لو نمی‌رود"
            />
          </>
        )}
      </Section>

      {/* تم */}
      <Section titleFa="ظاهر برنامه" icon={Palette}>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { value: 'light' as const, labelFa: 'روشن', icon: Sun },
              { value: 'dark' as const, labelFa: 'تاریک', icon: Moon },
              { value: 'system' as const, labelFa: 'سیستم', icon: Settings },
            ]
          ).map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setDraft({ ...draft, themeMode: option.value })}
                className={`p-3 rounded-2xl border text-sm font-bold flex flex-col items-center gap-1.5 transition-colors ${
                  draft.themeMode === option.value
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {option.labelFa}
              </button>
            );
          })}
        </div>
      </Section>

      <button
        onClick={save}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-l from-rose-500 to-amber-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
      >
        {savedMessage ? (
          <>
            <Check className="w-4 h-4" />
            ذخیره شد
          </>
        ) : (
          'ذخیره تغییرات'
        )}
      </button>

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1.5">
        <EyeOff className="w-3.5 h-3.5" />
        هیچ یک از این اطلاعات از گوشی تو خارج نمی‌شود.
      </p>
    </div>
  );
};
