import React from 'react';
import { MenstrualPhase } from '../../types';
import { addDays, formatWeekdayDayMonth, toPersianDigits } from '../../services/jalali';
import { estimateOvulationDay, getPhaseForCycleDay } from '../../services/cycle/cycleService';

interface CycleWheelProps {
  /** روز جاری چرخه (بر مبنای امروز واقعی)، بین ۱ تا cycleLength. */
  currentDay: number;
  /** روزی که کاربر برای مرور روی دایره انتخاب کرده؛ پیش‌فرض همان امروز است. */
  selectedDay?: number;
  /** طول کل چرخه — تعداد نقطه‌های هر دو حلقه از همین عدد می‌آید. */
  cycleLength: number;
  periodLength: number;
  pmsStartDaysBefore: number;
  /** تاریخ میلادیِ «امروز»؛ برای محاسبه تاریخ واقعیِ روز انتخاب‌شده. */
  todayIso: string;
  onSelectDay?: (day: number) => void;
  onSelectPhase?: (phase: MenstrualPhase) => void;
  onEditPeriod?: () => void;
}

const RED = '#f0445b';
const ORANGE = '#f5a623';
const TEAL = '#20b7b0';
const PINK = '#f472b6';
const PURPLE = '#a78bfa';
const TRACK = '#eeeeef';

const ORDINALS_FA = ['اول', 'دوم', 'سوم', 'چهارم', 'پنجم', 'ششم', 'هفتم', 'هشتم', 'نهم', 'دهم'];

const CENTER = 170;
const INNER_R = 108;
const INNER_W = 22;
const OUTER_R = 150;
const OUTER_W = 5;
const TOP_GAP_DEG = 3;

function point(angle: number, radius: number, center = CENTER) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
}

