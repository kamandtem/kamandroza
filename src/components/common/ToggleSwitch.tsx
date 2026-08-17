import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  labelFa?: string;
  ariaLabel?: string;
}

/**
 * سوئیچ روشن/خاموش استاندارد (iOS / Material).
 *
 * مشکل نسخه قبل: همه‌جا از <input type="checkbox"> خام با accent-rose-500
 * استفاده می‌شد. روی موبایل چک‌باکس خام خیلی کوچک است، زمینه‌ی زیرش
 * (track) اصلاً کشیده نمی‌شود و وقتی کاربر لمسش می‌کند وضعیت روشن/خاموش
 * به‌سختی دیده می‌شود.
 *
 * اینجا یک ردّ (track) به‌شکل حبه‌ای با اندازه‌ی ثابت و یک دسته‌ی
 * (thumb) گرد متحرک ساخته شده. برای درست کار کردن در چیدمان راست‌به‌چپ
 * از فاصله‌ی منطقی start/end (نه چپ/راست فیزیکی) استفاده شده تا در حالت
 * روشن، دسته به‌سمت پایان (چپِ صفحه در RTL) برود.
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, disabled, labelFa, ariaLabel }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || labelFa}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative shrink-0 inline-block w-12 h-7 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.35)] transition-[inset-inline-start] duration-200 ease-in-out ${
          checked ? 'start-[26px]' : 'start-[2px]'
        }`}
      />
    </button>
  );
};
