import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'indigo' | 'gold' | 'success' | 'error' | 'warning' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Display text */
  label: string;
  variant?: BadgeVariant;
  /** Show a small filled dot before the label */
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  indigo:  'bg-apex-indigo-soft text-apex-indigo border border-apex-indigo/20',
  gold:    'bg-apex-gold-soft text-apex-gold border border-apex-gold/20',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  error:   'bg-red-50 text-red-700 border border-red-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const DOT_STYLES: Record<BadgeVariant, string> = {
  indigo:  'bg-apex-indigo',
  gold:    'bg-apex-gold',
  success: 'bg-emerald-600',
  error:   'bg-red-600',
  warning: 'bg-amber-600',
  neutral: 'bg-slate-400',
};

export function Badge({ label, variant = 'neutral', dot = false, className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        VARIANT_STYLES[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', DOT_STYLES[variant])}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
}
