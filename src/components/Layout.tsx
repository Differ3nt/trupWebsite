import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { User } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen selection:bg-primary-container selection:text-white flex flex-col bg-surface">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-24 bg-transparent">
        <Link to="/" className="text-2xl font-black tracking-tighter text-on-surface font-display uppercase hover:text-primary transition-colors">
          TRUP
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/o-nas" className="text-on-surface-variant text-xs font-bold tracking-widest uppercase hover:text-primary transition-colors">O nas</Link>
          <Link to="/wydarzenia" className="text-on-surface-variant text-xs font-bold tracking-widest uppercase hover:text-primary transition-colors">Wydarzenia</Link>
          <Link to="/galeria" className="text-on-surface-variant text-xs font-bold tracking-widest uppercase hover:text-primary transition-colors">Galeria</Link>
          <Link to="/wiki" className="text-on-surface-variant text-xs font-bold tracking-widest uppercase hover:text-primary transition-colors">Wiki</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/profil" className="text-on-surface hover:text-primary transition-colors">
            <User size={20} strokeWidth={2.5} />
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 md:px-12 flex flex-col lg:flex-row justify-between items-center gap-8 bg-[#111] text-white mt-auto">
        <div className="text-center lg:text-left">
          <div className="text-xl font-black font-display uppercase tracking-tighter mb-2">
            TRUP
          </div>
          <div className="text-[#888] font-sans text-[10px] tracking-widest uppercase">
            © 2024 GRUPA GÓRSKA. BUILT FOR THE MONOLITH.
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {['Instagram', 'Facebook', 'Kontakt', 'Prywatność'].map((link) => (
            <a 
              key={link} 
              href="#" 
              className="text-[#888] font-sans text-[10px] tracking-widest uppercase hover:text-white transition-colors duration-200"
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

