import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { User, Menu, X, Bell, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';
import ConfirmationModal from './ConfirmationModal';
import { NavItem } from './ui/NavItem';
import { Toaster } from 'sonner';
import { cn } from '../lib/utils';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [useMobileNav, setUseMobileNav] = useState(false);
  const navRef = React.useRef<HTMLElement>(null);
  const linksRef = React.useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { role, loginWithGoogle, logout, modal, setModal, isModalOpen, setIsModalOpen } = useAppContext();
  
  const handleLinkClick = (to: string) => {
    if (location.pathname === to) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      if (navRef.current && linksRef.current) {
        // Zapas na logo (ok 120px) i akcje po prawej (ok 200px) + marginesy
        const availableWidth = navRef.current.offsetWidth - 400; 
        setUseMobileNav(linksRef.current.scrollWidth > availableWidth || window.innerWidth < 1024);
      }
    };

    const resizeObserver = new ResizeObserver(checkOverflow);
    if (navRef.current) resizeObserver.observe(navRef.current);
    
    checkOverflow();
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Sync body class with modal state to avoid expensive re-renders in Layout
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-active');
    } else {
      document.body.classList.remove('modal-active');
    }
    return () => document.body.classList.remove('modal-active');
  }, [isModalOpen]);

  // Close overlays on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandaloneMode = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
    setIsIOS(isIOSDevice);
    setIsStandalone(!!isStandaloneMode);
    
    if (isIOSDevice && !isStandaloneMode) {
      setShowIOSBanner(true);
    }
  }, []);

  useEffect(() => {
    if (role !== 'guest') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // co minutę
      return () => clearInterval(interval);
    }
  }, [role]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/push');
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch (err) {
      console.error('Fetch notif error:', err);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/push/${id}/read`, { method: 'PATCH' });
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navLinks = [
    { to: '/', label: 'Strona główna' },
    { to: '/wydarzenia', label: 'Wydarzenia' },
    { to: '/aktualnosci', label: 'Aktualności' },
    { to: '/wiki', label: 'Wiki' },
    { to: '/galeria', label: 'Galeria' },
    { to: '/o-nas', label: 'O nas' },
  ];

  return (
    <div className="min-h-screen selection:bg-primary selection:text-surface flex flex-col bg-surface relative">
      {/* iOS PWA Banner */}
      <AnimatePresence>
        {showIOSBanner && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 w-full z-[100] bg-primary text-surface p-4 shadow-xl"
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-surface/20 p-2 rounded-lg">
                   <LogOut size={20} className="-rotate-90" />
                </div>
                <p className="text-xs font-bold uppercase tracking-tight leading-tight">
                  Aby otrzymywać powiadomienia, dodaj TRUPa do ekranu głównego: 
                  <span className="block opacity-80 text-[10px]">Kliknij Udostępnij -&gt; Do ekranu początkowego</span>
                </p>
              </div>
              <button onClick={() => setShowIOSBanner(false)} className="p-1 hover:bg-surface/20 rounded">
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav ref={navRef} className="fixed top-0 left-0 w-full z-50 flex items-center px-6 md:px-12 h-12 md:h-16 bg-black/40 backdrop-blur-md border-b border-white/5 transition-all duration-300">
        {/* Logo */}
        <div className="flex-1 flex justify-start">
          <Link 
            to="/" 
            className="flex items-center group z-50"
            onClick={() => handleLinkClick('/')}
          >
            <img 
              src="/logo.png" 
              alt="TRUP Logo" 
              className="h-8 md:h-11 w-auto invert brightness-0 group-hover:scale-110 transition-transform"
            />
          </Link>
        </div>

        {/* Desktop Links Center */}
        <div 
          ref={linksRef}
          className={cn(
            "hidden flex-[2] items-center justify-center gap-8 transition-opacity duration-300",
            !useMobileNav && "lg:flex"
          )}
        >
          {navLinks.map((link) => (
            <NavItem 
              key={link.to} 
              to={link.to} 
              label={link.label}
              active={location.pathname === link.to}
              onClick={() => handleLinkClick(link.to)}
            />
          ))}
        </div>

        {/* Desktop Profile & Mobile Toggle */}
        <div className="flex-1 flex justify-end items-center gap-4 md:gap-5">
          {role !== 'guest' ? (
            <div className="flex items-center gap-4 md:gap-5">
              {!useMobileNav && (
                <NavItem 
                  to="/admin" 
                  label="Panel"
                  active={location.pathname === '/admin'}
                />
              )}
              
              <div className="relative">
                {useMobileNav ? (
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className={cn(
                      "p-2 text-on-surface hover:text-primary transition-colors focus:outline-none relative z-50",
                      isNotifOpen && "text-primary"
                    )}
                  >
                    <Bell size={28} strokeWidth={2.5} />
                    {unreadCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-primary text-[8px] font-black text-surface z-20 px-1 shadow-sm"
                      >
                        {unreadCount}
                      </motion.span>
                    )}
                  </button>
                ) : (
                  <NavItem 
                    icon={<Bell size={20} />}
                    badge={unreadCount > 0 ? unreadCount : null}
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    active={isNotifOpen}
                    className="p-1"
                  />
                )}

                <AnimatePresence>
                  {isNotifOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 bg-surface border border-outline-variant/30 shadow-2xl z-50 p-4"
                      >
                        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/20 pb-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Powiadomienia</span>
                          <button onClick={() => setIsNotifOpen(false)}><X size={14} /></button>
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-primary/20">
                          {notifications.length > 0 ? notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => {
                                if (!n.isRead) markAsRead(n.id);
                                if (n.url) window.location.href = n.url;
                              }}
                              className={`p-3 border-l-2 transition-colors cursor-pointer ${n.isRead ? 'border-outline-variant/30 bg-surface' : 'border-primary bg-primary/5 hover:bg-primary/10'}`}
                            >
                               <p className="text-[10px] font-bold uppercase tracking-tight text-on-surface">{n.title}</p>
                               <p className="text-[10px] text-on-surface-variant leading-tight mt-1">{n.message}</p>
                               <p className="text-[8px] text-on-surface-variant/50 mt-1 uppercase tracking-widest">{new Date(n.createdAt).toLocaleDateString()}</p>
                            </div>
                          )) : (
                            <p className="text-center py-8 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant italic">Brak nowych alertów</p>
                          )}
                        </div>
                      </motion.div>
                      <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {!useMobileNav && (
                <NavItem 
                  to="/profil" 
                  label="Profil"
                  active={location.pathname === '/profil'}
                />
              )}
            </div>
          ) : (
            <NavItem 
              label="Zaloguj się"
              onClick={() => loginWithGoogle()}
            />
          )}

          {/* Mobile Toggle */}
          {useMobileNav && (
            <button 
              onClick={toggleMenu}
              className="z-50 text-on-surface p-2 hover:text-primary transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              <motion.div 
                initial={false}
                animate={{ rotate: isMenuOpen ? 90 : 0 }} 
                transition={{ duration: 0.2 }}
              >
                {isMenuOpen ? <X size={28} strokeWidth={2.5} /> : <Menu size={28} strokeWidth={2.5} />}
              </motion.div>
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 bg-surface flex flex-col items-center justify-center p-6"
          >
            <div className="flex flex-col items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-2xl font-display font-black uppercase text-on-surface hover:text-primary transition-colors"
                  onClick={() => handleLinkClick(link.to)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="w-12 h-0.5 bg-outline-variant/30 my-4"></div>
              {role !== 'guest' ? (
                <div className="flex flex-col items-center gap-6">
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 text-xl font-display font-black uppercase tracking-tighter text-on-surface hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Menu size={24} strokeWidth={3} />
                    Panel Admina
                  </Link>
                  <Link
                    to="/profil"
                    className="flex items-center gap-3 text-xl font-display font-black uppercase tracking-tighter text-on-surface hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={24} strokeWidth={3} />
                    Profil
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => {
                    loginWithGoogle();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-xl font-display font-black uppercase tracking-tighter text-on-surface hover:text-primary transition-colors"
                >
                  <User size={24} strokeWidth={3} />
                  Zaloguj się
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-24 md:pt-32">
        <Outlet />
      </main>

      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: 'var(--color-surface-container-low)',
            color: 'var(--color-on-surface)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: '0px',
            fontFamily: 'var(--font-sans)',
            textTransform: 'uppercase',
            fontSize: '10px',
            letterSpacing: '0.1em',
            fontWeight: 'bold'
          }
        }}
      />
      
      {modal && (
        <ConfirmationModal
          title={modal.title}
          message={modal.message}
          variant={modal.variant}
          onConfirm={modal.onConfirm}
          onClose={() => { setModal(null); setIsModalOpen(false); }}
          onDiscard={modal.onDiscard}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          discardText={modal.discardText}
        />
      )}

      {/* Footer */}
      <footer className="w-full py-12 px-6 md:px-12 flex flex-col lg:flex-row justify-between items-center gap-8 bg-[#f9f9f8] text-[#37392E] mt-auto">
        <div className="text-center lg:text-left">
          <div className="flex flex-col items-center lg:items-start mb-2">
            <img 
              src="/logo.png" 
              alt="TRUP Logo" 
              className="h-12 md:h-14 w-auto mb-2 grayscale opacity-80"
            />
            <div className="text-xl font-black font-display uppercase tracking-tighter">
              TRUP
            </div>
          </div>
          <div className="text-[#37392E]/60 font-sans text-[10px] tracking-widest uppercase">
            © 2024 GRUPA GÓRSKA. BUILT FOR THE MONOLITH.
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {['Instagram', 'Facebook', 'Kontakt', 'Prywatność'].map((link) => (
            <a 
              key={link} 
              href="#" 
              className="text-[#37392E]/70 font-sans text-[10px] tracking-widest uppercase transition-colors duration-200 link-underline link-underline-footer"
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
