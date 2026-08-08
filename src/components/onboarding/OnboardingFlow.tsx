import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Heart, Moon, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState, SkinType } from '../../types';
import { LocalDB } from '../../services/db';
import confetti from 'canvas-confetti';

interface OnboardingFlowProps {
  onComplete: (newState: UserState) => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);

  const [name, setName] = useState('');
  const [skinType, setSkinType] = useState<SkinType>('normal');
  const [enableCycle, setEnableCycle] = useState(false);
  const [lastPeriod, setLastPeriod] = useState('');

  const handleFinishOnboarding = () => {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });

    const currentState = LocalDB.getUserState();
    const updatedState: UserState = {
      ...currentState,
      profile: {
        ...currentState.profile,
        name: name.trim() || undefined,
        skinType,
      },
      cycleConfig: {
        ...currentState.cycleConfig,
        enabled: enableCycle,
        lastPeriodDate: enableCycle ? lastPeriod : '',
      },
      onboardingCompleted: true,
    };

    LocalDB.saveUserState(updatedState);
    onComplete(updatedState);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-[#ebe0d4] shadow-xl text-right space-y-6">
        {/* Step 1: Welcome & Privacy */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#8e5241] to-[#ca7f6a] text-white flex items-center justify-center text-3xl font-black mx-auto shadow-lg">
              R
            </div>
            <h1 className="text-xl font-black text-[#2e2621] text-center">
              به رزا خوش آمدید ✨
            </h1>
            <p className="text-xs text-[#6e5d50] leading-relaxed text-center">
              دستیار هوشمند و شخصی مراقبت از پوست، سبک زندگی و چرخه هورمونی به زبان فارسی.
            </p>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                حریم خصوصی، اولویت رزا
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                هیچ اطلاعات شخصی، چرخه ماهانه یا عکسی از گوشی شما خارج نمی‌شود. اطلاعات پوست، چرخه و عکس‌های شما روی دستگاه می‌مانند؛ فقط آب‌وهوا در صورت درخواست از اینترنت استفاده می‌کند. برای یادآوری روتین، اجازه اعلان‌ها از شما پرسیده می‌شود.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-2xl bg-[#8e5241] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              راهنمای استفاده
              <ArrowLeft className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 2: Skin Questionnaire */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-black text-[#2e2621]">پوست خودت را بهتر بشناس</h2>
            <p className="text-xs text-[#705c4f]">
              برای تنظیم دوز ترکیبات فعال، نوع اصلی پوست خود را مشخص کنید:
            </p>

            <div className="space-y-2">
              {[
                { type: 'combination', title: 'مختلط (T-Zone چرب، گونه‌ها نرمال/خشک)' },
                { type: 'oily', title: 'چرب (برق افتادن مداوم و مستعد جوش)' },
                { type: 'dry', title: 'خشک (احساس کشیدگی و پوسته ریزی)' },
                { type: 'sensitive', title: 'حساس (قرمزی سریع و سوزش به ترکیبات)' },
                { type: 'normal', title: 'نرمال و متعادل' },
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSkinType(item.type as SkinType)}
                  className={`w-full p-3.5 rounded-2xl text-xs font-bold text-right border transition-all ${
                    skinType === item.type
                      ? 'bg-[#8e5241] text-white border-[#8e5241] shadow-xs'
                      : 'bg-[#faf6f0] text-[#5c4a3e] border-[#ebe0d4] hover:bg-white'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl bg-[#eee3d8] text-[#5c4a3e] font-bold text-xs"
              >
                قبلی
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 rounded-2xl bg-[#8e5241] text-white font-bold text-xs shadow-md"
              >
                مرحله بعدی (تنظیم هورمون)
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Cycle Setup */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <h2 className="text-lg font-black text-[#2e2621] flex items-center gap-2">
              <Moon className="w-5 h-5 text-rose-500" />
              هوشمندی چرخه هورمونی و PMS
            </h2>
            <p className="text-xs text-[#705c4f]">
              با فعال‌سازی ردیابی چرخه، رزا ۵ روز قبل از پریود به شما هشدار جوش هورمونی داده و روتین را خودکار سفارشی می‌کند.
            </p>

            <div className="p-4 rounded-2xl bg-[#fdf5f2] border border-[#f5dcd5] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3a2f27]">فعال‌سازی هوشمندی چرخه ماهانه</span>
                <input
                  type="checkbox"
                  checked={enableCycle}
                  onChange={(e) => setEnableCycle(e.target.checked)}
                  className="w-4 h-4 accent-rose-500 cursor-pointer"
                />
              </div>

              {enableCycle && (
                <div>
                  <label className="text-xs font-bold text-[#5c4a3e] block mb-1">
                    تاریخ شروع آخرین پریود:
                  </label>
                  <input
                    type="date"
                    value={lastPeriod}
                    onChange={(e) => setLastPeriod(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-2xl bg-white border border-[#e5d8cb] text-xs font-bold text-[#382f29]"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleFinishOnboarding}
              className="w-full py-3.5 rounded-2xl bg-[#8e5241] text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 text-amber-200" />
              ثبت اطلاعات و شروع
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
