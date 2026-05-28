'use client';
import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <label className={cn('flex items-start gap-3 cursor-pointer group', className)}>
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          className="sr-only peer"
          {...props}
        />
        <div className={cn(
          'w-4 h-4 border border-outline-variant/50 bg-surface-container-low',
          'peer-checked:bg-primary peer-checked:border-primary',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-surface',
          'transition-colors duration-200',
          error && 'border-error'
        )} />
        <Check className="absolute inset-0 m-auto size-3 text-surface opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" strokeWidth={3} />
      </div>
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors select-none">
          {label}
        </span>
      )}
    </label>
  )
);
Checkbox.displayName = 'Checkbox';
