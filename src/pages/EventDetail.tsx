import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function EventDetail() {
  const { id } = useParams();
  
  // W prawdziwej aplikacji dane byłyby pobierane na podstawie ID
  const event = {
    title: 'Zimowe Tatry: Orla Perć',
    date: '15-18 Grudnia 2024',
    location: 'Tatry Wysokie',
    spots: 'Brak miejsc',
    difficulty: 'Ekspert',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR5pO5QgFSNLU9L3FbHsULwCRMGO34kqt9OZ-XZxhW0DB_HZsXLqHWcsBQ0aMS0ysZc83MYvmEM1NO9JCPPKhU_MxzI8hIDaIqW8zJ_rrVgjm7oSpOll3ll9RnWZ7dSb8KtwvCAKiaWqxXyDhvkYexfztMYCKBIilPXMd1xilcN8abxVRtf1LTzZoQwUu5Gb-gGxTIl9K6JqR23QrN8JjJ7Ixe8SZWHUSybdNyPrVcZQaj0xjAhytQI3XDHaoZCeD72GRo6Zl_VMA',
    description: 'Wymagająca zimowa przeprawa przez najtrudniejszy szlak w Tatrach. Wymagane doświadczenie w posługiwaniu się czekanem i rakami oraz doskonała kondycja fizyczna. Noclegi w schronisku Murowaniec.',
    requirements: [
      'Ukończony kurs turystyki zimowej',
      'Własny sprzęt (raki, czekan, kask, uprząż)',
      'Doskonała kondycja fizyczna',
      'Ubezpieczenie górskie'
    ]
  };

  return (
    <div className="pb-24">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px] flex items-end pb-12">
        <div className="absolute inset-0 bg-on-surface">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface via-on-surface/80 to-transparent"></div>
        </div>
        
        <div className="container mx-auto px-6 md:px-8 relative z-10">
          <Link to="/wydarzenia" className="inline-flex items-center gap-2 text-surface-dim hover:text-white mb-6 font-bold uppercase tracking-widest text-xs transition-colors">
            <ArrowLeft size={16} /> Wróć do wydarzeń
          </Link>
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="bg-primary-container text-white px-3 py-1 font-bold text-xs uppercase tracking-wider">
              {event.spots}
            </span>
            <span className="bg-surface text-on-surface px-3 py-1 font-bold text-xs uppercase tracking-wider">
              Poziom: {event.difficulty}
            </span>
          </div>
          <h1 className="font-display font-black text-4xl md:text-6xl text-white uppercase tracking-tighter max-w-4xl">
            {event.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 md:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-6">O wyprawie</h2>
            <p className="text-on-surface-variant text-lg leading-relaxed mb-12">
              {event.description}
            </p>
            
            <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-6">Wymagania</h2>
            <ul className="space-y-4">
              {event.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3 text-on-surface-variant font-medium">
                  <CheckCircle2 className="text-primary-container shrink-0 mt-0.5" size={20} />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <div className="bg-surface-container-low border border-outline-variant/30 p-8 sticky top-28">
              <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-6 border-b border-outline-variant/30 pb-4">
                Szczegóły
              </h3>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <Calendar className="text-primary-container shrink-0" size={24} />
                  <div>
                    <p className="font-bold uppercase text-xs tracking-widest text-on-surface-variant mb-1">Termin</p>
                    <p className="font-medium">{event.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="text-primary-container shrink-0" size={24} />
                  <div>
                    <p className="font-bold uppercase text-xs tracking-widest text-on-surface-variant mb-1">Lokalizacja</p>
                    <p className="font-medium">{event.location}</p>
                  </div>
                </div>
              </div>
              <button className="w-full bg-on-surface text-surface font-display font-bold uppercase tracking-wider py-4 hover:bg-on-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                Zapisy Zamknięte
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
