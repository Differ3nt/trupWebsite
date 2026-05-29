'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full bg-surface-container-low text-on-surface text-sm px-4 py-3',
        'border border-outline-variant/30 focus:outline-none focus:border-primary',
        'placeholder:text-on-surface-variant/40 disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-200 resize-y min-h-[100px]',
        error && 'border-error focus:border-error',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
