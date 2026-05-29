import React from "react";
import { cn } from "../../lib/utils";

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "w-4 h-4 bg-surface border border-outline-variant/50 accent-primary focus:ring-0 focus:ring-offset-0",
            className
          )}
          {...props}
        />
        {label && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
