'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-[10px] text-on-surface-variant/60 tracking-wide">{hint}</p>
      )}
      {error && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-error">{error}</p>
      )}
    </div>
  );
}
