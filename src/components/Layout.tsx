import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { User, Menu, X, Bell, Search, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { role, setRole } = useAppContext();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Lock scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const navLinks = [
    { to: '/', label: 'Strona główna' },
    { to: '/aktualnosci', label: 'Aktualności' },
    { to: '/wydarzenia', label: 'Wydarzenia' },
    { to: '/galeria', label: 'Galeria' },
    { to: '/o-nas', label: 'O nas' },
    { to: '/wiki', label: 'Wiki' },
  ];

  return (
    <div className="min-h-screen selection:bg-primary selection:text-surface flex flex-col bg-surface">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 w-full z-50 flex items-center px-6 md:px-12 h-20 md:h-24 bg-transparent">
        {/* Logo */}
        <div className="flex-1 flex justify-start">
          <Link 
            to="/" 
            className="text-2xl font-black tracking-tighter text-on-surface font-display uppercase hover:text-primary transition-colors z-50"
          >
            TRUP
          </Link>
        </div>

        {/* Desktop Links Center */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.to} 
              to={link.to} 
              className="text-on-surface-variant text-xs font-bold tracking-widest uppercase hover:text-primary transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Profile & Mobile Toggle */}
        <div className="flex-1 flex justify-end items-center gap-4">
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="text-on-surface hover:text-primary transition-colors">
            <Search size={20} strokeWidth={2.5} />
          </button>
          
          {role !== 'guest' ? (
             <div className="hidden lg:flex items-center gap-4">
              <Link to="/admin" className="text-on-surface-variant hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest mt-1">
                 Panel Admina
              </Link>
              <button className="text-on-surface hover:text-primary transition-colors relative">
                <Bell size={20} strokeWidth={2.5} />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </button>
              <Link to="/profil" className="text-on-surface hover:text-primary transition-colors">
                <User size={20} strokeWidth={2.5} />
              </Link>
              <button onClick={() => setRole('guest')} className="text-xs font-bold uppercase tracking-widest text-[#b63f75] hover:opacity-80 transition-colors ml-2">Wyloguj</button>
             </div>
          ) : (
             <button onClick={() => setRole('user')} className="hidden lg:block text-xs font-bold uppercase tracking-widest text-on-surface hover:text-primary transition-colors">
               Zaloguj
             </button>
          )}

          {/* Mobile Toggle */}
          <button 
            onClick={toggleMenu}
            className="lg:hidden z-50 text-on-surface p-2 hover:text-primary transition-colors focus:outline-none"
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
                  className="text-2xl font-display font-black uppercase tracking-tighter text-on-surface hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="w-12 h-0.5 bg-outline-variant/30 my-4"></div>
              <Link
                to="/profil"
                className="flex items-center gap-3 text-xl font-display font-black uppercase tracking-tighter text-on-surface hover:text-primary transition-colors"
              >
                <User size={24} strokeWidth={3} />
                Profil
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 md:px-12 flex flex-col lg:flex-row justify-between items-center gap-8 bg-[#f9f9f8] text-[#37392E] mt-auto">
        <div className="text-center lg:text-left">
          <div className="text-xl font-black font-display uppercase tracking-tighter mb-2">
            TRUP
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
              className="text-[#37392E]/70 font-sans text-[10px] tracking-widest uppercase hover:text-[#37392E] transition-colors duration-200"
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

