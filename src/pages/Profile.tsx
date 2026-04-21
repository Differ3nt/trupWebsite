import React, { useState } from 'react';
import { User, Settings, Award, MapPin, UploadCloud, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function Profile() {
  const { role } = useAppContext();
  const [showOnboarding, setShowOnboarding] = useState(true);

  if (role === 'guest') {
    return (
      <div className="container mx-auto px-6 md:px-8 py-24 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h1 className="font-display font-black text-4xl uppercase mb-4 text-on-surface">Panel Użytkownika</h1>
        <p className="text-on-surface-variant font-bold tracking-widest uppercase text-xs mb-8">Musisz się zalogować, aby zobaczyć swój profil.</p>
        <button className="bg-primary text-surface px-8 py-4 font-bold uppercase tracking-widest text-sm transition-colors hover:bg-primary/90">
          ZALOGUJ SIĘ PRZEZ GOOGLE
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 md:px-8 py-24">
      <div className="max-w-5xl mx-auto">
        {showOnboarding && (
           <div className="bg-primary/10 border border-primary/30 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                 <AlertCircle size={32} className="text-primary shrink-0" />
                 <div>
                    <h3 className="font-display font-black text-2xl uppercase tracking-tighter text-on-surface mb-2">UZUPEŁNIJ SWÓJ PROFIL</h3>
                    <p className="text-sm text-on-surface-variant">Aby wziąć udział w zaawansowanych ekspedycjach, musimy poznać Twój sprzęt i umiejętności. Skonfiguruj również powiadomienia Push.</p>
                 </div>
              </div>
              <button 
                 onClick={() => setShowOnboarding(false)}
                 className="shrink-0 bg-primary text-surface px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors"
              >
                 WYPEŁNIJ TERAZ
              </button>
           </div>
        )}

        <div className="bg-surface-container-low border border-outline-variant/30 p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="w-32 h-32 bg-surface-container-highest border-4 border-surface flex items-center justify-center shrink-0">
              <User size={64} className="text-on-surface-variant" />
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="font-display font-black text-4xl uppercase tracking-tighter mb-2">Jan Kowalski</h1>
              <p className="text-on-surface-variant font-medium mb-6 flex items-center justify-center md:justify-start gap-2">
                <MapPin size={16} /> Kraków, Polska
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="bg-surface px-4 py-2 border border-outline-variant/30">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Wyprawy</p>
                  <p className="font-display font-black text-2xl">12</p>
                </div>
                <div className="bg-surface px-4 py-2 border border-outline-variant/30">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Szczyty</p>
                  <p className="font-display font-black text-2xl">8</p>
                </div>
                <div className="bg-surface px-4 py-2 border border-outline-variant/30">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Ranga</p>
                  <p className="font-display font-black text-2xl text-primary">Ekspert</p>
                </div>
              </div>
            </div>
            
            <button className="p-3 border border-outline-variant hover:bg-surface-container-highest transition-colors">
              <Settings size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-8">
            <div className="bg-surface-container-low border border-outline-variant/30 p-8">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6 flex items-center justify-between">
                <span>Moje Archiwum</span>
                <TrendingUp size={24} className="text-on-surface-variant" />
              </h2>
              <ul className="space-y-4">
                <li className="flex flex-col gap-2 p-4 bg-surface border border-outline-variant/20">
                  <div className="flex justify-between items-center">
                     <span className="font-bold uppercase text-sm">Tatry Zimowe: Orla Perć</span>
                     <span className="text-xs font-bold text-primary">2024_01</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/10">
                     <div className="flex gap-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                        <span>24 km</span>
                        <span>11h 20m</span>
                     </div>
                     <CheckCircle2 size={16} className="text-primary" />
                  </div>
                </li>
                <li className="flex flex-col gap-2 p-4 bg-surface border-l-4 border-l-tertiary-container border border-outline-variant/20">
                  <div className="flex justify-between items-center">
                     <span className="font-bold uppercase text-sm">Alpy: Gran Paradiso</span>
                     <span className="text-xs font-bold text-on-surface-variant">2023_08</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-outline-variant/10">
                     <p className="text-xs text-tertiary-container font-medium">Brak wgranego GPX z danymi! Uzupełnij statystyki.</p>
                     <AlertCircle size={16} className="text-tertiary-container" />
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-surface-container-highest border border-primary/30 p-8 text-center flex flex-col items-center">
              <UploadCloud size={48} className="text-primary mb-4" strokeWidth={1} />
              <h3 className="font-display font-black text-xl uppercase mb-2">WGRANIE DANYCH (GPX)</h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">Prześlij swój plik z zegarka, aby zaktualizować statystyki i oznaczyć towarzyszy. Pliki trafiają do moderacji.</p>
              <button className="border-2 border-primary text-primary px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-primary hover:text-surface transition-colors">
                WYBIERZ PLIK .GPX
              </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-8">
            <div className="bg-surface-container-low border border-outline-variant/30 p-8">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-3">
                <Award className="text-primary" /> Osiągnięcia
              </h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-4 p-4 bg-surface border border-outline-variant/20">
                <div className="w-12 h-12 bg-primary/20 flex items-center justify-center text-primary font-bold">Zima</div>
                <div>
                  <p className="font-bold uppercase text-sm">Zimowy Wojownik</p>
                  <p className="text-xs text-on-surface-variant">Ukończono 5 wypraw zimowych</p>
                </div>
              </li>
              <li className="flex items-center gap-4 p-4 bg-surface border border-outline-variant/20">
                <div className="w-12 h-12 bg-[#b63f75]/20 flex items-center justify-center text-[#ff8fb3] font-bold">4K</div>
                <div>
                  <p className="font-bold uppercase text-sm">Powyżej Chmur</p>
                  <p className="text-xs text-on-surface-variant">Zdobyto szczyt powyżej 4000m</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="bg-surface-container-low border border-outline-variant/30 p-8">
            <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6">Nadchodzące</h2>
            <div className="p-4 bg-surface border border-outline-variant/20">
              <span className="text-xs font-bold uppercase tracking-widest text-primary mb-1 block">15-18 Grudnia 2024</span>
              <h3 className="font-display font-bold text-xl uppercase mb-2">Zimowe Tatry: Orla Perć</h3>
              <p className="text-sm text-on-surface-variant">Status: Potwierdzony</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
