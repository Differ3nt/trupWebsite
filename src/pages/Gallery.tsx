import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Lock } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export const EXPEDITIONS = [
  {
    id: 'tatry-2023',
    mission: 'MISJA 042',
    title: 'TATRY 2023',
    location: 'TATRZAŃSKI PARK NARODOWY',
    date: 'STYCZEŃ – MARZEC 2023',
    images: [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&q=80&w=800&h=800',
    ],
    extraPhotos: 24
  },
  {
    id: 'bieszczady-jesien',
    mission: 'MISJA 039',
    title: 'BIESZCZADY JESIEŃ',
    location: 'BIESZCZADZKI PARK NARODOWY',
    date: 'PAŹDZIERNIK 2022',
    images: [
      'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&q=80&w=800&h=800',
    ],
    extraPhotos: 12
  },
  {
    id: 'alpy-szwajcarskie',
    mission: 'MISJA 035',
    title: 'ALPY SZWAJCARSKIE',
    location: 'BERNESE OBERLAND',
    date: 'SIERPIEŃ 2022',
    images: [
      'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1480497490787-505ec076689f?auto=format&fit=crop&q=80&w=800&h=800',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800&h=800',
    ],
    extraPhotos: 56
  }
];

export default function Gallery() {
  const { role } = useAppContext();
  
  // Bez zalogowania pokazujemy tylko pierwsze zdjęcia z pierwszej wyprawy
  const visibleExpeditions = role === 'guest' ? [EXPEDITIONS[0]] : EXPEDITIONS;
  const showLoginPrompt = role === 'guest';

  return (
    <div className="pt-32 pb-24 bg-surface min-h-screen">
      {/* Header Section */}
      <div className="px-6 md:px-12 max-w-7xl mx-auto mb-12 md:mb-20">
        <div className="border-l-4 border-primary pl-6 md:pl-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] text-on-surface uppercase tracking-tighter mb-6">
              ARCHIWUM WIZUALNE
            </h1>
            <p className="text-on-surface-variant text-xs md:text-base max-w-2xl uppercase tracking-widest leading-relaxed font-bold">
              DOKUMENTACJA WYPRAW, SZKOLEŃ I EKSPEDYCJI GRUPY GÓRSKIEJ. BRUTALNA SZCZEROŚĆ NATURY UCHWYCONA W KADRZE.
            </p>
          </div>
          {showLoginPrompt && (
            <div className="bg-surface-container-highest p-6 max-w-sm border border-outline-variant/30 flex items-start gap-4">
               <Lock className="text-primary mt-1 shrink-0" size={24} />
               <div>
                 <h3 className="text-on-surface font-bold uppercase tracking-widest text-sm mb-2">Prywatna Galeria</h3>
                 <p className="text-on-surface-variant text-xs leading-relaxed">Widzisz tylko ujęcia promocyjne. Pełne archiwa wypraw na własnym serwerze wymagają zalogowania.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Expeditions List */}
      <div className="flex flex-col gap-20">
        {visibleExpeditions.map((exp) => (
          <div key={exp.id} className="max-w-7xl mx-auto px-6 md:px-12 w-full">
            {/* Expedition Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-outline-variant/30 pb-4">
              <div>
                <div className="text-primary font-bold text-xs tracking-widest uppercase mb-1">{exp.mission}</div>
                <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tighter text-on-surface">{exp.title}</h2>
              </div>
              <div className="text-left md:text-right mt-4 md:mt-0">
                <div className="text-on-surface-variant text-[10px] md:text-xs tracking-widest uppercase font-bold">LOKALIZACJA: {exp.location}</div>
                <div className="text-on-surface-variant text-[10px] md:text-xs tracking-widest uppercase font-bold">DATA: {exp.date}</div>
              </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(showLoginPrompt ? exp.images.slice(0, 3) : exp.images).map((img, idx) => (
                <div key={idx} className="aspect-square overflow-hidden bg-surface-variant">
                  <img 
                    src={img} 
                    alt={`${exp.title} - photo ${idx + 1}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
              
              {/* More Photos Tile */}
              {!showLoginPrompt && (
                <Link 
                  to={`/galeria/${exp.id}`} 
                  className="bg-primary flex flex-col items-center justify-center text-surface hover:bg-primary/90 transition-colors aspect-square"
                >
                  <Plus size={32} strokeWidth={2.5} className="mb-2" />
                  <span className="font-bold text-xs tracking-widest uppercase">+{exp.extraPhotos} ZDJĘĆ</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
