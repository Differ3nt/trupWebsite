'use client';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Menu, X, User } from '@/components/icons';
import { cn } from '@/lib/utils';
import { NavItem } from './NavItem';
import { MobileDrawer } from './MobileDrawer';
import { NotificationDropdown } from './NotificationDropdown';

export function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const NAV_LINKS = [
    { href: '/', label: t('home') },
    { href: '/wydarzenia', label: t('events') },
    { href: '/aktualnosci', label: t('news'), badge: 'soon' },
    { href: '/wiki', label: t('wiki') },
    { href: '/galeria', label: t('gallery'), badge: 'soon' },
    { href: '/o-nas', label: t('about'), badge: 'soon' },
  ];

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
                  <NavItem href="/admin" label={t('panel')} />
                )}
                <NotificationDropdown />
                <NavItem href="/profil" icon={<User size={16} />} />
              </>
            ) : status === 'authenticated' ? (
              <>
                <NavItem href="/profil" icon={<User size={16} />} />
              </>
            ) : (
              status === 'unauthenticated' && (
                <NavItem
                  label={t('login')}
                  onClick={() => signIn('google')}
                />
              )
            )}

            <button
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="lg:hidden p-2 text-on-surface hover:text-primary transition-colors"
              aria-label={t('toggleMenu')}
            >
              {isDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} navLinks={NAV_LINKS} />
    </>
  );
}
