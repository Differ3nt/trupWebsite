import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface NavItemProps {
  label?: string;
  icon?: React.ReactNode;
  to?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number | string | null;
  className?: string;
  noUnderline?: boolean;
}

/**
 * Unified template for all navigation items in the header.
 * Supports both internal links and button actions (like notifications).
 */
export function NavItem({ label, icon, to, onClick, active, badge, className, noUnderline }: NavItemProps) {
  const content = (
    <>
      {icon ? (
        <span className="relative z-10 flex items-center justify-center">
          {icon}
        </span>
      ) : (
        <span className="relative z-10">{label}</span>
      )}
      {badge !== undefined && badge !== null && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            "absolute min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-primary text-[7px] font-black text-surface z-20 px-1 shadow-sm",
            icon ? "-top-1 -right-1" : "-top-2 -right-2"
          )}
        >
          {badge}
        </motion.span>
      )}
    </>
  );

  const baseClasses = cn(
    "relative text-sm font-sans font-bold tracking-[0.05em] uppercase transition-colors whitespace-nowrap inline-block",
    !noUnderline && "link-underline",
    active ? "text-primary after:scale-x-100" : "text-on-surface-variant hover:text-primary",
    className
  );

  if (to) {
    return (
      <Link to={to} className={baseClasses} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <div 
      onClick={onClick} 
      role="button"
      tabIndex={0}
      className={cn(baseClasses, "cursor-pointer")}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {content}
    </div>
  );
}
