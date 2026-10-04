import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Rounded = 'sm' | 'md' | 'lg' | 'full';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Tailwind width class, e.g. "w-full", "w-48", "w-1/2" */
  width?: string;
  /** Tailwind height class, e.g. "h-4", "h-6", "h-10" */
  height?: string;
  rounded?: Rounded;
  /**
   * Render N stacked shimmer lines instead of a single block.
   * The last line renders at 60% width to simulate natural text endings.
   */
  lines?: number;
}

const ROUNDED: Record<Rounded, string> = {
  sm:   'rounded',
  md:   'rounded-lg',
  lg:   'rounded-xl',
  full: 'rounded-full',
};

function SkeletonLine({
  height = 'h-4',
  rounded = 'md',
  widthClass,
  className,
}: {
  height?: string;
  rounded?: Rounded;
  widthClass: string;
  className?: string;
}) {
  return (
    <div
      className={cn('apex-shimmer', height, widthClass, ROUNDED[rounded], className)}
      aria-hidden="true"
    />
  );
}

export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  rounded = 'md',
  lines,
  className,
  ...props
}: SkeletonProps) {
  // Multi-line skeleton (e.g. body text placeholder)
  if (lines && lines > 1) {
    return (
      <div className="space-y-2.5" role="status" aria-label="Loading..." {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            height={height}
            rounded={rounded}
            // Last line is shorter — mimics natural paragraph endings
            widthClass={i === lines - 1 ? 'w-3/5' : 'w-full'}
            className={className}
          />
        ))}
      </div>
    );
  }

  // Single skeleton block
  return (
    <div
      className={cn('apex-shimmer', width, height, ROUNDED[rounded], className)}
      role="status"
      aria-label="Loading..."
      aria-hidden="true"
      {...props}
    />
  );
}

/* ─── Preset skeleton compositions ───────────────────────────────────────── */

/** Skeleton that matches a Card layout */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl p-6 shadow-card border border-slate-100', className)}>
      <Skeleton width="w-1/3" height="h-3" rounded="full" className="mb-4" />
      <Skeleton width="w-2/3" height="h-6" rounded="md" className="mb-3" />
      <Skeleton lines={3} height="h-3" rounded="full" />
    </div>
  );
}

/** Skeleton that matches a trip card in the profile page */
export function SkeletonTripCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white rounded-2xl p-6 shadow-card border border-slate-100', className)}>
      <Skeleton width="w-1/2" height="h-5" rounded="md" className="mb-2" />
      <Skeleton width="w-1/3" height="h-3" rounded="full" className="mb-4" />
      <Skeleton width="w-20" height="h-6" rounded="full" />
    </div>
  );
}
