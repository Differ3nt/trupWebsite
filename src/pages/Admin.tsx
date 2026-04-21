import React, { useState } from 'react';
import { Shield, MapActivity, Users, Send } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function Admin() {
  const { role } = useAppContext();
  const [activeTab, setActiveTab] = useState('gpx');

  if (role !== 'user' && role !== 'admin') {
    return <div className="pt-32 text-center bg-surface min-h-screen text-on-surface">Brak dostępu. Zaloguj się. (W wersji demo: kliknij "Zaloguj" w prawym górnym rogu, by uzyskać dostęp do testowania)</div>;
  }

  return (
    <div className="pt-32 pb-24 bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tighter mb-12 flex items-center gap-4">
          <Shield className="text-primary" size={40} /> Panel Administratora
        </h1>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
            <button onClick={() => setActiveTab('gpx')} className={`text-left px-6 py-4 font-bold tracking-widest text-xs uppercase ${activeTab === 'gpx' ? 'bg-primary text-surface' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}>
               Kolejka GPX (2)
            </button>
            <button onClick={() => setActiveTab('users')} className={`text-left px-6 py-4 font-bold tracking-widest text-xs uppercase ${activeTab === 'users' ? 'bg-primary text-surface' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}>
               Zarządzanie Użytkownikami
            </button>
            <button onClick={() => setActiveTab('events')} className={`text-left px-6 py-4 font-bold tracking-widest text-xs uppercase ${activeTab === 'events' ? 'bg-primary text-surface' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}>
               Kreator Wydarzeń
            </button>
            <button onClick={() => setActiveTab('push')} className={`text-left px-6 py-4 font-bold tracking-widest text-xs uppercase ${activeTab === 'push' ? 'bg-primary text-surface' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}>
               Powiadomienia Masowe
            </button>
          </div>

          <div className="flex-1 bg-surface-container-low border border-outline-variant/30 p-8">
             {activeTab === 'gpx' && (
               <div>
                 <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4">Oczekujące Trasy GPX</h2>
                 <div className="space-y-4">
                    <div className="bg-surface p-4 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                       <div>
                          <p className="font-bold uppercase text-sm mb-1">Marek Z. (Zimowe Tatry)</p>
                          <p className="text-xs text-on-surface-variant">Przesłano: dzisiaj 14:02 | Sugerowany czas: 12h 05m</p>
                       </div>
                       <div className="flex gap-2">
                          <button className="bg-primary-container text-white px-4 py-2 font-bold text-[10px] uppercase tracking-widest hover:bg-primary transition-colors">Odrzuć</button>
                          <button className="bg-primary text-surface px-4 py-2 font-bold text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-colors">Zatwierdź & Nadaj</button>
                       </div>
                    </div>
                 </div>
               </div>
             )}

             {activeTab === 'push' && (
               <div>
                 <h2 className="font-display font-black text-2xl uppercase mb-6 flex items-center gap-3 border-b border-outline-variant/30 pb-4">Nadawanie Powiadomień <Send className="text-primary" /></h2>
                 <textarea className="w-full bg-surface border border-outline-variant/50 p-4 text-on-surface mb-4 min-h-[150px] focus:outline-none focus:border-primary" placeholder="Treść powiadomienia (max 150 znaków)..."></textarea>
                 <button className="bg-primary text-surface px-8 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors">WYŚLIJ PUSH</button>
                 <p className="text-tertiary-container text-xs mt-4 uppercase tracking-widest font-bold">Uwaga: Zostanie natychmiast wysłane do wszystkich zapisanych na push.</p>
               </div>
             )}
             
             {(activeTab === 'users' || activeTab === 'events') && (
                <div className="text-on-surface-variant italic py-12 text-center text-sm">
                   Moduł {activeTab === 'users' ? 'Użytkownicy i Flagi' : 'Kreator Wydarzeń'} – formularze interfejsu (mockup).
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
