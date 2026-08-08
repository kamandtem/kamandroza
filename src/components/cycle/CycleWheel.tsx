import React from 'react';
import { motion } from 'motion/react';
import { toPersianDigits } from '../../services/jalali';
import { MenstrualPhase } from '../../types';

interface CycleWheelProps {
  currentDay: number; // e.g., 24
  totalDays: number; // e.g., 28
  periodLength?: number;
  activePhase: MenstrualPhase;
  onSelectPhase: (phase: MenstrualPhase) => void;
}

export const CycleWheel: React.FC<CycleWheelProps> = ({
  currentDay,
  totalDays = 28,
  periodLength = 5,
  activePhase,
  onSelectPhase,
}) => {
  const radius = 100;
  const strokeWidth = 24;
  const center = 130;
  const safeTotal = Math.max(1, totalDays || 28);
  const safePeriod = Math.max(1, Math.min(periodLength || 5, safeTotal));
  const ovulationDay = Math.max(safePeriod + 2, safeTotal - 14);
  const progressAngle = ((Math.max(1, Math.min(currentDay, safeTotal)) - 1) / safeTotal) * 360;
  const phases = [
    { key: 'menstrual' as MenstrualPhase, label: 'قاعدگی', color: '#e11d48', start: 1, end: safePeriod },
    { key: 'follicular' as MenstrualPhase, label: 'فولیکولار', color: '#10b981', start: safePeriod + 1, end: Math.max(safePeriod + 1, ovulationDay - 2) },
    { key: 'ovulation' as MenstrualPhase, label: 'حوالی تخمک‌گذاری', color: '#f59e0b', start: Math.max(1, ovulationDay - 1), end: Math.min(safeTotal, ovulationDay + 1) },
    { key: 'luteal' as MenstrualPhase, label: 'لوتئال', color: '#8b5cf6', start: Math.min(safeTotal, ovulationDay + 2), end: safeTotal },
  ];

  return (
    <div className="relative w-64 h-64 mx-auto flex items-center justify-center my-2">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 260 260">
        {/* Background Ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f0e4d8"
          strokeWidth={strokeWidth}
        />

        {/* Phase Arcs, proportional to the user's cycle length */}
        {phases.map((phase) => {
          const circumference = 2 * Math.PI * radius;
          const length = Math.max(0, ((phase.end - phase.start + 1) / safeTotal) * circumference);
          const offset = -((phase.start - 1) / safeTotal) * circumference;
          return <circle key={phase.key} cx={center} cy={center} r={radius} fill="none" stroke={phase.color} strokeWidth={strokeWidth} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={offset} strokeLinecap="round" className="cursor-pointer transition-opacity hover:opacity-80" onClick={() => onSelectPhase(phase.key)} />;
        })}
      </svg>

      {/* Center Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
        <span className="text-[11px] font-bold text-[#8a766c] block">امروز</span>
        <span className="text-3xl font-black text-[#3a2f27] my-0.5">
          روز {toPersianDigits(currentDay)}
        </span>
        <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#f6ede5] text-[#8e5241] border border-[#e5d8cb]">
          از {toPersianDigits(totalDays)} روز
        </span>
      </div>

      {/* Today indicator dot on circle */}
      <motion.div
        className="absolute w-5 h-5 rounded-full bg-white border-4 border-[#8e5241] shadow-md pointer-events-none"
        animate={{
          rotate: progressAngle,
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          transformOrigin: 'center center',
          top: 'calc(50% - 10px)',
          left: 'calc(50% - 10px)',
        }}
      >
        <div className="w-full h-full -translate-y-[100px]" />
      </motion.div>
    </div>
  );
};
