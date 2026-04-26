import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Users, MapPin, Star, Calendar } from 'lucide-react';

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
    return events.filter(e => {
      const date = new Date(e.dateStart);
      return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
    });
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-on-surface uppercase leading-none">
              Kalendarz <span className="text-primary">Trupa</span>
            </h1>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant opacity-60">
              Wszystkie wyprawy i integracje w jednym miejscu
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center bg-surface-container border border-outline-variant/30 p-1 shadow-lg shrink-0">
            <button 
              onClick={prevMonth} 
              className="p-4 hover:bg-primary/10 text-primary transition-colors flex items-center justify-center"
              aria-label="Poprzedni miesiąc"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-sm font-black uppercase tracking-[0.2em] py-2 w-[280px] text-center select-none">
              {currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
              onClick={nextMonth} 
              className="p-4 hover:bg-primary/10 text-primary transition-colors flex items-center justify-center"
              aria-label="Następny miesiąc"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-px bg-outline-variant/20 border border-outline-variant/30 animate-pulse">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface-container-low"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px bg-outline-variant/30 border border-outline-variant/30 shadow-2xl">
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

              return (
                <div 
                  key={i} 
                  className={`min-h-[140px] p-2 transition-colors border-b border-r border-outline-variant/30 ${
                    isCurrentMonth ? 'bg-surface hover:bg-surface-container-low' : 'bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs font-black font-display p-1.5 ${
                      isToday ? 'bg-primary text-surface' : 
                      isCurrentMonth ? 'text-on-surface-variant' : 'text-on-surface-variant/50'
                    }`}>
                      {String(day).padStart(2, '0')}
                    </span>
                  </div>
                  <div className={`space-y-1 ${!isCurrentMonth ? 'opacity-40 grayscale' : ''}`}>
                    {dayEvents.map(event => (
                      <Link 
                        key={event.id} 
                        to={`/wydarzenia/${event.id}`}
                        className={`block p-2 text-[9px] font-bold uppercase tracking-tight border-l-4 transition-all hover:translate-x-1 shadow-sm ${
                          event.type === 'GÓRY' ? 'border-primary bg-primary/5 text-on-surface' : 
                          event.type === 'INTEGRACJA' ? 'border-yellow-500 bg-yellow-500/5 text-on-surface' :
                          'border-outline-variant bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        <div className="truncate mb-0.5">{event.title}</div>
                        <div className="flex items-center gap-1 opacity-60">
                          <MapPin size={8} /> {event.location || 'Brak lokalizacji'}
                        </div>
                      </Link>
                    ))}
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
    </div>
  );
}
