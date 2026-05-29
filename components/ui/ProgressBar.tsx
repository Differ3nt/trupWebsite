import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /**
   * Completion 0–100. Omit (or pass `undefined`) for an indeterminate bar
   * that sweeps continuously — use that when the total isn't known yet.
   */
  value?: number;
  /** Track height. Defaults to `sm` (a thin 2px line). */
  size?: 'sm' | 'md' | 'lg';
  /** Extra classes on the outer track. */
  className?: string;
  /** Accessible label for the progress region. */
  label?: string;
}

const heightMap = {
  sm: 'h-0.5',
  md: 'h-1',
  lg: 'h-2',
} as const;

/**
 * Horizontal progress bar for loading a larger piece of content inside a box
 * on the page — a full-resolution image, an embedded map, a heavy panel.
 * Determinate when `value` is provided, indeterminate otherwise.
 */
export function ProgressBar({ value, size = 'sm', className, label = 'Postęp ładowania' }: ProgressBarProps) {
  const indeterminate = value == null;
  const clamped = indeterminate ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : clamped}
      className={cn('relative w-full overflow-hidden bg-white/10', heightMap[size], className)}
    >
      <div
        className={cn(
          'h-full bg-primary',
          indeterminate
            ? 'w-full origin-left [animation:var(--animate-indeterminate)]'
            : 'transition-[width] duration-150 ease-out'
        )}
        style={indeterminate ? undefined : { width: `${clamped}%` }}
      />
    </div>
  );
}
