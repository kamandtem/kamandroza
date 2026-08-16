import React from 'react';
import { MenstrualPhase } from '../../types';
import { toPersianDigits } from '../../services/jalali';

interface CycleWheelProps { currentDay: number; totalDays: number; periodLength?: number; activePhase: MenstrualPhase; onSelectPhase: (phase: MenstrualPhase) => void; }
const COLORS: Record<MenstrualPhase, string> = { menstrual: '#f0445b', follicular: '#f5a623', ovulation: '#20b7b0', luteal: '#d8d8dc' };
const LABELS: Record<MenstrualPhase, string> = { menstrual: 'پریود', follicular: 'فولیکولار', ovulation: 'تخمک‌گذاری', luteal: 'PMS' };
function point(angle: number, radius: number, center = 150) { const rad = (angle - 90) * Math.PI / 180; return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) }; }
function arcPath(start: number, end: number, radius: number) { const a = point(start, radius); const b = point(end, radius); const large = end - start > 180 ? 1 : 0; return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`; }

/** حلقه چرخه با نشانگر واضح روز فعلی، شبیه الگوی مرجع اما با داده واقعی کاربر. */
export const CycleWheel: React.FC<CycleWheelProps> = ({ currentDay, totalDays, periodLength = 5, activePhase, onSelectPhase }) => {
  const days = Math.max(21, Math.min(45, totalDays || 28));
  const period = Math.max(1, Math.min(periodLength || 5, days));
  const ovulation = Math.max(period + 3, days - 14);
  const phaseRanges: { key: MenstrualPhase; start: number; end: number }[] = [
    { key: 'menstrual', start: 1, end: period },
    { key: 'follicular', start: period + 1, end: Math.max(period + 1, ovulation - 2) },
    { key: 'ovulation', start: Math.max(period + 1, ovulation - 1), end: Math.min(days, ovulation + 1) },
    { key: 'luteal', start: Math.min(days, ovulation + 2), end: days },
  ];
  const marker = point(((Math.max(1, Math.min(currentDay, days)) - 0.5) / days) * 360, 117);
  return <div className="space-y-3">
    <div className="relative mx-auto w-full max-w-[330px] aspect-square">
      <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
        <circle cx="150" cy="150" r="117" fill="none" stroke="#eeeeef" strokeWidth="26" />
        {phaseRanges.map((phase) => { const start = ((phase.start - 1) / days) * 360 + 1; const end = (phase.end / days) * 360 - 1; return <path key={phase.key} d={arcPath(start, Math.max(start + 2, end), 117)} fill="none" stroke={COLORS[phase.key]} strokeWidth={phase.key === activePhase ? 28 : 24} strokeLinecap="round" opacity={phase.key === activePhase ? 1 : .88} onClick={() => onSelectPhase(phase.key)} className="cursor-pointer transition-all" />; })}
        {Array.from({ length: days }, (_, index) => { const day = index + 1; const dot = point(((day - .5) / days) * 360, 117); const active = day === Math.max(1, Math.min(currentDay, days)); return <circle key={day} cx={dot.x} cy={dot.y} r={active ? 5 : 2.5} fill={active ? '#263b56' : '#fffdfa'} stroke={active ? '#fffdfa' : '#d4d4d8'} strokeWidth={active ? 2 : 1} className="cursor-pointer" onClick={() => { const found = phaseRanges.find((phase) => day >= phase.start && day <= phase.end); if (found) onSelectPhase(found.key); }} />; })}
        <circle cx={marker.x} cy={marker.y} r="16" fill="#fffdfa" stroke="#263b56" strokeWidth="5" />
        <circle cx={marker.x} cy={marker.y} r="5" fill="#263b56" />
        <text x="150" y="124" textAnchor="middle" className="fill-slate-500" fontSize="12">امروز</text>
        <text x="150" y="157" textAnchor="middle" className="fill-[#263b56] dark:fill-white" fontSize="28" fontWeight="800">روز {toPersianDigits(currentDay)}</text>
        <text x="150" y="181" textAnchor="middle" className="fill-slate-500" fontSize="12">از {toPersianDigits(days)} روز</text>
      </svg>
    </div>
    <div className="grid grid-cols-4 gap-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{phaseRanges.map((phase) => <button key={phase.key} onClick={() => onSelectPhase(phase.key)} className={`py-2 rounded-xl ${activePhase === phase.key ? 'bg-slate-100 dark:bg-slate-800 text-[#263b56] dark:text-white' : ''}`}><span className="inline-block w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: COLORS[phase.key] }} />{LABELS[phase.key]}</button>)}</div>
  </div>;
};
