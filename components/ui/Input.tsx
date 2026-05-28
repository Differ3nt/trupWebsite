'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full bg-surface-container-low text-on-surface text-sm px-4 py-3',
        'border border-outline-variant/30 focus:outline-none focus:border-primary',
        'placeholder:text-on-surface-variant/40 disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        error && 'border-error focus:border-error',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
