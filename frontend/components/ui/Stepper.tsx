'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepperProps {
  /** Total number of steps */
  total: number;
  /** Current active step (0-indexed) */
  current: number;
  className?: string;
}

export function Stepper({ total, current, className }: StepperProps) {
  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {/* Dots + connecting lines */}
      <div className="flex items-center">
        {Array.from({ length: total }).map((_, i) => {
          const done   = i < current;
          const active = i === current;

          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              {/* Step dot */}
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
                  done   && 'bg-apex-indigo',
                  active && 'bg-white border-2 border-apex-indigo shadow-sm',
                  !done && !active && 'bg-slate-200'
                )}
                aria-hidden="true"
              >
                {done && (
                  <i
                    className="pi pi-check text-white"
                    style={{ fontSize: '10px' }}
                    aria-hidden="true"
                  />
                )}
                {active && (
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-apex-indigo apex-pulse-dot"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Connecting line — not after last dot */}
              {i < total - 1 && (
                <div className="flex-1 h-0.5 mx-1.5 relative rounded-full overflow-hidden bg-slate-200">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-apex-indigo rounded-full"
                    initial={false}
                    animate={{ width: i < current ? '100%' : '0%' }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step counter text */}
      <p className="text-xs text-apex-text-tertiary">
        Step {current + 1} of {total}
      </p>
    </div>
  );
}
