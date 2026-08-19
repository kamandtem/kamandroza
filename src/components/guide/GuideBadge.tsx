import React from 'react';
import { getGuideTier, useGuideProgress } from '../../services/guide/guideProgress';

interface GuideBadgeProps {
  onClick: () => void;
  className?: string;
}

/**
 * بج سطح کاربر در راهنما — کنار نام کاربر در منوی اصلی.
 * روی هر Level ای که کاربر واقعاً وارد شده (یعنی Level قبلش را کامل کرده) می‌ایستد.
 */
export const GuideBadge: React.FC<GuideBadgeProps> = ({ onClick, className = '' }) => {
  const progress = useGuideProgress();
  const tier = getGuideTier(progress);

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full pl-2.5 pr-2 py-1 bg-gradient-to-l from-[#f2ba61] to-[#f2d19b] text-[#4a3413] text-[11px] font-black shadow-sm active:scale-95 transition-transform ${className}`}
    >
      <span>{tier.emoji}</span>
      <span className="truncate max-w-[110px]">{tier.labelFa}</span>
    </button>
  );
};
