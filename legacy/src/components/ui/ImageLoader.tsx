import React, { useState } from 'react';
import { Skeleton } from './Skeleton';
import { cn } from '../../lib/utils';

interface ImageLoaderProps {
  src: string;
  alt?: string;
  className?: string;
  skeletonClassName?: string;
  children: (imgProps: { src: string; onLoad: () => void; className: string }) => React.ReactNode;
}

export function ImageLoader({ src, alt, className, skeletonClassName, children }: ImageLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {!loaded && (
        <Skeleton className={cn('absolute inset-0 w-full h-full rounded-none', skeletonClassName)} />
      )}
      <div className={cn('transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}>
        {children({
          src,
          onLoad: () => setLoaded(true),
          className: 'w-full h-full object-cover',
        })}
      </div>
    </div>
  );
}
