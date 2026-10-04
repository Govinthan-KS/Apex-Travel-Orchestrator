'use client';

import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TagProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Display text */
  label: string;
  /** Whether this tag is currently selected */
  selected?: boolean;
  /** Optional PrimeIcons class prefix (without "pi-") for a leading icon */
  icon?: string;
}

export function Tag({ label, selected = false, icon, className, ...props }: TagProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full py-2 px-4',
        'text-sm font-medium border transition-all duration-200 cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2',
        selected
          ? 'bg-apex-indigo-soft border-apex-indigo text-apex-indigo shadow-[0_0_0_1px_#E8EBFA]'
          : 'bg-apex-paper border-slate-200 text-apex-text-secondary hover:bg-apex-indigo-soft/50 hover:border-apex-indigo/30 hover:text-apex-indigo',
        className
      )}
      {...props}
    >
      {/* Checkmark appears when selected */}
      {selected && (
        <i className="pi pi-check text-[10px] text-apex-indigo" aria-hidden="true" />
      )}
      {/* Custom icon when not selected */}
      {icon && !selected && (
        <i className={`pi pi-${icon} text-xs text-apex-text-tertiary`} aria-hidden="true" />
      )}
      {label}
    </button>
  );
}
