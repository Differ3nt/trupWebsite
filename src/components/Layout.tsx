import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { User, Menu, X, Bell, Search, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { role, loginWithGoogle, logout } = useAppContext();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Close overlays on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location]);

  // Handle search fetch
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(data.results || []);
        })
        .catch(err => console.error('Search error:', err));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    { to: '/wiki', label: 'Wiki' },
  ];

  // Dodatkowe linki tylko dla zalogowanych
  const authNavLinks = [
    { to: '/aktualnosci', label: 'Aktualności' },
  ];

  return (
    <div className="min-h-screen selection:bg-primary selection:text-surface flex flex-col bg-surface">
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
      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-surface flex flex-col p-6 md:p-12"
          >
            <div className="flex justify-between items-center mb-12">
               <span className="font-display font-black text-2xl uppercase tracking-tighter text-primary">SZUKAJ W BAZIE</span>
               <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:text-primary transition-colors">
                 <X size={40} strokeWidth={1.5} />
               </button>
            </div>
            
            <div className="max-w-4xl mx-auto w-full">
               <input 
                 autoFocus
                 type="text" 
                 placeholder="WPISZ MIN. 3 ZNAKI..." 
                 className="w-full bg-transparent border-b-4 border-primary p-4 md:p-8 text-3xl md:text-5xl font-display font-black uppercase outline-none placeholder:text-on-surface-variant/20"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
               
               <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {searchResults.map((result: any, idx: number) => (
                    <Link 
                      key={idx} 
                      to={result.url} 
                      className="group flex flex-col gap-2 p-4 border border-outline-variant/30 hover:border-primary transition-colors"
                    >
                       <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{result.type}</span>
                       <span className="font-display font-black text-xl uppercase leading-tight group-hover:text-primary transition-colors">{result.title}</span>
                       <span className="text-sm text-on-surface-variant line-clamp-2">{result.description}</span>
                    </Link>
                  ))}
                  {searchQuery.length >= 3 && searchResults.length === 0 && (
                    <p className="text-on-surface-variant uppercase tracking-widest font-bold">Brak wyników w Twojej sieci Proxmox.</p>
                  )}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 w-full z-50 flex items-center px-6 md:px-12 h-8 md:h-10 transition-all duration-300 ${isScrolled ? 'bg-surface/90 backdrop-blur-md border-b border-outline-variant/20' : 'bg-transparent'}`}>
        {/* Logo */}
        <div className="flex-1 flex justify-start">
          <Link 
            to="/" 
            className="flex items-center group z-50"
          >
            <img 
              src="/logo.png" 
              alt="TRUP Logo" 
              className="h-5 md:h-7 w-auto invert brightness-0 group-hover:scale-110 transition-transform"
            />
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
          {role !== 'guest' && authNavLinks.map((link) => (
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
          <button onClick={() => setIsSearchOpen(true)} className="text-on-surface hover:text-primary transition-colors">
            <Search size={18} strokeWidth={2.5} />
          </button>
          
          {role !== 'guest' && (
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)} 
                className="text-on-surface hover:text-primary transition-colors relative"
              >
                <Bell size={18} strokeWidth={2.5} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#b63f75] text-surface text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

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
          )}
          
          {role !== 'guest' ? (
             <div className="hidden lg:flex items-center gap-6">
              <Link to="/admin" className="text-on-surface-variant hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest mt-0.5">
                 Panel Admina
              </Link>
              <Link to="/profil" className="text-on-surface hover:text-primary transition-colors flex items-center gap-2 group">
                <User size={20} strokeWidth={2.5} />
                <span className="text-[10px] font-bold uppercase tracking-widest hidden xl:inline group-hover:text-primary transition-colors">Profil</span>
              </Link>
              <button onClick={() => logout()} className="text-[10px] font-bold uppercase tracking-widest text-[#b63f75] hover:opacity-80 transition-colors">Wyloguj</button>
             </div>
          ) : (
             <button onClick={() => loginWithGoogle()} className="hidden lg:block text-xs font-bold uppercase tracking-widest text-on-surface hover:text-primary transition-colors">
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

      <main className="flex-1 pt-10 md:pt-12">
        <Outlet />
      </main>

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

