import * as React from 'react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function ErrorState({ icon, title, description, action, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-4', className)}>
      {icon && <div className="mb-4 text-error">{icon}</div>}
      <h3 className="font-display text-2xl uppercase tracking-tighter text-error mb-2">{title}</h3>
      {description && <p className="text-sm text-on-surface-variant max-w-md mb-6">{description}</p>}
      {action}
    </div>
  );
}
