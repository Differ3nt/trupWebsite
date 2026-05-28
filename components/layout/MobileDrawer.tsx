'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import Link from 'next/link';
import { NavItem } from './NavItem';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: Array<{ href: string; label: string; badge?: string }>;
}

export function MobileDrawer({ isOpen, onClose, navLinks }: MobileDrawerProps) {
  const { data: session } = useSession();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-40 bg-surface flex flex-col items-center justify-center p-6 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
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
              <NavItem href="/admin" label="Panel" />
            )}
            <NavItem href="/profil" label="Profil" />
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="text-[10px] font-bold tracking-widest uppercase text-on-surface-variant hover:text-primary transition-colors"
            >
              Wyloguj się
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
            Zaloguj się
          </button>
        )}
      </div>
    </div>
  );
}