function arcPath(startAngle: number, endAngle: number, radius: number) {
  const a = point(startAngle, radius);
  const b = point(endAngle, radius);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`;
}

/** بازه [start,end] یک روز به زاویه [شروع,پایان] با یک درجه فاصله از همسایه‌ها. */
function rangeToAngles(start: number, end: number, days: number) {
  const from = ((start - 1) / days) * 360 + 1;
  const to = (end / days) * 360 - 1;
  return { from, to: Math.max(from + 1, to) };
}

/**
 * دایره چرخه ماهانه.
 *
 * دو حلقه دارد:
 *  - حلقه داخلی: روزهای پریود (قرمز)، بازه PMS درست پیش از پریود بعدی (نارنجی)
 *    و بازه تخمک‌گذاری (فیروزه‌ای). بقیه‌ی روزها فقط نقطه‌اند.
 *  - حلقه بیرونی: یک دایره‌ی ساده با خط نازک به شعاعی بزرگ‌تر — نیمه‌ی
 *    فولیکولار از روز اول پریود تا تخمک‌گذاری (صورتی) و نیمه‌ی لوتئال از
 *    فردای تخمک‌گذاری تا پایان چرخه (بنفش). فقط دو رنگ، بدون نقطه و بدون
 *    شکاف داخلی؛ فقط یک شکاف کوچک بالای دایره، هم‌راستا با حلقه‌ی داخلی.
 * تعداد روزهای هر دو حلقه با طول چرخه (۲۸/۳۰/۳۲...) عوض می‌شود.
 */
export const CycleWheel: React.FC<CycleWheelProps> = ({
  currentDay,
  selectedDay,
  cycleLength,
  periodLength,
  pmsStartDaysBefore,
  todayIso,
  onSelectDay,
  onSelectPhase,
  onEditPeriod,
}) => {
  const days = Math.max(21, Math.min(45, cycleLength || 28));
  const period = Math.max(1, Math.min(periodLength || 5, days));
  const pmsDays = Math.max(0, Math.min(days - period, pmsStartDaysBefore ?? 5));
  const ovulationDay = Math.min(days, estimateOvulationDay(days, period));
  const today = Math.max(1, Math.min(currentDay, days));
  const selected = Math.max(1, Math.min(selectedDay ?? today, days));
  const selectedIso = addDays(todayIso, selected - today);

  /* حلقه داخلی: پریود / تخمک‌گذاری / PMS */
  const menstrualRange = { start: 1, end: period };
  const ovulationRange = { start: Math.max(period + 1, ovulationDay - 1), end: Math.min(days, ovulationDay + 1) };
  const pmsRange = pmsDays > 0 ? { start: Math.max(ovulationRange.end + 1, days - pmsDays + 1), end: days } : null;

  const selectedPoint = point(((selected - 0.5) / days) * 360, INNER_R);

  const selectDay = (day: number) => {
    onSelectDay?.(day);
    onSelectPhase?.(getPhaseForCycleDay(day, days, period, ovulationDay));
  };

  /* متن وسط دایره */
  let headline: string;
  if (selected <= period) {
    const remaining = period - selected;
    if (remaining === 1) headline = 'یک روز مانده به پایان پریود';
    else if (remaining === 0) headline = 'امروز آخرین روز پریود است';
    else headline = `روز ${ORDINALS_FA[selected - 1] || toPersianDigits(selected)} پریود`;
  } else if (selected >= ovulationRange.start && selected <= ovulationRange.end) {
    headline = 'احتمال تخمک‌گذاری در این بازه';
  } else {
    headline = `${toPersianDigits(days - selected + 1)} روز تا پریود بعدی`;
  }

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full max-w-[340px] aspect-square">
        <svg viewBox="0 0 340 340" className="w-full h-full overflow-visible">
          {/* حلقه بیرونی: یک دایره ساده با خط نازک، نصف صورتی (فولیکولار) و نصف بنفش (لوتئال) — بدون نقطه یا شکاف داخلی، فقط یک شکاف کوچک بالای دایره مثل حلقه‌ی داخلی. */}
          {(() => {
            const start = TOP_GAP_DEG / 2;
            const mid = (ovulationDay / days) * 360;
            const end = 360 - TOP_GAP_DEG / 2;
            return (
              <>
                <path d={arcPath(start, mid, OUTER_R)} fill="none" stroke={PINK} strokeWidth={OUTER_W} strokeLinecap="round" />
                <path d={arcPath(mid, end, OUTER_R)} fill="none" stroke={PURPLE} strokeWidth={OUTER_W} strokeLinecap="round" />
              </>
            );
          })()}

          {/* حلقه داخلی: پس‌زمینه */}
          <circle cx={CENTER} cy={CENTER} r={INNER_R} fill="none" stroke={TRACK} strokeWidth={INNER_W} />

          {/* بازه‌های رنگی داخلی */}
          {(() => {
            const { from, to } = rangeToAngles(menstrualRange.start, menstrualRange.end, days);
            return <path d={arcPath(from, to, INNER_R)} fill="none" stroke={RED} strokeWidth={INNER_W} strokeLinecap="round" />;
          })()}
          {(() => {
            const { from, to } = rangeToAngles(ovulationRange.start, ovulationRange.end, days);
            return <path d={arcPath(from, to, INNER_R)} fill="none" stroke={TEAL} strokeWidth={INNER_W} strokeLinecap="round" />;
          })()}
          {pmsRange && (() => {
            const { from, to } = rangeToAngles(pmsRange.start, pmsRange.end, days);
            return <path d={arcPath(from, to, INNER_R)} fill="none" stroke={ORANGE} strokeWidth={INNER_W} strokeLinecap="round" />;
          })()}

          {/* نقطه‌های قابل‌کلیک هر روز */}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1;
            const dot = point(((day - 0.5) / days) * 360, INNER_R);
            const isToday = day === today;
            const isSelected = day === selected;
            return (
              <circle
                key={day}
                cx={dot.x}
                cy={dot.y}
                r={isSelected ? 6 : isToday ? 5 : 2.8}
                fill={isSelected ? '#263b56' : '#fffdfa'}
                stroke={isSelected || isToday ? '#fffdfa' : '#d4d4d8'}
                strokeWidth={isSelected ? 3 : 1}
                className="cursor-pointer"
                onClick={() => selectDay(day)}
              />
            );
          })}

          {/* برچسب شروع/پایان چرخه، شبیه ساعت ۱۲ */}
          {(() => {
            const startLabel = point(6, INNER_R + 30);
            const endLabel = point(-6, INNER_R + 30);
            return (
              <>
                <text x={startLabel.x} y={startLabel.y} textAnchor="middle" fontSize="13" fontWeight="800" className="fill-[#f0445b]">
                  {toPersianDigits(1)}
                </text>
                <text x={endLabel.x} y={endLabel.y} textAnchor="middle" fontSize="13" fontWeight="800" className="fill-[#f5a623]">
                  {toPersianDigits(days)} ←
                </text>
              </>
            );
          })()}

          {/* متن وسط */}
          <text x={CENTER} y={CENTER - 30} textAnchor="middle" className="fill-slate-500" fontSize="13">
            {formatWeekdayDayMonth(selectedIso)}
          </text>
          <text x={CENTER} y={CENTER + 2} textAnchor="middle" className="fill-[#263b56] dark:fill-white" fontSize="19" fontWeight="800">
            {headline}
          </text>
        </svg>

        {onEditPeriod && (
          <button
            onClick={onEditPeriod}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-[36px] pointer-events-auto rounded-full border border-purple-300 bg-[#fffdfa] dark:bg-slate-900 px-5 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 shadow-sm"
          >
            ویرایش پریود
          </button>
        )}

        {/* نشان شناور روز روی لبه‌ی حلقه داخلی */}
        <div
          className="absolute pointer-events-none transition-all duration-300 rounded-full border-[3px] border-[#f0445b] bg-[#fffdfa] dark:bg-slate-900 shadow-[0_4px_14px_rgba(38,59,86,.18)] w-16 h-16 flex flex-col items-center justify-center text-center"
          style={{ left: `calc(${(selectedPoint.x / 340) * 100}% - 32px)`, top: `calc(${(selectedPoint.y / 340) * 100}% - 32px)` }}
        >
          <span className="block text-[10px] text-slate-500">روز</span>
          <strong className="text-xl text-[#263b56] dark:text-white">{toPersianDigits(selected)}</strong>
        </div>
      </div>

      {/* راهنمای رنگ‌ها */}
      <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: RED }}>
            i
          </span>
          پریود
        </span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: TEAL }}>
            i
          </span>
          تخمک‌گذاری
        </span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: ORANGE }}>
            i
          </span>
          PMS
        </span>
      </div>

      <div className="flex items-center justify-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PINK }} />
          فولیکولار
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PURPLE }} />
          لوتئال
        </span>
      </div>
    </div>
  );
};
