/**
 * cn — className merge helper.
 * Filters falsy values and joins remaining classes.
 * Lightweight alternative to clsx for this project's needs.
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
