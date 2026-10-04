import { cn } from '@/lib/utils';

type MaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
type Padding = 'none' | 'sm' | 'md' | 'lg';

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Max-width of the content container */
  maxWidth?: MaxWidth;
  /** Horizontal padding on the container */
  padding?: Padding;
  /**
   * Add top padding to clear the fixed navbar (h-16 = 64px).
   * Set to false for pages that intentionally start behind the navbar (landing hero).
   */
  withNavOffset?: boolean;
}

const MAX_WIDTHS: Record<MaxWidth, string> = {
  sm:   'max-w-sm',
  md:   'max-w-2xl',
  lg:   'max-w-4xl',
  xl:   'max-w-6xl',
  '2xl':'max-w-7xl',
  full: 'max-w-none',
};

const PADDINGS: Record<Padding, string> = {
  none: 'px-0',
  sm:   'px-4',
  md:   'px-6',
  lg:   'px-8',
};

/**
 * PageShell — consistent page wrapper.
 *
 * Usage:
 *   <PageShell withNavOffset maxWidth="xl">
 *     {children}
 *   </PageShell>
 *
 * For landing page heroes that start behind the navbar, use withNavOffset={false}
 * and manage the top offset within the hero section itself.
 */
export function PageShell({
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  withNavOffset = true,
}: PageShellProps) {
  return (
    <main
      className={cn(
        'min-h-screen w-full',
        withNavOffset && 'pt-16', // clear the fixed navbar
        className
      )}
    >
      <div className={cn('mx-auto w-full', MAX_WIDTHS[maxWidth], PADDINGS[padding])}>
        {children}
      </div>
    </main>
  );
}
