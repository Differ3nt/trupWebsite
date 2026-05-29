'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Mountain } from '@/components/icons';
import { Button } from '@/components/ui/Button';

interface CalendarEvent {
  id: string;
  title: string;
  dateStart: Date;
  dateEnd: Date | null;
  type: string;
  location: string | null;
}

interface CalendarClientProps {
  events: CalendarEvent[];
}

const eventTypeColors: Record<string, string> = {
  GÓRY: 'bg-primary text-surface',
  INTEGRACJA: 'bg-yellow-500 text-surface',
  KULTURA: 'bg-blue-500 text-white',
};

export function CalendarClient({ events }: CalendarClientProps) {
  const searchParams = useSearchParams();
  const t = useTranslations('calendar');
  const tMonths = useTranslations('calendar.months');
  const tWeekdays = useTranslations('calendar.weekdays');

  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) {
      const parsed = new Date(dateParam);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  });

  const monthNames = [
    tMonths('january'),
    tMonths('february'),
    tMonths('march'),
    tMonths('april'),
    tMonths('may'),
    tMonths('june'),
    tMonths('july'),
    tMonths('august'),
    tMonths('september'),
    tMonths('october'),
    tMonths('november'),
    tMonths('december'),
  ];

  const weekDays = [
    tWeekdays('monday'),
    tWeekdays('tuesday'),
    tWeekdays('wednesday'),
    tWeekdays('thursday'),
    tWeekdays('friday'),
    tWeekdays('saturday'),
    tWeekdays('sunday'),
  ];

  // Track events that occur on each day
  const getDayEvents = (year: number, month: number, day: number): CalendarEvent[] => {
    const dayStart = new Date(year, month, day);
    const dayEnd = new Date(year, month, day, 23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.dateStart);
      const eventEnd = event.dateEnd ? new Date(event.dateEnd) : eventStart;
      return eventStart <= dayEnd && eventEnd >= dayStart;
    });
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and total days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Adjust for Monday start

  // Create calendar grid
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Ensure we have complete weeks
  const weeksNeeded = Math.ceil(calendarDays.length / 7);
  while (calendarDays.length < weeksNeeded * 7) {
    calendarDays.push(null);
  }

  // Event type legend
  const eventTypes = Array.from(
    new Set(events.map((e) => e.type).filter(Boolean))
  ).sort();

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const currentDay = today.getDate();

  return (
    <div className="space-y-8">
      {/* Calendar */}
      <div className="bg-surface-container-low border border-outline-variant/30 p-6">
        {/* Header with month/year and navigation */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display font-black text-3xl uppercase tracking-tight text-on-surface">
            {monthNames[month]} {year}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevMonth}
              aria-label={t('prevMonth')}
            >
              <ChevronLeft size={20} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextMonth}
              aria-label={t('nextMonth')}
            >
              <ChevronRight size={20} />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayEvents =
              day !== null ? getDayEvents(year, month, day) : [];
            const isToday = isCurrentMonth && day === currentDay;

            return (
              <div
                key={index}
                className={`min-h-[100px] p-2 border border-outline-variant/20 flex flex-col gap-1 ${
                  day === null ? 'bg-surface-container' : 'bg-surface-container-high'
                } ${isToday ? 'border-primary border-2' : ''}`}
              >
                {day !== null && (
                  <>
                    <span
                      className={`text-xs font-bold text-on-surface-variant ${
                        isToday ? 'text-primary' : ''
                      }`}
                    >
                      {day}
                    </span>
                    <div className="flex flex-col gap-1">
                      {dayEvents.slice(0, 2).map((event) => {
                        const colorClass =
                          eventTypeColors[event.type] ||
                          'bg-surface-variant text-on-surface-variant';
                        return (
                          <Link
                            key={event.id}
                            href={`/wydarzenia/${event.id}`}
                            className={`text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 cursor-pointer hover:opacity-90 transition-opacity line-clamp-1 ${colorClass}`}
                            title={event.title}
                          >
                            {event.title}
                          </Link>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <span className="text-[8px] text-on-surface-variant/60 px-1.5">
                          +{dayEvents.length - 2}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 justify-center md:justify-start">
        <div className="text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2 block">
            {t('legend')}
          </span>
          <div className="space-y-2">
            {Object.entries(eventTypeColors).map(([type, colorClass]) => (
              <div key={type} className="flex items-center gap-2">
                <div className={`w-3 h-3 ${colorClass}`} />
                <span className="text-xs text-on-surface-variant">{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming events info */}
      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Mountain size={48} className="text-on-surface-variant/30 mb-4" />
          <h3 className="font-display text-xl uppercase tracking-tighter text-on-surface mb-2">
            {t('emptyTitle')}
          </h3>
          <p className="text-sm text-on-surface-variant">
            {t('emptyDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
