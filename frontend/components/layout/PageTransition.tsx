'use client';

/**
 * PageTransition — wraps {children} in the root layout with a subtle
 * fade + slide animation on every route change.
 *
 * Using a keyed motion.div (key = pathname) instead of AnimatePresence
 * so that enter animations always play without needing an exit — which
 * would require waiting for the previous page to unmount first and can
 * cause visual jitter with Next.js App Router's streaming architecture.
 */

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="flex-1 flex flex-col min-w-0"
    >
      {children}
    </motion.div>
  );
}
