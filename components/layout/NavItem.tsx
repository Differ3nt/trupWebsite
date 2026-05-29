'use client';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

interface NavItemProps {
  label?: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: number | string | null;
  className?: string;
  'aria-label'?: string;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | true | false;
}

export function NavItem({
  label,
  icon,
  href,
  onClick,
  active = false,
  badge,
  className,
  'aria-label': ariaLabel,
  'aria-current': ariaCurrent,
}: NavItemProps) {
  const baseClasses =
    'relative text-[10px] font-bold tracking-widest uppercase whitespace-nowrap inline-flex items-center gap-1 transition-colors duration-200';

  const stateClasses = active
    ? 'text-primary'
    : 'text-on-surface-variant hover:text-primary';

  const badgeClasses = badge
    ? 'absolute -top-2 -right-2'
    : '';

  const element = (
    <>
      {icon && <span className="flex items-center justify-center">{icon}</span>}
      {label && <span>{label}</span>}
      {badge && (
        <span
          className={cn(
            badgeClasses,
            typeof badge === 'number'
              ? 'min-w-[14px] h-[14px] flex items-center justify-center text-[7px] font-black text-surface bg-primary'
              : 'text-[7px] font-black px-1 text-surface tracking-wider',
            badge === 'alpha' && 'bg-blue-500',
            badge === 'soon' && 'bg-primary'
          )}
        >
          {badge}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(baseClasses, stateClasses, className)}
        aria-label={ariaLabel}
        aria-current={active && !ariaCurrent ? 'page' : ariaCurrent}
      >
        {element}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(baseClasses, stateClasses, className)}
      role="button"
      aria-label={ariaLabel}
      aria-current={active && !ariaCurrent ? 'page' : ariaCurrent}
    >
      {element}
    </button>
  );
}
