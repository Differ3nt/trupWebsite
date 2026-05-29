import { Loader2 } from '@/components/icons';
import { cn } from '@/lib/utils';

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
} as const;

interface SpinnerProps {
  /** Visual size of the circle. Defaults to `md`. */
  size?: keyof typeof sizeMap;
  /** Extra classes (e.g. a color override like `text-on-surface`). */
  className?: string;
  /** Accessible label announced to screen readers. */
  label?: string;
}

/**
 * Standalone circular spinner. Use for inline / section-level "working…"
 * feedback that is not inside a Button (the Button owns its own spinner via
 * `isLoading`). Inherits color from `currentColor` so it adapts to context.
 */
export function Spinner({ size = 'md', className, label = 'Ładowanie' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2 className={cn('animate-spin text-primary', sizeMap[size], className)} />
    </span>
  );
}
