'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Menu, X, Bell, User } from '@/components/icons';
import { cn } from '@/lib/utils';
import { NavItem } from './NavItem';
import { MobileDrawer } from './MobileDrawer';

const NAV_LINKS = [
  { href: '/', label: 'Strona główna' },
  { href: '/wydarzenia', label: 'Wydarzenia' },
  { href: '/aktualnosci', label: 'Aktualności', badge: 'soon' },
  { href: '/wiki', label: 'Wiki', badge: 'soon' },
  { href: '/galeria', label: 'Galeria', badge: 'soon' },
  { href: '/o-nas', label: 'O nas', badge: 'soon' },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 h-14 md:h-16 bg-black/40 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center h-full">
          <div className="flex-1 justify-start">
            <Link href="/">
              <img
                src="/logo.png"
                alt="TRUP"
                className="h-8 md:h-11 w-auto invert brightness-0 hover:scale-110 transition-transform"
              />
            </Link>
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
            {NAV_LINKS.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                badge={link.badge}
                active={isActive(link.href)}
                aria-current={isActive(link.href) ? 'page' : undefined}
              />
            ))}
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
            {status === 'authenticated' && session?.user ? (
              <>
                {session.user.role === 'ADMIN' && (
                  <NavItem href="/admin" label="Panel" />
                )}
                <NavItem icon={<Bell size={16} />} aria-label="Powiadomienia" />
                <NavItem href="/profil" icon={<User size={16} />} />
              </>
            ) : status === 'authenticated' ? (
              <>
                <NavItem href="/profil" icon={<User size={16} />} />
              </>
            ) : (
              status === 'unauthenticated' && (
                <NavItem
                  label="Zaloguj się"
                  onClick={() => signIn('google')}
                />
              )
            )}

            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="lg:hidden p-2 text-on-surface hover:text-primary transition-colors"
              aria-label="Toggle menu"
            >
              {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        navLinks={NAV_LINKS}
      />
    </>
  );
}
