import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Component, Lock, ArrowRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function News() {
  const { role, loginWithGoogle } = useAppContext();

  if (role === 'guest') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="border border-outline-variant/30 bg-surface-container-low p-12 max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center">
              <Lock size={32} className="text-primary" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Dostęp Ograniczony</p>
          <h2 className="font-display font-black text-3xl uppercase tracking-tighter mb-4 text-on-surface">
            Aktualności tylko dla członków
          </h2>
          <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
            Komunikaty, galerie i wydarzenia dostępne są wyłącznie dla zalogowanych członków grupy TRUP.
          </p>
          <button
            onClick={loginWithGoogle}
            className="w-full bg-primary text-surface py-4 font-display font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-colors"
          >
            Zaloguj się przez Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-surface min-h-screen">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter mb-4 text-on-surface">
          Aktualności
        </h1>
        <p className="text-on-surface-variant text-base uppercase tracking-widest font-bold mb-12 border-b border-outline-variant/30 pb-8">
          KOMUNIKATY I INFORMACJE GRUPY TRUP.
        </p>

        {/* Link do wydarzeń */}
        <div className="mb-12 p-6 border border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Nadchodzące Wydarzenia</p>
              <p className="text-sm text-on-surface-variant">Szukasz nadchodzących wydarzeń? Sprawdź naszą stronę wydarzeń.</p>
            </div>
            <Link to="/wydarzenia" className="shrink-0 flex items-center gap-2 px-6 py-3 bg-primary text-surface font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-colors">
              Wydarzenia <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="space-y-12">
          {/* Typ: Komunikat */}
          <div className="flex gap-4 md:gap-8">
             <div className="w-12 pt-1 flex flex-col items-center">
                <div className="bg-[#37392E] border border-outline-variant/30 text-on-surface-variant p-3 rounded-full mb-2">
                   <FileText size={20} />
                </div>
                <div className="w-[1px] h-full bg-outline-variant/30"></div>
             </div>
             <div className="flex-1 bg-surface border border-outline-variant/30 p-6 md:p-8">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Artykuł sprzętowy • 1 tydzień temu</span>
                <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-on-surface mb-3">Recenzja Uprzęży Alpinistycznych</h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-6">Wgraliśmy nowe wpisy na Wiki z testami szpeju wykorzystywanego podczas letniego sezonu we wspinaczce wielowyciągowej.</p>
                <Link to="/wiki" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
                  Przejdź do Wiki →
                </Link>
             </div>
          </div>

          {/* Typ: Komunikat systemowy */}
          <div className="flex gap-4 md:gap-8">
             <div className="w-12 pt-1 flex flex-col items-center">
                <div className="bg-tertiary-container/20 text-tertiary-container p-3 rounded-full mb-2">
                   <Component size={20} />
                </div>
             </div>
             <div className="flex-1 bg-tertiary-container/10 border border-tertiary-container/30 p-6 md:p-8">
                <span className="text-[10px] font-bold text-tertiary-container uppercase tracking-widest mb-2 block">Komunikat Systemowy • 2 tygodnie temu</span>
                <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-tertiary-container mb-3">Wersja v2.0 Live</h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-6">Platforma TRUP w wersji 2.0 jest gotowa. Profil użytkownika, wsparcie PWA, nowy system Galerii.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
