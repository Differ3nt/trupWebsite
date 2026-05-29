'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

interface ImageLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Classes for the positioning wrapper (set aspect ratio / size here). */
  wrapperClassName?: string;
  /** Classes for the skeleton shown while loading. */
  skeletonClassName?: string;
}

/**
 * Lazy-loading image with a skeleton placeholder that cross-fades to the photo
 * once decoded, and a graceful fallback if the image fails. Use everywhere a
 * remote/uploaded photo is shown in a fixed box (album grids, cards, headers)
 * so loading feedback is consistent and never a blank gap.
 */
export function ImageLoader({
  src,
  alt,
  className,
  wrapperClassName,
  skeletonClassName,
  ...imgProps
}: ImageLoaderProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [errored, setErrored] = React.useState(false);

  return (
    <div className={cn('relative overflow-hidden', wrapperClassName)}>
      {!loaded && !errored && (
        <Skeleton className={cn('absolute inset-0 h-full w-full', skeletonClassName)} />
      )}
      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-dim text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          Brak obrazu
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          {...imgProps}
        />
      )}
    </div>
  );
}
