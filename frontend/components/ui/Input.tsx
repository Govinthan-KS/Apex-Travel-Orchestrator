'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible label — floats to top when focused or filled */
  label: string;
  /** Red error message shown below the input */
  error?: string;
  /** Grey hint text shown below the input (hidden when error is present) */
  hint?: string;
  /** PrimeIcons class name for a leading icon, e.g. "pi-map-marker" */
  leftIcon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, className, id, ...props }, ref) => {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="relative w-full">
        {/* Leading icon */}
        {leftIcon && (
          <i
            className={cn(
              'pi absolute left-4 top-1/2 -translate-y-1/2 text-sm pointer-events-none z-10',
              error ? 'text-apex-error' : 'text-apex-text-tertiary'
            )}
            data-icon={leftIcon}
            style={{ fontFamily: 'primeicons' }}
            aria-hidden="true"
          >
            {/* primeicons renders via ::before pseudo-element on the data-icon attribute */}
          </i>
        )}

        {/*
          placeholder=" " (a single space) is required for the CSS
          :placeholder-shown selector to detect whether the field is empty.
          The label moves to center when placeholder is shown (empty).
        */}
        <input
          ref={ref}
          id={inputId}
          placeholder=" "
          className={cn(
            'peer w-full bg-white rounded-xl px-4 pt-6 pb-2',
            'text-sm font-medium text-apex-text-primary',
            'border transition-all duration-200 outline-none',
            'placeholder-transparent', // visually hide the space placeholder
            error
              ? 'border-apex-error focus:border-apex-error focus:ring-2 focus:ring-apex-error/10'
              : 'border-slate-200 focus:border-apex-indigo focus:ring-2 focus:ring-apex-indigo/10',
            leftIcon ? 'pl-10' : 'pl-4',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />

        {/* Floating label */}
        <label
          htmlFor={inputId}
          className={cn(
            // Base: label floated at top (small)
            'absolute top-2 text-xs font-medium pointer-events-none transition-all duration-200',
            leftIcon ? 'left-10 peer-focus:left-4' : 'left-4',
            // When input is empty: label sinks to vertical center, normal size
            'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2',
            'peer-placeholder-shown:text-base peer-placeholder-shown:font-normal',
            // When focused: float back to top
            'peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-medium',
            error
              ? 'text-apex-error peer-focus:text-apex-error'
              : 'text-apex-text-tertiary peer-focus:text-apex-indigo'
          )}
        >
          {label}
        </label>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-xs font-medium text-apex-error"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Hint text (shown when no error) */}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-apex-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
