import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "success" | "error" | "warning" | "outline";
}

const Badge = ({ className, variant = "primary", ...props }: BadgeProps) => {
  const variants = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-surface-variant/50 text-on-surface-variant",
    success: "bg-green-500/10 text-green-500",
    error: "bg-error/10 text-error",
    warning: "bg-yellow-500/10 text-yellow-600",
    outline: "border border-outline-variant/30 text-on-surface-variant",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

export { Badge };
