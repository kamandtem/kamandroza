import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Settings, 
  Moon, 
  Sun, 
  Camera, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Download, 
  Upload, 
  Heart, 
  Sliders, 
  Bell, 
  Palette,
  Award,
  Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { UserState, SkinType, SkinConcern } from '../../types';
import { LocalDB } from '../../services/db';
import { toPersianDigits, formatJalaliDate } from '../../services/jalali';

interface ProfileViewProps {
  userState: UserState;
  onUpdateState: (newState: UserState) => void;
  onClose?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userState,
  onUpdateState,
  onClose,
}) => {
  const [name, setName] = useState(userState.profile.name || 'کاربر عزیز');
  const [avatarUrl, setAvatarUrl] = useState(userState.profile.avatarUrl || '');
  const [profile, setProfile] = useState(userState.profile);
  const [lifestyle, setLifestyle] = useState(userState.lifestyle);
  const [cycleConfig, setCycleConfig] = useState(userState.cycleConfig);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(userState.themeMode || 'light');
  const [notifications, setNotifications] = useState(userState.notifications || { enabled: true, morningRoutine: true, morningHour: 9, morningMinute: 0, nightRoutine: true, nightHour: 21, nightMinute: 0, cycleInsight: true });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Default Preset Avatars
  const presetAvatars = [
    '🌸', '💆‍♀️', '✨', '👑', '🌿', '💧', '🌺', '☀️'
  ];

  const skinTypeLabels: Record<SkinType, string> = {
    dry: 'خشک',
    oily: 'چرب',
    combination: 'مختلط (T-Zone چرب)',
    normal: 'نرمال و متعادل',
    sensitive: 'حساس و قرمز',
    dehydrated: 'دهیدراته (کم‌آب)',
  };

  const skinConcernLabels: Record<SkinConcern, string> = {
    acne: 'جوش و آکنه',
    hyperpigmentation: 'لک و لکه‌های تیره',
    wrinkles: 'چروک‌های عمیق',
    fine_lines: 'خطوط ریز',
    dryness: 'خشکی و کشیدگی',
    oiliness: 'چربی زیاد',
    redness: 'قرمزی و التهاب',
    rosacea: 'رزاسه',
    eczema: 'اگزما',
    pores: 'منافذ باز',
    texture: 'ناهمواری بافت',
    dark_circles: 'تیرگی دور چشم',
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const newState: UserState = {
      ...userState,
      profile: {
        ...profile,
        name,
        avatarUrl,
      },
      lifestyle,
      cycleConfig,
      themeMode,
      notifications,
    };

    // Apply dark/light theme class to document element
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    onUpdateState(newState);
    LocalDB.saveUserState(newState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (LocalDB.importBackupData(json)) {
            alert('اطلاعات پشتیبان با موفقیت بازگردانی شد!');
            window.location.reload();
          }
        } catch {
          alert('فایل پشتیبان نامعتبر است.');
        }
      };
      reader.readAsText(file);
    }
  };

  const toggleConcern = (concern: SkinConcern) => {
    const current = profile.primaryConcerns || [];
    if (current.includes(concern)) {
      setProfile({ ...profile, primaryConcerns: current.filter((c) => c !== concern) });
    } else {
      setProfile({ ...profile, primaryConcerns: [...current, concern] });
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto space-y-5 text-right font-['Vazirmatn',sans-serif]">
      {/* User Header Profile Card with Avatar Upload */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-md flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Avatar Photo */}
        <div className="relative group shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-rose-400 via-amber-300 to-emerald-400 p-0.5 shadow-md flex items-center justify-center">
            {avatarUrl ? (
              avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-3xl">{avatarUrl}</span>
              )
            ) : (
              <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-rose-500 font-black text-2xl">
                {name.charAt(0) || 'R'}
              </div>
            )}
          </div>

          <label className="absolute -bottom-1 -left-1 p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-md cursor-pointer active:scale-95 transition-transform">
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
        </div>

        {/* Name and Level details */}
        <div className="flex-1 text-center sm:text-right space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">{name}</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-black">
              سطح {toPersianDigits(userState.userLevel)}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            پوست {skinTypeLabels[profile.skinType]} • {toPersianDigits(profile.age || 25)} ساله • {profile.city || 'تهران'}
          </p>

          <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs text-amber-600 dark:text-amber-400 font-extrabold">
            <Zap className="w-3.5 h-3.5 fill-amber-500" />
            <span>{toPersianDigits(userState.userXp)} XP کسب شده</span>
          </div>
        </div>
      </div>

      {/* Preset Avatar Selection */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-2">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">انتخاب آواتار سریع:</span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {presetAvatars.map((emoji) => (
            <button
              key={emoji}
              onClick={() => setAvatarUrl(emoji)}
              className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center border transition-all ${
                avatarUrl === emoji
                  ? 'bg-rose-100 dark:bg-rose-950/60 border-rose-500 scale-110 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Personal Identity Form */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-rose-500" />
          مشخصات فردی
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">نام و نام خانوادگی:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">سن:</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value, 10) || 25 })}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">شهر محل سکونت:</label>
            <input
              type="text"
              value={profile.city}
              onChange={(e) => setProfile({ ...profile, city: e.target.value })}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-rose-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">شغل:</label>
            <input
              type="text"
              value={profile.occupation}
              onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
              className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-rose-400"
            />
          </div>
        </div>
      </div>

      {/* App Settings & Theme Selection (تنظیمات برنامه) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <Palette className="w-4 h-4 text-rose-500" />
          تنظیمات ظاهر برنامه (تم)
        </h3>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">حالت رنگی تم:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setThemeMode('light')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                themeMode === 'light'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm scale-102'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>امیدوار و روشن</span>
            </button>

            <button
              onClick={() => setThemeMode('dark')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                themeMode === 'dark'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm scale-102'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>شب و تاریک</span>
            </button>

            <button
              onClick={() => setThemeMode('system')}
              className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                themeMode === 'system'
                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm scale-102'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>پیروی از سیستم</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-rose-500" />
          تنظیمات اعلان‌ها
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">اعلان‌ها فقط روی همین گوشی زمان‌بندی می‌شوند و اطلاعات شخصی شما به سرویس اعلان ارسال نمی‌شود.</p>
        <label className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 cursor-pointer">
          <span className="text-xs font-extrabold text-slate-800 dark:text-white">فعال‌سازی اعلان‌های رزا</span>
          <input type="checkbox" checked={notifications.enabled} onChange={(e) => setNotifications({ ...notifications, enabled: e.target.checked })} className="w-5 h-5 accent-rose-500" />
        </label>
        {notifications.enabled && <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>یادآوری روتین صبح</span><input type="checkbox" checked={notifications.morningRoutine} onChange={(e) => setNotifications({ ...notifications, morningRoutine: e.target.checked })} className="w-5 h-5 accent-rose-500" />
          </label>
          {notifications.morningRoutine && <input aria-label="زمان روتین صبح" type="time" value={`${String(notifications.morningHour).padStart(2, '0')}:${String(notifications.morningMinute).padStart(2, '0')}`} onChange={(e) => { const [h, m] = e.target.value.split(':').map(Number); setNotifications({ ...notifications, morningHour: h || 0, morningMinute: m || 0 }); }} className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold" />}
          <label className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>یادآوری روتین شب</span><input type="checkbox" checked={notifications.nightRoutine} onChange={(e) => setNotifications({ ...notifications, nightRoutine: e.target.checked })} className="w-5 h-5 accent-rose-500" />
          </label>
          {notifications.nightRoutine && <input aria-label="زمان روتین شب" type="time" value={`${String(notifications.nightHour).padStart(2, '0')}:${String(notifications.nightMinute).padStart(2, '0')}`} onChange={(e) => { const [h, m] = e.target.value.split(':').map(Number); setNotifications({ ...notifications, nightHour: h || 0, nightMinute: m || 0 }); }} className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold" />}
          <label className="flex items-center justify-between gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>یادآوری بازه احتمالی پیش از قاعدگی</span><input type="checkbox" checked={notifications.cycleInsight} onChange={(e) => setNotifications({ ...notifications, cycleInsight: e.target.checked })} className="w-5 h-5 accent-rose-500" />
          </label>
        </div>}
      </div>

      {/* Skin Intelligence Profile */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-500" />
          تنظیمات تخصص هوش مصنوعی پوست
        </h3>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">نوع اصلی پوست شما:</label>
          <select
            value={profile.skinType}
            onChange={(e) => setProfile({ ...profile, skinType: e.target.value as SkinType })}
            className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-rose-400"
          >
            {Object.entries(skinTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            <span>درجه حساسیت و قرمزی پوست:</span>
            <span className="text-rose-600 dark:text-rose-400 font-extrabold">{toPersianDigits(profile.sensitivityScore)} از ۱۰</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={profile.sensitivityScore}
            onChange={(e) => setProfile({ ...profile, sensitivityScore: parseInt(e.target.value, 10) })}
            className="w-full accent-rose-500 cursor-pointer"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">دغدغه‌های اصلی پوستی شما:</label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(skinConcernLabels).map(([key, label]) => {
              const isSelected = (profile.primaryConcerns || []).includes(key as SkinConcern);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleConcern(key as SkinConcern)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSaveProfile}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
      >
        {savedSuccess ? (
          <>
            <Check className="w-4 h-4 text-emerald-200" />
            تنظیمات با موفقیت ذخیره شد!
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-amber-200" />
            ذخیره تغییرات پروفایل و تنظیمات
          </>
        )}
      </button>

      {/* Backup & Data Privacy Section */}
      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          مدیریت فایل پشتیبان و حریم خصوصی
        </h4>

        <div className="flex items-center gap-2">
          <label className="flex-1 py-2.5 px-3 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs transition-all">
            <Upload className="w-4 h-4 text-rose-500" />
            بارگذاری فایل JSON پشتیبان
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
