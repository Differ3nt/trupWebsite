import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface Props {
  children: ReactNode;
  className?: string;
}

export function PhotoWatermark({ children, className }: Props) {
  return (
    <div className={cn('relative', className)}>
      {children}
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        className="absolute bottom-2 right-2 w-[15%] min-w-[48px] max-w-[120px] pointer-events-none select-none opacity-90"
        style={{ filter: 'brightness(0) invert(1) drop-shadow(0 1px 4px rgba(0,0,0,0.85))' }}
      />
    </div>
  );
}
