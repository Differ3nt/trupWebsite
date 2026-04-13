import React from 'react';
import { User, Settings, Award, MapPin } from 'lucide-react';

export default function Profile() {
  return (
    <div className="container mx-auto px-6 md:px-8 py-24">
      <div className="max-w-5xl mx-auto">
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
                  <p className="font-display font-black text-2xl text-primary-container">Ekspert</p>
                </div>
              </div>
            </div>
            
            <button className="p-3 border border-outline-variant hover:bg-surface-container-highest transition-colors">
              <Settings size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-surface-container-low border border-outline-variant/30 p-8">
            <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-3">
              <Award className="text-primary-container" /> Osiągnięcia
            </h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-4 p-4 bg-surface border border-outline-variant/20">
                <div className="w-12 h-12 bg-primary-container/20 flex items-center justify-center text-primary-container font-bold">Zima</div>
                <div>
                  <p className="font-bold uppercase text-sm">Zimowy Wojownik</p>
                  <p className="text-xs text-on-surface-variant">Ukończono 5 wypraw zimowych</p>
                </div>
              </li>
              <li className="flex items-center gap-4 p-4 bg-surface border border-outline-variant/20">
                <div className="w-12 h-12 bg-tertiary-container/20 flex items-center justify-center text-tertiary-container font-bold">4K</div>
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
              <span className="text-xs font-bold uppercase tracking-widest text-primary-container mb-1 block">15-18 Grudnia 2024</span>
              <h3 className="font-display font-bold text-xl uppercase mb-2">Zimowe Tatry: Orla Perć</h3>
              <p className="text-sm text-on-surface-variant">Status: Potwierdzony</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
