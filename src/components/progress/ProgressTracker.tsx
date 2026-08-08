import React, { useState } from 'react';
import { 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Camera, 
  Droplet, 
  Moon, 
  Sparkles, 
  Plus, 
  Check, 
  Columns,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState, PhotoProgress, DailyTrackerEntry } from '../../types';
import { LocalDB } from '../../services/db';
import { toPersianDigits, getTodayPersianHeader, getTodayIsoDate, formatJalaliDate } from '../../services/jalali';

interface ProgressTrackerProps {
  userState: UserState;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ userState }) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'photos' | 'analytics'>('calendar');

  const photos = LocalDB.getPhotoProgress();
  const logs = LocalDB.getDailyLogs();

  const [compareMode, setCompareMode] = useState(false);
  const [selectedPhotoBefore, setSelectedPhotoBefore] = useState<PhotoProgress | null>(photos[1] || photos[0] || null);
  const [selectedPhotoAfter, setSelectedPhotoAfter] = useState<PhotoProgress | null>(photos[0] || null);

  // File upload simulation (local base64 string storage)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        const newPhoto: PhotoProgress = {
          id: `photo_${Date.now()}`,
          date: getTodayIsoDate(),
          imagePath: base64,
          skinConditionScore: 8,
          notes: 'تصویر ثبت شده در برنامه رزا',
          tagsFa: ['ثبت جدید'],
        };
        LocalDB.savePhotoProgress(newPhoto);
        window.location.reload(); // Simple refresh for local demo state
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="pb-28 pt-2 px-4 max-w-lg mx-auto space-y-4">
      {/* Tab Switcher */}
      <div className="p-1 rounded-2xl bg-[#eee4d8] flex items-center gap-1 text-xs font-bold text-[#5c4a3e]">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'calendar' ? 'bg-white text-[#8e5241] shadow-xs' : 'hover:bg-white/50'
          }`}
        >
          تقویم جلالی روتین
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'photos' ? 'bg-white text-[#8e5241] shadow-xs' : 'hover:bg-white/50'
          }`}
        >
          تایم‌لاین عکس و مقایسه
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            activeTab === 'analytics' ? 'bg-white text-[#8e5241] shadow-xs' : 'hover:bg-white/50'
          }`}
        >
          آمار عادت‌ها
        </button>
      </div>

      {/* TAB 1: JALALI CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="p-5 rounded-3xl bg-white border border-[#ebe0d4] shadow-xs text-right space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#2e2621]">تقویم جلالی ثبت روتین‌ها</h3>
            <span className="text-xs font-bold text-[#8e5241] bg-[#f6ede5] px-2.5 py-1 rounded-full border border-[#eddcd0]">
              {getTodayPersianHeader()}
            </span>
          </div>

          <p className="text-xs text-[#8a766c]">
            هر روز که روتین صبح و شب خود را کامل کنید، در تقویم علامت سبز ثبت خواهد شد.
          </p>

          {/* Simple 7-day calendar strip preview */}
          <div className="grid grid-cols-7 gap-1.5 text-center pt-2">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayName, idx) => (
              <span key={idx} className="text-[11px] font-bold text-[#8a766c]">
                {dayName}
              </span>
            ))}

            {Array.from({ length: 30 }).map((_, i) => {
              const dayNum = i + 1;
              const date = new Date(); date.setDate(date.getDate() - (29 - i)); const iso = date.toISOString().slice(0, 10);
              const isLogged = logs.some((log) => log.date === iso);
              const isToday = iso === new Date().toISOString().slice(0, 10);

              return (
                <div
                  key={i}
                  className={`p-2 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    isToday
                      ? 'bg-[#8e5241] text-white border-[#8e5241] shadow-sm'
                      : isLogged
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-[#faf6f0] text-[#705c4f] border-[#ebe0d4]'
                  }`}
                >
                  <span>{toPersianDigits(dayNum)}</span>
                  {isLogged && !isToday && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: PHOTO TIMELINE & BEFORE/AFTER COMPARE */}
      {activeTab === 'photos' && (
        <div className="space-y-4 text-right">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-[#2e2621]">تایم‌لاین و مقایسه تغییرات پوست</h3>

            <label className="px-3.5 py-2 rounded-2xl bg-[#8e5241] hover:bg-[#784334] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all">
              <Camera className="w-4 h-4" />
              <span>ثبت عکس جدید</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div className="p-3 rounded-2xl bg-[#f6ede5] border border-[#e5d8cb] text-xs text-[#6e5d50] flex items-center justify-between">
            <span>مقایسه قبل و بعد (Side-by-Side)</span>
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`px-3 py-1.5 rounded-xl font-bold border ${
                compareMode ? 'bg-amber-600 text-white' : 'bg-white text-[#8e5241]'
              }`}
            >
              {compareMode ? 'بستن حالت مقایسه' : 'فعال‌سازی مقایسه'}
            </button>
          </div>

          {/* Side by side comparison view */}
          {compareMode && (
            <div className="p-4 rounded-3xl bg-white border border-[#ebe0d4] shadow-xs space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center space-y-1">
                  <span className="text-[11px] font-bold text-[#8a766c]">عکس قبل</span>
                  <div className="h-44 rounded-2xl bg-[#f4ebe1] border border-[#e5d8cb] flex items-center justify-center overflow-hidden">
                    {selectedPhotoBefore ? (
                      <img src={selectedPhotoBefore.imagePath} alt="Before" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-[#a39284]">عکسی موجود نیست</span>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <span className="text-[11px] font-bold text-[#8e5241]">عکس جدید (بعد)</span>
                  <div className="h-44 rounded-2xl bg-[#f4ebe1] border border-[#e5d8cb] flex items-center justify-center overflow-hidden">
                    {selectedPhotoAfter ? (
                      <img src={selectedPhotoAfter.imagePath} alt="After" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-[#a39284]">عکسی موجود نیست</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Photos grid */}
          <div className="grid grid-cols-2 gap-3">
            {photos.length === 0 ? (
              <div className="col-span-2 p-8 text-center rounded-3xl bg-white border border-[#ebe0d4] text-[#8a766c] text-xs font-bold space-y-2">
                <ImageIcon className="w-8 h-8 mx-auto text-[#c7b5a5]" />
                <p>هنوز عکسی از روند تغییرات پوست ثبت نکرده‌اید.</p>
              </div>
            ) : (
              photos.map((p) => (
                <div key={p.id} className="p-2 rounded-2xl bg-white border border-[#ebe0d4] shadow-2xs space-y-1.5">
                  <div className="h-36 rounded-xl overflow-hidden bg-gray-100">
                    <img src={p.imagePath} alt="Skin progress" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex items-center justify-between px-1 text-[10px] font-bold text-[#8a766c]">
                    <span>{formatJalaliDate(p.date)}</span>
                    <span className="text-amber-700">امتیاز: {toPersianDigits(p.skinConditionScore)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: HABIT ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-3 text-right">
          <div className="p-5 rounded-3xl bg-white border border-[#ebe0d4] shadow-xs space-y-3">
            <h3 className="font-extrabold text-base text-[#2e2621]">گزارش مداومت بر سبک زندگی</h3>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs font-bold text-[#5c4a3e] mb-1">
                  <span>هیدراتاسیون و نوشیدن آب</span>
                  <span className="text-sky-700">۸۵٪ پایبندی</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#eee4d8] overflow-hidden">
                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${logs.length ? Math.min(100, Math.round((logs.filter(l => l.waterGlasses > 0).length / logs.length) * 100) : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#5c4a3e] mb-1">
                  <span>کیفیت و ساعات خواب</span>
                  <span className="text-indigo-700">۷۸٪ پایبندی</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#eee4d8] overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${logs.length ? Math.min(100, Math.round((logs.filter(l => l.sleepHours > 0).length / logs.length) * 100) : 0}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-[#5c4a3e] mb-1">
                  <span>استفاده مداوم از ضدآفتاب</span>
                  <span className="text-amber-700">۹۲٪ پایبندی</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#eee4d8] overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${logs.length ? Math.min(100, Math.round((logs.filter(l => l.exerciseMinutes > 0).length / logs.length) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
