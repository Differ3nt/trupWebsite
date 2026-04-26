import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const ALL_TYPES = ['Wszystkie', 'GÓRY', 'INTEGRACJA', 'EKSPEDYCJA', 'KULTURA'];

function EventSkeleton() {
  return (
    <div className="bg-surface-container-low border border-outline-variant/30 overflow-hidden animate-pulse">
      <div className="h-64 bg-surface-container-highest" />
      <div className="p-6 space-y-3">
        <div className="h-3 w-20 bg-surface-container-highest rounded" />
        <div className="h-6 w-3/4 bg-surface-container-highest rounded" />
        <div className="h-3 w-1/2 bg-surface-container-highest rounded" />
        <div className="h-3 w-2/5 bg-surface-container-highest rounded" />
      </div>
    </div>
  );
}

function LoginWall() {
  const { loginWithGoogle } = useAppContext();
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-32 text-center gap-8">
      <div className="border border-outline-variant/30 bg-surface-container-low p-12 max-w-md w-full">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Dostęp Ograniczony</p>
        <h2 className="font-display font-black text-3xl uppercase tracking-tighter mb-4 text-on-surface">
          Zaloguj się, aby zobaczyć wyprawy
        </h2>
        <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
          Dostęp do planowanych wypraw i zapisów mają wyłącznie członkowie grupy TRUP.
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

export default function Events() {
  const { role } = useAppContext();
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState('Wszystkie');

  React.useEffect(() => {
    if (role === 'guest') {
      setLoading(false);
      return;
    }
    fetch('/api/events', { credentials: 'include' })
      .then(res => {
        if (!res.ok) return [];
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch(err => console.error('Błąd pobierania wydarzeń:', err))
      .finally(() => setLoading(false));
  }, [role]);

  const filtered = activeFilter === 'Wszystkie'
    ? events
    : events.filter(e => e.type === activeFilter);

  return (
    <div className="container mx-auto px-6 md:px-8 py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 md:mb-12 gap-4">
        <h1 className="font-display font-black text-4xl sm:text-5xl md:text-7xl text-on-surface uppercase tracking-tighter">
          Wydarzenia
        </h1>
        <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">
          Dołącz do nas na szlaku
        </p>
      </div>

      {/* Filtry — tylko dla zalogowanych */}
      {role !== 'guest' && (
        <div className="flex flex-wrap gap-2 mb-10">
          {ALL_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${activeFilter === type ? 'bg-primary text-surface border-primary' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-on-surface'}`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {role === 'guest' ? (
          <LoginWall />
        ) : loading ? (
          Array.from({ length: 3 }).map((_, i) => <EventSkeleton key={i} />)
        ) : filtered.length > 0 ? (
          filtered.map((event) => (
            <Link key={event.id} to={`/wydarzenia/${event.id}`} className="group block bg-surface-container-low border border-outline-variant/30 hover:border-primary transition-colors duration-300">
              <div className="h-64 overflow-hidden relative">
                <img
                  src={event.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800'}
                  alt={event.title}
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
                {event.userStatus && new Date(event.dateStart) >= new Date() && (
                  <div className="absolute top-4 right-4 bg-primary text-surface px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20">
                    {event.userStatus === 'GOING' ? 'Zapisano' : 'Zainteresowany'}
                  </div>
                )}
                {event.type && (
                  <div className="absolute top-4 left-4 bg-primary text-surface px-3 py-1 font-bold text-[10px] uppercase tracking-wider">
                    {event.type}
                  </div>
                )}
              </div>
              <div className="p-6 bg-surface-container-low">
                <div className="flex justify-between items-start mb-2">
                  {event.isExpedition && event.difficulty > 0 && (
                    <div className="text-primary text-xs tracking-widest font-black">
                      {'★'.repeat(event.difficulty)}{'☆'.repeat(5 - event.difficulty)}
                    </div>
                  )}
                  {event.spots !== null && event.spots > 0 && (
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${Math.max(0, event.spots - (event.goingCount || 0)) === 0 ? 'text-red-500' : 'text-on-surface-variant'}`}>
                      {Math.max(0, event.spots - (event.goingCount || 0)) === 0 ? 'Brak miejsc' : `${Math.max(0, event.spots - (event.goingCount || 0))} wolnych miejsc`}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-4 group-hover:text-primary transition-colors text-on-surface">
                  {event.title}
                </h3>
                <div className="space-y-2 text-on-surface-variant font-medium text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-primary" />
                    <span>{new Date(event.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center py-24 text-on-surface-variant uppercase tracking-widest font-bold">
            Brak wydarzeń w tej kategorii.
          </p>
        )}
      </div>
    </div>
  );
}
