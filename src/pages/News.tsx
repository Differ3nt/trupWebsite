import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Image as ImageIcon, FileText, Component } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function News() {
  const { role } = useAppContext();

  return (
    <div className="pt-32 pb-24 bg-surface min-h-screen">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tighter mb-4 text-on-surface">
          Aktualności
        </h1>
        <p className="text-on-surface-variant text-base uppercase tracking-widest font-bold mb-12 border-b border-outline-variant/30 pb-8">
          NAJNOWSZE WYDARZENIA, OPERACJE I KOMUNIKATY GRUPY TRUP.
        </p>

        <div className="space-y-12">
          {/* Typ: Wydarzenie */}
          <div className="flex gap-4 md:gap-8">
             <div className="w-12 pt-1 flex flex-col items-center">
                <div className="bg-primary-container text-white p-3 rounded-full mb-2">
                   <Calendar size={20} />
                </div>
                <div className="w-[1px] h-full bg-outline-variant/30"></div>
             </div>
             <div className="flex-1 bg-surface-container-low border border-outline-variant/30 p-6 md:p-8">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2 block">Najbliższe Wydarzenie • Dziś</span>
                <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-on-surface mb-3">Zimowe Tatry: Orla Perć</h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-6">Rozpoczynamy zapisy na jedną z najbardziej wymagających zimowych przepraw. Weryfikacja bazy sprzętowej na bieżąco na Twoim profilu.</p>
                <Link to="/wydarzenia/2024_01" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">
                  Zobacz szczegóły i zapisy →
                </Link>
             </div>
          </div>

          {/* Typ: Galeria */}
          <div className="flex gap-4 md:gap-8">
             <div className="w-12 pt-1 flex flex-col items-center">
                <div className="bg-[#37392E] border border-outline-variant/30 text-primary p-3 rounded-full mb-2">
                   <ImageIcon size={20} />
                </div>
                <div className="w-[1px] h-full bg-outline-variant/30"></div>
             </div>
             <div className="flex-1 bg-surface border border-outline-variant/30 p-6 md:p-8">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Nowa Galeria • 2 dni temu</span>
                <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-on-surface mb-3">Archiwum: Bieszczady Jesień</h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-6">Dodano 42 nowe ujęcia z ostatniej misji zwiadowczej.</p>
                <Link to="/galeria/bieszczady-jesien" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">
                  Otwórz w Lightbox →
                </Link>
             </div>
          </div>

          {/* Typ: Komunikat / Artykuł */}
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
                <Link to="/wiki" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-primary hover:text-white transition-colors">
                  Przejdź do Wiki →
                </Link>
             </div>
          </div>
          
           {/* Typ: Komunikat */}
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
