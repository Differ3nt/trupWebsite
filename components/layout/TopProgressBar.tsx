import { cn } from '@/lib/utils';

interface TopProgressBarProps {
  /** Extra classes for the fixed wrapper. */
  className?: string;
}

/**
 * Thin indeterminate progress line pinned directly below the fixed Navbar,
 * spanning the full page width. Rendered from route-level `loading.tsx`
 * Suspense fallbacks, so it appears automatically during route transitions
 * while the server component streams. Purely presentational.
 */
export function TopProgressBar({ className }: TopProgressBarProps) {
  return (
    <div
      role="status"
      aria-label="Ładowanie strony"
      className={cn(
        'fixed left-0 right-0 top-14 z-[60] h-0.5 overflow-hidden bg-transparent md:top-16',
        className
      )}
    >
      <div className="h-full w-full origin-left bg-primary [animation:var(--animate-indeterminate)]" />
    </div>
  );
}
