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
  HeartPulse,
  Sparkles,
  EyeOff,
  Download, Upload, Trash2,
} from 'lucide-react';
import { SkinConcern, SkinType, UserState } from '../../types';
import { LocalDB } from '../../services/db';
import { toPersianDigits } from '../../services/jalali';
import { wipeAllData } from '../../services/storage/persistence';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { PrettySelect } from '../common/PrettySelect';

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
    <div className="flex items-start justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">{labelFa}</span>
        {hintFa && <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{hintFa}</span>}
      </span>
      <ToggleSwitch checked={value} onChange={onChange} labelFa={labelFa} />
    </div>
  );

  return (
    <div className="pb-[calc(10rem+env(safe-area-inset-bottom))] px-4 max-w-lg mx-auto space-y-4">
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

          <label className="cursor-pointer absolute -bottom-1.5 -right-1.5 p-2 rounded-full bg-rose-500 text-white shadow-md ring-2 ring-white dark:ring-slate-900">
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
      </Section>

      <Section titleFa="پوست من" icon={Sparkles}>
        <PrettySelect
          label="نوع پوست"
          value={draft.profile.skinType}
          onChange={(value) => setDraft({ ...draft, profile: { ...draft.profile, skinType: value as SkinType } })}
          options={Object.entries(SKIN_TYPE_LABELS).map(([key, label]) => ({ value: key, label }))}
        />

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
        <PrettySelect
          label="نوع مو"
          value={draft.profile.hairType}
          onChange={(value) => setDraft({ ...draft, profile: { ...draft.profile, hairType: value as UserState['profile']['hairType'] } })}
          options={[
            { value: 'straight', label: 'صاف' },
            { value: 'wavy', label: 'موج‌دار' },
            { value: 'curly', label: 'فر' },
            { value: 'coily', label: 'خیلی فر' },
          ]}
        />
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
        <PrettySelect
          label="استرس معمول"
          value={draft.lifestyle.stressLevel}
          onChange={(value) => setDraft({ ...draft, lifestyle: { ...draft.lifestyle, stressLevel: value as UserState['lifestyle']['stressLevel'] } })}
          options={[
            { value: 'low', label: 'کم', description: 'معمولاً آرام و متعادل' },
            { value: 'medium', label: 'متوسط', description: 'گاهی پراسترس' },
            { value: 'high', label: 'زیاد', description: 'بیشتر روزها پراسترس' },
          ]}
        />
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
                hintFa="هر روزی که در این بازه هستی، یک یادآوری می‌آید"
              />
            )}

            {draft.cycleConfig.enabled && (
              <Toggle
                labelFa="یادآوری فردا وارد PMS یا پریود می‌شوی"
                value={draft.notifications.periodReminder}
                onChange={(value) =>
                  setDraft({ ...draft, notifications: { ...draft.notifications, periodReminder: value } })
                }
                hintFa="یک روز قبل از شروع بازه پیش از قاعدگی و یک روز قبل از شروع پریود"
              />
            )}

            {draft.cycleConfig.enabled && (
              <Toggle
                labelFa="یادآوری فاز تخمک‌گذاری"
                value={draft.notifications.ovulationReminder}
                onChange={(value) =>
                  setDraft({ ...draft, notifications: { ...draft.notifications, ovulationReminder: value } })
                }
              />
            )}

            <Toggle
              labelFa="هشدار یووی بالا"
              value={draft.notifications.uvAlert}
              onChange={(value) => setDraft({ ...draft, notifications: { ...draft.notifications, uvAlert: value } })}
              hintFa="بر اساس داده هواشناسی همان شهری که در پروفایل ثبت کرده‌ای"
            />

            {draft.cycleConfig.enabled && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">یادآوری ثبت علائم چرخه</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">هر روز سر همین ساعت، رزا یادت می‌اندازد علائمت را در بخش سیکل ثبت کنی.</span>
                  </span>
                  <ToggleSwitch
                    checked={draft.notifications.symptomReminder}
                    onChange={(value) => setDraft({ ...draft, notifications: { ...draft.notifications, symptomReminder: value } })}
                    labelFa="یادآوری ثبت علائم چرخه"
                  />
                </div>
                {draft.notifications.symptomReminder && (
                  <input
                    type="time"
                    value={`${String(draft.notifications.symptomReminderHour).padStart(2, '0')}:${String(
                      draft.notifications.symptomReminderMinute,
                    ).padStart(2, '0')}`}
                    onChange={(event) => {
                      const [hour, minute] = event.target.value.split(':').map(Number);
                      setDraft({
                        ...draft,
                        notifications: {
                          ...draft.notifications,
                          symptomReminderHour: hour || 0,
                          symptomReminderMinute: minute || 0,
                        },
                      });
                    }}
                    className="w-full py-3 px-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold"
                  />
                )}
              </div>
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

      <Section titleFa="مدیریت داده‌ها" icon={Settings}>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { const blob = new Blob([JSON.stringify(LocalDB.exportBackupData(), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'roza-backup.json'; a.click(); URL.revokeObjectURL(url); }} className="py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm font-bold flex items-center justify-center gap-1.5"><Download className="w-4 h-4" /> پشتیبان</button>
          <label className="py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"><Upload className="w-4 h-4" /> بازگردانی<input type="file" accept=".json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { const result = LocalDB.importBackupData(JSON.parse(String(reader.result))); alert(result.ok ? 'اطلاعات بازگردانی شد.' : result.errorFa); }; reader.readAsText(file); }} /></label>
        </div>
        <button onClick={async () => { if (window.confirm('همه اطلاعات رزا پاک شود؟ این کار قابل بازگشت نیست.')) { await wipeAllData(); window.location.reload(); } }} className="w-full py-3 rounded-2xl text-rose-600 bg-rose-50 dark:bg-rose-950/30 text-sm font-bold flex items-center justify-center gap-1.5"><Trash2 className="w-4 h-4" /> پاک کردن کامل داده‌ها</button>
      </Section>

      <Section titleFa="ارتباط با برنامه‌نویس" icon={Settings}>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-7">اگر مشکلی دیدی یا پیشنهادی برای بهتر شدن رزا داری، پیام بفرست.</p>
        <a href="mailto:arjmandmahtab7@gmail.com?subject=پیشنهاد%20برای%20رزا" className="block w-full text-center py-3 rounded-2xl bg-[#eef3fa] dark:bg-slate-800 text-[#263b56] dark:text-white text-sm font-bold">ارسال پیام به برنامه‌نویس</a>
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
