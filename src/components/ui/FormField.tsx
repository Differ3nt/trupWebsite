import React from "react";
import { cn } from "../../lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
}

const FormField = ({
  label,
  required,
  error,
  description,
  children,
  className,
  ...props
}: FormFieldProps) => {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
        {label}
        {required && <span className="text-primary">*</span>}
      </label>
      {description && (
        <p className="text-[9px] text-primary/60 font-bold uppercase tracking-widest">
          {description}
        </p>
      )}
      {children}
      {error && (
        <p className="text-[9px] text-error font-bold uppercase tracking-widest">
          {error}
        </p>
      )}
    </div>
  );
};

export { FormField };
