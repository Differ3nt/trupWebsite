'use client';

import { useState, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Calendar, MapPin, Users, Star, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight } from '@/components/icons';
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

// Months and weekdays are now fetched from translations
// const MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
// const WEEK_DAYS = ['Pn','Wt','Śr','Cz','Pt','Sb','Nd'];
const TYPE_COLORS: Record<string, string> = {
  'GÓRY': 'bg-primary text-surface',
  'INTEGRACJA': 'bg-yellow-500 text-surface',
  'KULTURA': 'bg-blue-500 text-white',
};

export function EventsClient({ events }: EventsClientProps) {
  const t = useTranslations('events.list');
  const [activeFilter, setActiveFilter] = useState(t('filterAll'));
  const [view, setView] = useState<'panel' | 'calendar'>('panel');
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  // Build month and weekday arrays from translations
  const monthNames = [
    t('months.january'),
    t('months.february'),
    t('months.march'),
    t('months.april'),
    t('months.may'),
    t('months.june'),
    t('months.july'),
    t('months.august'),
    t('months.september'),
    t('months.october'),
    t('months.november'),
    t('months.december'),
  ];
  const weekDays = [
    t('weekdays.monday'),
    t('weekdays.tuesday'),
    t('weekdays.wednesday'),
    t('weekdays.thursday'),
    t('weekdays.friday'),
    t('weekdays.saturday'),
    t('weekdays.sunday'),
  ];

  const filters = [t('filterAll'), 'GÓRY', 'INTEGRACJA', 'KULTURA'];

  const filteredEvents = useMemo(() => {
    if (activeFilter === t('filterAll')) {
      return events;
    }
    return events.filter((event) => event.type === activeFilter);
  }, [events, activeFilter, t]);

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
              {event._count.participations}/{event.spots} {t('participantsLabel')}
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
            {t('cardHint')}
          </span>
        </div>
      </div>
    </Link>
  );

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={48} />}
        title={t('emptyTitle')}
        description={t('emptyDesc')}
      />
    );
  }

  return (
    <AuthGate message={t('authMessage')}>
      <div className="space-y-8">
        {/* Toolbar: filters + view toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {filters.map((filter) => (
              <Button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                variant={activeFilter === filter ? 'primary' : 'secondary'}
                size="sm"
              >
                {filter}
              </Button>
            ))}
          </div>
          <div className="flex border border-outline-variant/30">
            <button
              onClick={() => setView('panel')}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                view === 'panel' ? 'bg-primary text-surface' : 'text-on-surface-variant hover:text-primary'
              }`}
              aria-label={t('viewPanelLabel')}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">{t('viewPanel')}</span>
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border-l border-outline-variant/30 transition-colors ${
                view === 'calendar' ? 'bg-primary text-surface' : 'text-on-surface-variant hover:text-primary'
              }`}
              aria-label={t('viewCalendarLabel')}
            >
              <CalendarDays size={14} />
              <span className="hidden sm:inline">{t('viewCalendar')}</span>
            </button>
          </div>
        </div>

        {/* Panel view */}
        {view === 'panel' && (
          <div className="space-y-12">
            {upcoming.length > 0 && (
              <div>
                <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface mb-6 border-l-4 border-primary pl-4">
                  {t('upcomingSection')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
            {archived.length > 0 && (
              <div>
                <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface-variant/60 mb-6 border-l-4 border-outline-variant pl-4">
                  {t('archivedSection')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                  {archived.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
            {upcoming.length === 0 && archived.length === 0 && (
              <EmptyState
                icon={<Calendar size={48} />}
                title={t('emptyTitle')}
                description={activeFilter === t('filterAll') ? t('emptyDesc') : t('emptyFilteredDesc', { filter: activeFilter })}
              />
            )}
          </div>
        )}

        {/* Calendar view */}
        {view === 'calendar' && (
          <EventsCalendarView
            events={filteredEvents}
            currentDate={calendarDate}
            onPrev={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            onNext={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            t={t}
            monthNames={monthNames}
            weekDays={weekDays}
          />
        )}
      </div>
    </AuthGate>
  );
}

// ─── Inline calendar view ───────────────────────────────────────────────────

interface CalendarViewProps {
  events: EventItem[];
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
  t: ReturnType<typeof useTranslations>;
  monthNames: string[];
  weekDays: string[];
}

function EventsCalendarView({ events, currentDate, onPrev, onNext, t, monthNames, weekDays }: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();

  function getDayEvents(day: number) {
    const dayStart = new Date(year, month, day);
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999);
    return events.filter(e => {
      const s = new Date(e.dateStart);
      const end = e.dateEnd ? new Date(e.dateEnd) : s;
      return s <= dayEnd && end >= dayStart;
    });
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant/30 px-6 py-4">
        <h2 className="font-display font-black text-2xl uppercase tracking-tight">
          {monthNames[month]} {year}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onPrev} aria-label={t('prevMonth')}>
            <ChevronLeft size={18} />
          </Button>
          <Button variant="outline" size="icon" onClick={onNext} aria-label={t('nextMonth')}>
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="border border-outline-variant/30">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-outline-variant/30">
          {weekDays.map((d, idx) => (
            <div key={idx} className="py-2 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-container-high">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayEvents = day !== null ? getDayEvents(day) : [];
            const isToday = day !== null &&
              today.getFullYear() === year &&
              today.getMonth() === month &&
              today.getDate() === day;

            return (
              <div
                key={i}
                className={`min-h-[100px] p-1.5 flex flex-col gap-1 border-b border-r border-outline-variant/20 ${
                  day === null ? 'bg-surface-container' : 'bg-surface-container-low'
                } ${isToday ? 'ring-2 ring-inset ring-primary' : ''}`}
              >
                {day !== null && (
                  <>
                    <span className={`text-[10px] font-bold px-1 self-start ${isToday ? 'bg-primary text-surface px-1.5' : 'text-on-surface-variant'}`}>
                      {String(day).padStart(2, '0')}
                    </span>
                    {dayEvents.slice(0, 3).map(event => (
                      <Link
                        key={event.id}
                        href={`/wydarzenia/${event.id}`}
                        title={event.title}
                        className={`text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 truncate hover:opacity-80 transition-opacity ${
                          TYPE_COLORS[event.type] ?? 'bg-surface-variant text-on-surface-variant'
                        }`}
                      >
                        {event.title}
                      </Link>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[8px] text-on-surface-variant/60 px-1.5">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(TYPE_COLORS).map(([type, cls]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 ${cls}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
