import React from 'react';
import { MenstrualPhase } from '../../types';
import { toPersianDigits } from '../../services/jalali';

interface CycleWheelProps {
  currentDay: number;
  selectedDay?: number;
  totalDays: number;
  periodLength?: number;
  activePhase: MenstrualPhase;
  onSelectPhase: (phase: MenstrualPhase) => void;
  onSelectDay?: (day: number) => void;
  centerTitle?: string;
  centerSubtitle?: string;
  onEditPeriod?: () => void;
}

const COLORS: Record<MenstrualPhase, string> = { menstrual: '#f0445b', follicular: '#f5a623', ovulation: '#20b7b0', luteal: '#d8d8dc' };
const LABELS: Record<MenstrualPhase, string> = { menstrual: 'پریود', follicular: 'فولیکولار', ovulation: 'تخمک‌گذاری', luteal: 'PMS' };
function point(angle: number, radius: number, center = 150) { const rad = (angle - 90) * Math.PI / 180; return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) }; }
function arcPath(start: number, end: number, radius: number) { const a = point(start, radius); const b = point(end, radius); const large = end - start > 180 ? 1 : 0; return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`; }

/** حلقه چرخه: نقطه‌ها انتخاب‌پذیرند، نوارهای رنگی فقط وضعیت بصری دارند. */
export const CycleWheel: React.FC<CycleWheelProps> = ({ currentDay, selectedDay = currentDay, totalDays, periodLength = 5, activePhase, onSelectPhase, onSelectDay, centerTitle, centerSubtitle, onEditPeriod }) => {
  const days = Math.max(21, Math.min(45, totalDays || 28));
  const period = Math.max(1, Math.min(periodLength || 5, days));
  const ovulation = Math.max(period + 3, days - 14);
  const phaseRanges: { key: MenstrualPhase; start: number; end: number }[] = [
    { key: 'menstrual', start: 1, end: period },
    { key: 'follicular', start: period + 1, end: Math.max(period + 1, ovulation - 2) },
    { key: 'ovulation', start: Math.max(period + 1, ovulation - 1), end: Math.min(days, ovulation + 1) },
    { key: 'luteal', start: Math.min(days, ovulation + 2), end: days },
  ];
  const selected = Math.max(1, Math.min(selectedDay, days));
  const selectedPoint = point(((selected - .5) / days) * 360, 117);
  const todayPoint = point(((Math.max(1, Math.min(currentDay, days)) - .5) / days) * 360, 117);
  const selectedPhase = phaseRanges.find((phase) => selected >= phase.start && selected <= phase.end)?.key || activePhase;
  const selectDay = (day: number) => { onSelectDay?.(day); const phase = phaseRanges.find((item) => day >= item.start && day <= item.end); if (phase) onSelectPhase(phase.key); };

  return <div className="space-y-3">
    <div className="relative mx-auto w-full max-w-[340px] aspect-square">
      <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
        <circle cx="150" cy="150" r="117" fill="none" stroke="#eeeeef" strokeWidth="26" />
        {phaseRanges.map((phase) => { const start = ((phase.start - 1) / days) * 360 + 1; const end = (phase.end / days) * 360 - 1; return <path key={phase.key} d={arcPath(start, Math.max(start + 2, end), 117)} fill="none" stroke={COLORS[phase.key]} strokeWidth={phase.key === selectedPhase ? 27 : 23} strokeLinecap="round" opacity={phase.key === selectedPhase ? 1 : .82} />; })}
        {Array.from({ length: days }, (_, index) => { const day = index + 1; const dot = point(((day - .5) / days) * 360, 117); const isToday = day === currentDay; const isSelected = day === selected; return <circle key={day} cx={dot.x} cy={dot.y} r={isSelected ? 6 : isToday ? 5 : 2.8} fill={isSelected ? '#263b56' : '#fffdfa'} stroke={isSelected || isToday ? '#fffdfa' : '#d4d4d8'} strokeWidth={isSelected ? 3 : 1} className="cursor-pointer" onClick={() => selectDay(day)} />; })}
        <circle cx={todayPoint.x} cy={todayPoint.y} r="10" fill="none" stroke="#263b56" strokeWidth="2" strokeDasharray="2 2" pointerEvents="none" />
        <text x="150" y="112" textAnchor="middle" className="fill-slate-500" fontSize="11">{centerTitle || 'روز انتخاب‌شده'}</text>
        <text x="150" y="148" textAnchor="middle" className="fill-[#263b56] dark:fill-white" fontSize="25" fontWeight="800">روز {toPersianDigits(selected)}</text>
        <text x="150" y="174" textAnchor="middle" className="fill-slate-500" fontSize="11">{centerSubtitle || LABELS[selectedPhase]}</text>
      </svg>
      {onEditPeriod && <button onClick={onEditPeriod} className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[45px] pointer-events-auto rounded-full border border-purple-300 bg-[#fffdfa] dark:bg-slate-900 px-5 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 shadow-sm">ویرایش پریود</button>}
      <div className="absolute pointer-events-none transition-all duration-300 rounded-full border-[3px] border-[#f0445b] bg-[#fffdfa] dark:bg-slate-900 shadow-[0_4px_14px_rgba(38,59,86,.18)] w-16 h-16 flex flex-col items-center justify-center text-center" style={{ left: `calc(${selectedPoint.x / 3}% - 32px)`, top: `calc(${selectedPoint.y / 3}% - 32px)` }}><span className="block text-[10px] text-slate-500">روز</span><strong className="text-xl text-[#263b56] dark:text-white">{toPersianDigits(selected)}</strong></div>
    </div>
    <div className="grid grid-cols-4 gap-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{phaseRanges.map((phase) => <button key={phase.key} onClick={() => onSelectPhase(phase.key)} className={`py-2 rounded-xl ${activePhase === phase.key ? 'bg-slate-100 dark:bg-slate-800 text-[#263b56] dark:text-white' : ''}`}><span className="inline-block w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: COLORS[phase.key] }} />{LABELS[phase.key]}</button>)}</div>
  </div>;
};
