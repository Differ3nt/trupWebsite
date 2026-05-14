import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "warning" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      asChild = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: "bg-primary text-surface ring-2 ring-inset ring-primary hover:bg-white hover:text-primary hover:ring-white",
      secondary: "bg-black/60 backdrop-blur-md text-on-surface ring-2 ring-inset ring-white/10 hover:bg-white hover:text-surface hover:ring-white",
      danger: "bg-surface-variant text-on-surface ring-2 ring-inset ring-error hover:bg-error hover:text-white hover:ring-error",
      warning: "bg-black/60 backdrop-blur-md text-on-surface ring-2 ring-inset ring-white/10 hover:bg-yellow-100 hover:text-amber-600 hover:ring-yellow-200",
      outline: "bg-transparent text-on-surface ring-2 ring-inset ring-white/20 hover:ring-primary hover:text-primary",
      ghost: "bg-transparent text-on-surface hover:bg-white/5",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-[10px]",
      md: "px-6 py-3 text-xs",
      lg: "px-8 py-4 text-sm",
      icon: "p-2",
    };

    if (asChild) {
      const child = React.isValidElement(children) ? (children as React.ReactElement<any>) : null;
      return (
        <Slot
          ref={ref}
          className={cn(
            "inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            variants[variant],
            sizes[size],
            className
          )}
          {...props}
        >
          {child ? React.cloneElement(child, {
            disabled: isLoading || disabled,
            children: (
              <>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {child.props.children}
                {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
              </>
            )
          }) : children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          "inline-flex items-center justify-center font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
