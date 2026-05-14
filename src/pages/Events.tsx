import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Clock } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import EventCountdown from '../components/EventCountdown';
import PageHeader from '../components/PageHeader';
import { AuthGate } from '../components/ui/AuthGate';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { cn } from '../lib/utils';

// Dostępne typy wydarzeń do filtrowania
const ALL_TYPES = ['Wszystkie', 'GÓRY', 'INTEGRACJA', 'KULTURA'];

/**
 * Komponent szkieletu (loader) wyświetlany podczas pobierania danych.
 */
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

/**
 * Komponent blokujący dostęp do listy wydarzeń dla niezalogowanych użytkowników.
 */
// Removed LoginWall in favor of AuthGate

/**
 * Strona listy wydarzeń. 
 * Obsługuje filtrowanie po typie oraz weryfikację uprawnień dostępu.
 */
export default function Events() {
  const { role } = useAppContext();
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState('Wszystkie');

  // Pobieranie wydarzeń z API
  React.useEffect(() => {
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

  // Logika filtrowania i sortowania
  const sortedFiltered = React.useMemo(() => {
    const now = new Date();
    const filteredEvents = (activeFilter === 'Wszystkie'
      ? events
      : events.filter(e => e.type === activeFilter)
    ).filter(e => !e.isDraft);
      
    // Sortowanie chronologiczne: najnowsze na górze, najstarsze na końcu (DESC)
    return [...filteredEvents].sort((a, b) => 
      new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
    );
  }, [events, activeFilter]);

  const now = new Date();
  const upcoming = sortedFiltered.filter(e => new Date(e.dateStart) >= now);
  const archived = sortedFiltered.filter(e => new Date(e.dateStart) < now);

  const EventCard = ({ event, isArchived }: { event: any, isArchived?: boolean }) => (
    <Link 
      key={event.id} 
      to={`/wydarzenia/${event.id}`} 
      className={cn(
        "group block bg-surface-container-low border border-outline-variant/30 hover:border-primary transition-all duration-500",
        isArchived && "grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
      )}
    >
      <div className="h-72 overflow-hidden relative">
        <img
          src={event.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800'}
          alt={event.title}
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay Top Left: Countdown + Date */}
        <div className="absolute top-4 left-4 flex flex-col gap-1">
          {!isArchived && (
            <div className="bg-primary text-surface px-3 py-1.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <EventCountdown targetDate={event.dateStart} compact className="bg-transparent p-0" />
              <span className="opacity-50">|</span>
              <span>{new Date(event.dateStart).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
          )}
          {isArchived && (
            <div className="bg-surface-variant/90 text-on-surface-variant px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
              {new Date(event.dateStart).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>

        {/* Overlay Top Right: Category (Dark) */}
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="backdrop-blur-md bg-surface-variant/90 border-none px-3 py-1.5">
            {event.type}
          </Badge>
        </div>

        {/* Overlay Bottom: Title */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          <h3 className="font-display font-black text-3xl uppercase tracking-tighter text-white leading-none group-hover:text-primary transition-colors">
            {event.title}
          </h3>
        </div>
      </div>

      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-6">
          {/* Body Top Left: Wolne miejsca / Zapisani */}
          {!isArchived && (
            event.spots !== null && event.spots > 0 ? (
              <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${Math.max(0, event.spots - (event.goingCount || 0)) === 0 ? 'bg-red-500' : 'bg-primary animate-pulse'}`} />
                {Math.max(0, event.spots - (event.goingCount || 0)) === 0 ? 'Brak miejsc' : `${Math.max(0, event.spots - (event.goingCount || 0))} wolnych miejsc`}
              </div>
            ) : (
              <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {event.goingCount || 0} zapisanych
              </div>
            )
          )}
          {isArchived && (
            <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 flex items-center gap-2">
              WYDARZENIE ARCHIWALNE
            </div>
          )}

          {/* Body Top Right: Gwiazdki w ramce */}
          {event.type === 'GÓRY' && event.difficulty > 0 && (
            <div className="border border-outline-variant/30 px-3 py-1.5 bg-surface-container flex items-center gap-1">
              <div className="text-primary text-sm tracking-widest font-black">
                {'★'.repeat(event.difficulty)}
                <span className="text-on-surface-variant/20">{'★'.repeat(5 - event.difficulty)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-on-surface-variant text-xs leading-relaxed line-clamp-2 mb-12 font-medium opacity-80">
          {event.description?.replace(/[#*`]/g, '') || 'Brak dodatkowego opisu dla tego wydarzenia.'}
        </p>

        {/* Body Bottom Right: Location */}
        {event.location && (
          <div className="absolute bottom-6 right-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
            <MapPin size={12} />
            <span>{event.location}</span>
          </div>
        )}
      </div>
    </Link>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader 
        title="Wydarzenia" 
        subtitle="DOKUMENTACJA WYPRAW, SZKOLEŃ I EKSPEDYCJI GRUPY GÓRSKIEJ. DOŁĄCZ DO NAS NA SZLAKU."
        category="Wyprawy i szkolenia"
      />

      {/* Przyciski filtrów */}
      <div className="flex flex-wrap gap-2 mb-16">
        {ALL_TYPES.map(type => (
          <Button
            key={type}
            variant={activeFilter === type ? 'primary' : 'secondary'}
            onClick={() => setActiveFilter(type)}
            size="sm"
          >
            {type}
          </Button>
        ))}
      </div>

      <AuthGate message="Zaloguj się, aby zobaczyć szczegóły wypraw, wolne miejsca i zapisać się na wyjazd.">
        <div className="space-y-24">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 3 }).map((_, i) => <EventSkeleton key={i} />)}
            </div>
          ) : sortedFiltered.length > 0 ? (
            <>
              {/* Sekcja Nadchodzące */}
              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-on-surface-variant mb-10 border-l-4 border-primary pl-4 flex items-center gap-4">
                    Nadchodzące
                    <span className="h-px bg-outline-variant/30 flex-grow"></span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {upcoming.map(event => <EventCard key={event.id} event={event} />)}
                  </div>
                </section>
              )}

              {/* Sekcja Archiwalne */}
              {archived.length > 0 && (
                <section>
                  <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-on-surface-variant/40 mb-10 border-l-4 border-outline-variant pl-4 flex items-center gap-4">
                    Archiwalne
                    <span className="h-px bg-outline-variant/30 flex-grow"></span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {archived.map(event => <EventCard key={event.id} event={event} isArchived />)}
                  </div>
                </section>
              )}
            </>
          ) : (
            <p className="text-center py-24 text-on-surface-variant uppercase tracking-widest font-bold">
              Brak wydarzeń w tej kategorii.
            </p>
          )}
        </div>
      </AuthGate>
    </div>
  );
}
