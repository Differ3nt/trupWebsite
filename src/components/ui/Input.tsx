import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm transition-all focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-error focus:border-error",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
