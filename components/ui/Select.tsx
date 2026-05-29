'use client';
import * as React from 'react';
import { ChevronDown } from '@/components/icons';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none bg-surface-container-low text-on-surface text-sm px-4 py-3 pr-10',
          'border border-outline-variant/30 focus:outline-none focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          'transition-colors duration-200',
          error && 'border-error focus:border-error',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-on-surface-variant pointer-events-none"
      />
    </div>
  )
);
Select.displayName = 'Select';
