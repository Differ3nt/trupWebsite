import { Skeleton } from '@/components/ui/Skeleton';
import { TopProgressBar } from '@/components/layout/TopProgressBar';
import { cn } from '@/lib/utils';

type PageSkeletonVariant = 'list' | 'grid' | 'detail' | 'form' | 'default';

interface PageSkeletonProps {
  variant?: PageSkeletonVariant;
  /** Number of repeated blocks for list/grid variants. */
  count?: number;
}

/**
 * Reusable loading screen: a top route-transition bar plus a content-shaped
 * skeleton matching the page layout. Rendered from route-level `loading.tsx`
 * Suspense fallbacks so every server-rendered route shows consistent loading
 * feedback during navigation. Pick the `variant` closest to the page shape.
 */
export function PageSkeleton({ variant = 'default', count = 6 }: PageSkeletonProps) {
  return (
    <>
      <TopProgressBar />
      <div className="mx-auto max-w-6xl px-4 py-24">
        {/* Header */}
        <Skeleton className="mb-3 h-10 w-64" />
        <Skeleton className="mb-12 h-4 w-96 max-w-full" />

        {variant === 'grid' && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
        )}

        {variant === 'list' && (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        )}

        {variant === 'detail' && (
          <div className="space-y-6">
            <Skeleton className="h-72 w-full" />
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-4/6" />
                <Skeleton className="h-40 w-full" />
              </div>
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        )}

        {variant === 'form' && (
          <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        )}

        {variant === 'default' && (
          <div className={cn('space-y-4')}>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        )}
      </div>
    </>
  );
}
