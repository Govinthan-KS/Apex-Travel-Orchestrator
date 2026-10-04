'use client';

import { type HTMLMotionProps, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'icon';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: string; // PrimeIcons class name, e.g. "pi-send"
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-apex-indigo text-white hover:bg-apex-indigo-mid border border-transparent',
  secondary:
    'apex-glass text-apex-indigo hover:bg-white/80 border border-white/45',
  ghost:
    'bg-transparent text-apex-indigo hover:bg-apex-indigo-soft border border-transparent',
  gold:
    'bg-apex-gold text-white hover:opacity-90 border border-transparent',
  icon:
    'bg-transparent text-apex-indigo hover:bg-apex-indigo-soft aspect-square border border-transparent',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm rounded-lg min-h-[36px]',
  md: 'px-6 py-3 text-sm rounded-xl min-h-[44px]',
  lg: 'px-8 py-4 text-base rounded-xl min-h-[52px]',
  xl: 'px-10 py-5 text-lg rounded-2xl min-h-[60px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-apex-indigo focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',
        variant !== 'icon' ? SIZES[size] : 'w-10 h-10 rounded-xl',
        VARIANTS[variant],
        loading && 'cursor-wait',
        className
      )}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 rounded-full border-2 border-current border-t-transparent apex-spin"
          aria-hidden="true"
        />
      ) : leftIcon ? (
        <i className={`pi ${leftIcon} text-sm`} aria-hidden="true" />
      ) : null}
      <>{children}</>
    </motion.button>
  );
}
