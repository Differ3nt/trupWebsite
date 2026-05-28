'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Users, Star } from 'lucide-react';
import { AuthGate } from '@/components/ui/AuthGate';
import { EmptyState } from '@/components/states/EmptyState';
import { Button } from '@/components/ui/Button';

interface EventItem {
  id: string;
  title: string;
  type: string;
  dateStart: Date;
  dateEnd?: Date | null;
  location?: string | null;
  image?: string | null;
  imageFocalX?: number | null;
  imageFocalY?: number | null;
  spots?: number | null;
  difficulty?: number | null;
  description?: string | null;
  isExpedition: boolean;
  _count: { participations: number };
}

interface EventsClientProps {
  events: EventItem[];
}

export function EventsClient({ events }: EventsClientProps) {
  const [activeFilter, setActiveFilter] = useState('Wszystkie');

  const filters = ['Wszystkie', 'GÓRY', 'INTEGRACJA', 'KULTURA'];

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'Wszystkie') {
      return events;
    }
    return events.filter((event) => event.type === activeFilter);
  }, [events, activeFilter]);

  const now = new Date();
  const upcoming = filteredEvents.filter((e) => new Date(e.dateStart) >= now);
  const archived = filteredEvents.filter((e) => new Date(e.dateStart) < now);

  const renderDifficultyStars = (difficulty?: number | null) => {
    if (!difficulty) return null;
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < difficulty ? 'fill-primary text-primary' : 'text-on-surface-variant/30'}
          />
        ))}
      </div>
    );
  };

  const EventCard = ({ event }: { event: EventItem }) => (
    <Link href={`/wydarzenia/${event.id}`} className="group relative overflow-hidden border border-outline-variant/30">
      <div className="relative aspect-[4/3] bg-surface-container-low overflow-hidden">
        <img
          src={event.image || '/placeholder-mountain.jpg'}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{
            objectPosition: `${event.imageFocalX ?? 50}% ${event.imageFocalY ?? 50}%`,
          }}
        />
        {/* Badge section */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {new Date(event.dateStart) >= now ? (
            <div className="bg-primary text-surface px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {new Date(event.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
            </div>
          ) : (
            <div className="bg-surface-variant text-on-surface-variant px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {new Date(event.dateStart).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
            </div>
          )}
          <div className="bg-black/60 text-on-surface px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
            {event.type}
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="p-6 bg-surface-container-low">
        <h3 className="font-display font-black text-xl uppercase tracking-tight text-on-surface mb-3 line-clamp-2 group-hover:text-primary transition-colors">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-3 mb-4">
          {event.location && (
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant uppercase tracking-widest">
              <MapPin size={12} className="text-primary" />
              {event.location}
            </div>
          )}

          {event.spots && (
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant uppercase tracking-widest">
              <Users size={12} className="text-primary" />
              {event._count.participations}/{event.spots} uczestników
            </div>
          )}

          {event.difficulty && (
            <div className="flex items-center gap-2">
              {renderDifficultyStars(event.difficulty)}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-outline-variant/20">
          <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-widest">
            Kliknij, aby zobaczyć szczegóły
          </span>
        </div>
      </div>
    </Link>
  );

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={48} />}
        title="Brak wydarzeń"
        description="Nie ma jeszcze żadnych planowanych wydarzeń."
      />
    );
  }

  return (
    <AuthGate message="Zaloguj się, aby zobaczyć szczegóły wypraw i zapisać się na wyjazd.">
      <div className="space-y-12">
        {/* Filter Buttons */}
        <div className="flex gap-3 flex-wrap">
          {filters.map((filter) => (
            <Button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              variant={activeFilter === filter ? 'primary' : 'secondary'}
              size="sm"
              className="uppercase tracking-widest"
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Upcoming Events */}
        {upcoming.length > 0 && (
          <div>
            <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface mb-6 border-l-4 border-primary pl-4">
              Nadchodzące
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Archived Events */}
        {archived.length > 0 && (
          <div>
            <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface-variant/60 mb-6 border-l-4 border-outline-variant pl-4">
              Archiwalne
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity">
              {archived.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state for filters */}
        {upcoming.length === 0 && archived.length === 0 && (
          <EmptyState
            icon={<Calendar size={48} />}
            title="Brak wydarzeń"
            description={`Nie ma żadnych wydarzeń typu ${activeFilter}.`}
          />
        )}
      </div>
    </AuthGate>
  );
}
