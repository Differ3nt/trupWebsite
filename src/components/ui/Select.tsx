import React from "react";
import { cn } from "../../lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          "flex w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm transition-all focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
          error && "border-error focus:border-error",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

export { Select };
