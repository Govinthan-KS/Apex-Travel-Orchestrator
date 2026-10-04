'use client';

import { type HTMLMotionProps, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type CardVariant = 'glass' | 'solid' | 'outlined';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: CardVariant;
  padding?: CardPadding;
  /** Enables hover lift + shadow deepening */
  interactive?: boolean;
}

const VARIANTS: Record<CardVariant, string> = {
  glass:    'apex-glass rounded-2xl',
  solid:    'bg-white shadow-card border border-slate-100 rounded-2xl',
  outlined: 'bg-transparent border border-slate-200 rounded-2xl',
};

const PADDINGS: Record<CardPadding, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
  xl:   'p-10',
};

export function Card({
  variant = 'solid',
  padding = 'md',
  interactive = false,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={
        interactive
          ? { y: -2, boxShadow: '0 16px 48px rgba(15, 23, 42, 0.12)' }
          : {}
      }
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        VARIANTS[variant],
        PADDINGS[padding],
        interactive && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
