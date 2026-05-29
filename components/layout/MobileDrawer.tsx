'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { X } from '@/components/icons';
import { NavItem } from './NavItem';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ href: string; label: string; badge?: string }>;
}

export function MobileDrawer({ isOpen, onClose, navLinks }: MobileDrawerProps) {
  const { data: session } = useSession();
  const t = useTranslations('nav');
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) drawerRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  return (
    <div
      ref={drawerRef}
      tabIndex={-1}
      role="navigation"
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-40 bg-surface flex flex-col items-center justify-center p-6 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <nav className="flex flex-col items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="font-display text-4xl uppercase text-on-surface hover:text-primary transition-colors"
          >
            {link.label}
            {link.badge && (
              <span className="ml-2 text-[14px] font-black px-1 text-surface bg-primary inline-block">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="w-12 h-px bg-outline-variant/30 my-6" />

      <div className="flex flex-col items-center gap-4">
        {session?.user ? (
          <>
            {session.user.role === 'ADMIN' && (
              <NavItem href="/admin" label={t('panel')} />
            )}
            <NavItem href="/profil" label={t('profile')} />
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              {t('logout')}
            </button>
          </>
        ) : (
          <button
            onClick={() => {
              signIn('google');
              onClose();
            }}
            className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
          >
            {t('login')}
          </button>
        )}
      </div>
    </div>
  );
}
