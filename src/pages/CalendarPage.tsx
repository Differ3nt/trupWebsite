import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Users, MapPin, Star, Calendar } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

export default function CalendarPage() {
  const location = useLocation();
  const [currentDate, setCurrentDate] = useState(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);
    
    fetch('/api/events')
      .then(r => r.json())
      .then(d => setEvents(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('pl-PL', { month: 'long' });

  const totalDays = daysInMonth(year, month);
  const startDay = (firstDayOfMonth(year, month) + 6) % 7; // Adjust to Monday start

  const days = [];
  
  // Previous month padding
  const prevMonthDate = new Date(year, month - 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonthNum = prevMonthDate.getMonth();
  const daysInPrevMonth = daysInMonth(prevYear, prevMonthNum);
  
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      month: prevMonthNum,
      year: prevYear,
      isCurrentMonth: false
    });
  }

  // Current month
  for (let i = 1; i <= totalDays; i++) {
    days.push({
      day: i,
      month: month,
      year: year,
      isCurrentMonth: true
    });
  }

  // Next month padding
  const currentTotal = days.length;
  const remainingSlots = currentTotal % 7 === 0 ? 0 : 7 - (currentTotal % 7);
  
  const nextMonthDate = new Date(year, month + 1);
  const nextYear = nextMonthDate.getFullYear();
  const nextMonthNum = nextMonthDate.getMonth();

  for (let i = 1; i <= remainingSlots; i++) {
    days.push({
      day: i,
      month: nextMonthNum,
      year: nextYear,
      isCurrentMonth: false
    });
  }

  const getEventsForDay = (d: number, m: number, y: number) => {
    const dayDate = new Date(y, m, d);
    dayDate.setHours(0, 0, 0, 0);

    return events.filter(e => {
      const start = new Date(e.dateStart);
      start.setHours(0, 0, 0, 0);
      
      // If no end date, treat as 1-day event
      const end = e.dateEnd ? new Date(e.dateEnd) : new Date(e.dateStart);
      end.setHours(0, 0, 0, 0);

      return dayDate >= start && dayDate <= end;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader 
        title="Kalendarz Wypraw" 
        subtitle="HARMONOGRAM DZIAŁAŃ GRUPY TRUP W TERENIE."
        category="Plany operacyjne"
      />

          {/* Navigation Controls */}
          <div className="flex items-center bg-surface-container border border-outline-variant/30 p-1 shadow-lg shrink-0">
            <button 
              onClick={prevMonth} 
              className="btn btn-secondary p-4 flex items-center justify-center border-none"
              aria-label="Poprzedni miesiąc"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] py-2 w-[280px] text-center select-none">
              {currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={nextMonth} 
              className="btn btn-secondary p-4 flex items-center justify-center border-none"
              aria-label="Następny miesiąc"
            >
              <ChevronRight size={24} />
            </button>
          </div>

      {loading ? (
        <div className="max-w-7xl mx-auto mt-8">
          <Skeleton className="h-8 w-48 mb-8 mx-auto" />
          <div className="grid grid-cols-7 gap-1 mb-2">
            {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-6" />)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-16 md:h-24" />)}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px bg-outline-variant/30 border border-outline-variant/30 shadow-2xl mt-8">
            {/* Weekdays */}
            {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map(d => (
              <div key={d} className="bg-surface-container-highest p-4 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/30">
                {d}
              </div>
            ))}

            {/* Days */}
            {days.map((dayObj, i) => {
              const { day, month: dayMonth, year: dayYear, isCurrentMonth } = dayObj;
              const dayEvents = getEventsForDay(day, dayMonth, dayYear);
              const isToday = isCurrentMonth && new Date().toDateString() === new Date(year, month, day).toDateString();
              const dayDate = new Date(dayYear, dayMonth, day);
              dayDate.setHours(0, 0, 0, 0);

              return (
                <div 
                  key={i} 
                  className={`min-h-[140px] p-0 transition-colors border-b border-r border-outline-variant/30 ${
                    isCurrentMonth ? 'bg-surface hover:bg-surface-container-low' : 'bg-surface-container-lowest'
                  }`}
                >
                  <div className="p-2 flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-black font-display px-2 py-1 ${
                      isToday ? 'bg-primary text-surface' : 
                      isCurrentMonth ? 'text-on-surface-variant' : 'text-on-surface-variant/50'
                    }`}>
                      {String(day).padStart(2, '0')}
                    </span>
                  </div>
                  <div className={`flex flex-col ${!isCurrentMonth ? 'opacity-40 grayscale' : ''}`}>
                    {dayEvents.map(event => {
                      const startDate = new Date(event.dateStart);
                      startDate.setHours(0, 0, 0, 0);
                      const endDate = event.dateEnd ? new Date(event.dateEnd) : startDate;
                      endDate.setHours(0, 0, 0, 0);

                      const isStart = dayDate.getTime() === startDate.getTime();
                      const isEnd = dayDate.getTime() === endDate.getTime();
                      const isMultiDay = startDate.getTime() !== endDate.getTime();

                      return (
                        <Link 
                          key={event.id} 
                          to={`/wydarzenia/${event.id}`}
                          className={cn(
                            "block p-2 text-[11px] font-bold uppercase tracking-wide transition-all h-[46px] flex flex-col justify-center",
                            isStart ? "border-l-4" : "border-l-0",
                            !isMultiDay && "mx-1 my-0.5 shadow-sm rounded-sm",
                            isMultiDay && isStart && "ml-1 mr-0 my-0.5 rounded-l-sm",
                            isMultiDay && isEnd && "mr-1 ml-0 my-0.5 rounded-r-sm",
                            isMultiDay && !isStart && !isEnd && "mx-0 my-0.5",
                            event.type === 'GÓRY' ? 'border-primary bg-primary/10 text-on-surface hover:bg-primary/20' : 
                            event.type === 'INTEGRACJA' ? 'border-yellow-500 bg-yellow-500/10 text-on-surface hover:bg-yellow-500/20' :
                            'border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
                          )}
                        >
                          <div className="truncate mb-0.5 font-black text-on-surface">
                            {isStart ? event.title : <span>&nbsp;</span>}
                          </div>
                          <div className="flex items-center gap-1 opacity-60">
                            {isStart ? (
                              <>
                                <MapPin size={8} /> {event.location || 'Brak lokalizacji'}
                              </>
                            ) : (
                              <span>&nbsp;</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary"></div> Wyprawy Górskie
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500"></div> Integracje
          </div>
          <div className="flex items-center gap-2 text-primary font-black ml-auto">
            <Star size={10} fill="currentColor" /> Kliknij w wydarzenie aby zobaczyć szczegóły
          </div>
        </div>
    </div>
  );
}
