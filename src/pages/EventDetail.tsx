import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink, CalendarPlus, Check } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function EventDetail() {
  const { id } = useParams();
  const { role, hasHardware } = useAppContext();
  const [rsvpStatus, setRsvpStatus] = useState<'none' | 'interested' | 'going'>('none');
  
  // W prawdziwej aplikacji dane byłyby pobierane na podstawie ID
  const event = {
    title: 'Zimowe Tatry: Orla Perć',
    id: '2024_01',
    date: '15-18 Grudnia 2024',
    location: 'Tatry Wysokie',
    mapyCzLink: 'https://pl.mapy.cz/s/kukurugabe',
    spots: '12 wolnych miejsc',
    difficulty: 'Ekspert',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR5pO5QgFSNLU9L3FbHsULwCRMGO34kqt9OZ-XZxhW0DB_HZsXLqHWcsBQ0aMS0ysZc83MYvmEM1NO9JCPPKhU_MxzI8hIDaIqW8zJ_rrVgjm7oSpOll3ll9RnWZ7dSb8KtwvCAKiaWqxXyDhvkYexfztMYCKBIilPXMd1xilcN8abxVRtf1LTzZoQwUu5Gb-gGxTIl9K6JqR23QrN8JjJ7Ixe8SZWHUSybdNyPrVcZQaj0xjAhytQI3XDHaoZCeD72GRo6Zl_VMA',
    description: 'Wymagająca zimowa przeprawa przez najtrudniejszy szlak w Tatrach. Wymagane doświadczenie w posługiwaniu się czekanem i rakami oraz doskonała kondycja fizyczna. Noclegi w schronisku Murowaniec.',
    requirements: [
      'Kask',
      'Czekan',
      'Raki',
      'Uprząż'
    ]
  };

  const missingHardware = event.requirements.filter(req => !hasHardware(req));

  return (
    <div className="pb-24">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px] flex items-end pb-12">
        <div className="absolute inset-0 bg-surface">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>
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
              {event.requirements.map((req, idx) => {
                const missing = role !== 'guest' && !hasHardware(req);
                return (
                  <li key={idx} className="flex items-start gap-3 font-medium">
                    {missing ? (
                      <AlertTriangle className="text-tertiary-container shrink-0 mt-0.5" size={20} />
                    ) : (
                      <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={20} />
                    )}
                    <span className={missing ? 'text-tertiary-container' : 'text-on-surface-variant'}>
                      {req} {missing && '(Brakuje w Twoim profilu)'}
                    </span>
                  </li>
                );
              })}
            </ul>

            {missingHardware.length > 0 && role !== 'guest' && (
              <div className="mt-8 bg-tertiary-container/10 border border-tertiary-container/30 p-6">
                 <div className="flex gap-4">
                    <AlertTriangle className="text-tertiary-container shrink-0" size={24} />
                    <div>
                       <h4 className="font-bold text-tertiary-container uppercase tracking-widest text-sm mb-2">Miękka Walidacja Sprzętu</h4>
                       <p className="text-sm text-on-surface-variant">Uwaga: Według Twojego profilu brakuje Ci części sprzętu ({missingHardware.join(', ')}). Upewnij się, że je zdobędziesz, aby bezpiecznie wziąć udział. Brak sprzętu nie blokuje zapisu, ale jest informacją dla Głównego Organizatora.</p>
                    </div>
                 </div>
              </div>
            )}
          </div>
          
          <div>
            <div className="bg-[#f9f9f8] border border-outline-variant/30 p-8 sticky top-28 text-[#37392E]">
              <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-6 border-b border-outline-variant/30 pb-4">
                Szczegóły logistyczne
              </h3>
              <div className="space-y-6 mb-8 text-[#37392E]">
                <div className="flex items-start gap-4">
                  <Calendar className="text-primary-container shrink-0" size={24} />
                  <div>
                    <p className="font-bold uppercase text-xs tracking-widest text-[#37392E]/60 mb-1">Termin</p>
                    <p className="font-medium mb-2">{event.date}</p>
                    <button className="text-primary-container font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors">
                      <CalendarPlus size={14} /> Dodaj do kalendarza
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="text-primary-container shrink-0" size={24} />
                  <div>
                    <p className="font-bold uppercase text-xs tracking-widest text-[#37392E]/60 mb-1">Trasa i Dojazd</p>
                    <p className="font-medium mb-2">{event.location}</p>
                    <a href={event.mapyCzLink} target="_blank" rel="noopener noreferrer" className="text-primary-container font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors">
                      <ExternalLink size={14} /> Otwórz w Mapy.cz
                    </a>
                  </div>
                </div>
                <div className="pt-4 border-t border-outline-variant/30">
                  <p className="font-bold text-xs text-[#37392E]/60 uppercase tracking-widest mb-2">Skopiuj do schowka</p>
                  <div className="bg-surface-container-highest p-2 text-xs font-mono text-center cursor-pointer hover:bg-surface-dim transition-colors text-white">
                    trup.pl/wydarzenia/{event.id}
                  </div>
                </div>
              </div>
              
              {role === 'guest' ? (
                <div className="text-center p-4 bg-surface-container-highest text-white text-sm font-bold uppercase tracking-widest">
                  Zaloguj się, aby zadeklarować udział
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setRsvpStatus('interested')}
                    className={`w-full font-display font-bold uppercase tracking-wider py-4 transition-colors flex items-center justify-center gap-2 ${rsvpStatus === 'interested' ? 'bg-primary-container text-white' : 'border-2 border-primary-container text-primary-container hover:bg-primary-container hover:text-white'}`}
                  >
                    {rsvpStatus === 'interested' && <Check size={18} />}
                    Zainteresowany
                  </button>
                  <button 
                    onClick={() => setRsvpStatus('going')}
                    className={`w-full font-display font-bold uppercase tracking-wider py-4 transition-colors flex items-center justify-center gap-2 ${rsvpStatus === 'going' ? 'bg-[#37392E] text-white' : 'border-2 border-[#37392E] text-[#37392E] hover:bg-[#37392E] hover:text-white'}`}
                  >
                    {rsvpStatus === 'going' && <Check size={18} />}
                    Wezmę udział
                  </button>
                  {rsvpStatus === 'interested' && (
                     <p className="text-[10px] text-center uppercase tracking-widest mt-2 font-bold text-[#b63f75]">Pamiętaj o potwierdzeniu obecności na 3 dni przed wyjazdem.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
