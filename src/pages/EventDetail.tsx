import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink, Check, Loader2, Bell, X, User as UserIcon, Settings, Star, UserCheck, ChevronRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import MapyLink from '../components/MapyLink';

// Modal 1: Wybór Statusu
function StatusModal({ event, initialStatus, onConfirm, onCancel, onClose }: { event: any; initialStatus?: string; onConfirm: (status: string) => void; onCancel: () => void; onClose: () => void }) {
  const [status, setStatus] = useState<'INTERESTED' | 'GOING'>((initialStatus as any) || 'GOING');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={onClose}>
      <div className="bg-surface border-4 border-primary p-8 max-w-md w-full shadow-[20px_20px_0px_0px_rgba(var(--color-primary-rgb),0.2)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-8">
          <h3 className="font-display font-black text-3xl uppercase tracking-tighter text-on-surface">Uczestnictwo</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors"><X size={24} /></button>
        </div>

        <div className="space-y-4 mb-10">
          <button 
            onClick={() => setStatus('GOING')} 
            className={`w-full py-6 font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-4 ${status === 'GOING' ? 'bg-primary text-surface border-primary shadow-lg' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary'}`}
          >
            <CheckCircle2 size={20} /> Idę
          </button>
          <button 
            onClick={() => setStatus('INTERESTED')} 
            className={`w-full py-6 font-black text-xs uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-4 ${status === 'INTERESTED' ? 'bg-primary text-surface border-primary shadow-lg' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary'}`}
          >
            <Star size={20} fill={status === 'INTERESTED' ? 'currentColor' : 'none'} /> Zainteresowany
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => onConfirm(status)} className="w-full py-5 font-display font-black text-lg uppercase tracking-wider bg-primary text-surface hover:bg-primary/90 transition-all flex items-center justify-center gap-3">
            Zatwierdź <ChevronRight size={20} />
          </button>
          
          {initialStatus && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCancel();
              }} 
              className="w-full py-3 font-bold text-[10px] uppercase tracking-widest text-red-600 hover:bg-red-600 hover:text-white border border-red-600/30 transition-all mt-4"
            >
              Rezygnuję z wyprawy
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal 2: Wybór Powiadomień
function NotifyModal({ event, initialNotify, onConfirm, onClose }: { event: any; initialNotify?: number | null; onConfirm: (days: number | null) => void; onClose: () => void }) {
  const [notifyDays, setNotifyDays] = useState<number | null>(initialNotify !== undefined ? initialNotify : null);

  const daysToEvent = useMemo(() => {
    const today = new Date();
    const eventDate = new Date(event.dateStart);
    const diff = eventDate.getTime() - today.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [event.dateStart]);

  const options = [1, 2, 3, 7, 14, 30].filter(d => d <= daysToEvent);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={onClose}>
      <div className="bg-surface border-4 border-primary p-8 max-w-md w-full shadow-[20px_20px_0px_0px_rgba(var(--color-primary-rgb),0.2)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-8">
          <h3 className="font-display font-black text-3xl uppercase tracking-tighter text-on-surface">Powiadomienia</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors"><X size={24} /></button>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-6">Powiadom mnie przed wyprawą:</p>

        <div className="grid grid-cols-2 gap-3 mb-10">
          <button 
            onClick={() => setNotifyDays(null)}
            className={`py-4 font-black text-xs uppercase tracking-widest border-2 transition-all ${notifyDays === null ? 'bg-primary text-surface border-primary' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary'}`}
          >
            Nie powiadamiaj
          </button>
          {options.map(days => (
            <button 
              key={days}
              onClick={() => setNotifyDays(days)}
              className={`py-4 font-black text-xs uppercase tracking-widest border-2 transition-all ${notifyDays === days ? 'bg-primary text-surface border-primary' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary'}`}
            >
              {days} {days === 1 ? 'dzień' : 'dni'} przed
            </button>
          ))}
        </div>

        <button onClick={() => onConfirm(notifyDays)} className="w-full py-5 font-display font-black text-lg uppercase tracking-wider bg-primary text-surface hover:bg-primary/90 transition-all shadow-lg">
          Zapisz ustawienia
        </button>
      </div>
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, user, hasHardware } = useAppContext();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [notifyDays, setNotifyDays] = useState<number | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  // Admin attendance logic
  const [adminAttendanceMode, setAdminAttendanceMode] = useState(false);

  const fetchEvent = () => {
    fetch(`/api/events/${id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        setRsvpStatus(data.myRsvp ?? null);
        setNotifyDays(data.myNotifyDays ?? null);
      })
      .catch(err => console.error('Błąd pobierania wydarzenia:', err))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleStatusConfirm = async (status: string) => {
    setShowStatusModal(false);
    setRsvpLoading(true);
    try {
      const res = await fetch(`/api/events/${id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, notifyDaysBefore: notifyDays })
      });
      const data = await res.json();
      if (data.success) {
        setRsvpStatus(data.status);
        fetchEvent(); // Odświeżamy listę uczestników
        
        // Jeśli to nowy zapis, pokaż modal powiadomień
        if (!rsvpStatus) {
           setTimeout(() => setShowNotifyModal(true), 300);
        }
      }
    } catch (err) {
      console.error('Błąd RSVP:', err);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleNotifyConfirm = async (days: number | null) => {
    setShowNotifyModal(false);
    setRsvpLoading(true);
    
    // Kluczowe: używamy effectiveRsvpStatus, aby nie wysłać nulla do bazy
    const currentStatus = effectiveRsvpStatus;
    
    try {
      await fetch(`/api/events/${id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: currentStatus, notifyDaysBefore: days })
      });
      setNotifyDays(days);
      fetchEvent();
    } catch (err) {
      console.error('Błąd powiadomień:', err);
    } finally {
      setRsvpLoading(false);
    }
  };

  const cancelRsvp = async () => {
    // Usunięcie window.confirm dla lepszej responsywności (użytkownik już kliknął w modalu)
    
    // Najpierw zamykamy okna i ustawiamy loading
    setShowStatusModal(false);
    setRsvpLoading(true);

    try {
      const res = await fetch(`/api/events/${id}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: null })
      });
      
      const data = await res.json();
      if (data.success) {
        // Czyścimy wszystko lokalnie
        setRsvpStatus(null);
        setNotifyDays(null);
        // Odświeżamy dane z serwera dla pewności
        await fetchEvent();
        alert('Wypisano Cię z wydarzenia.');
      }
    } catch (err) {
      console.error('Błąd anulowania RSVP:', err);
      alert('Wystąpił błąd podczas wypisywania się. Spróbuj ponownie.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const toggleAttendance = async (userId: string, current: boolean) => {
    if (!event) return;
    try {
      await fetch(`/api/events/${id}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, attended: !current })
      });
      setEvent((prev: any) => ({
        ...prev,
        participants: prev.participants.map((p: any) => 
          p.userId === userId ? { ...p, attended: !current } : p
        )
      }));
    } catch (err) {
      console.error('Błąd frekwencji:', err);
    }
  };

  if (loading) return <div className="pb-24 animate-pulse"><div className="h-[50vh] bg-surface-container-low" /></div>;
  if (!event) return <div className="pt-40 text-center font-bold">Nie znaleziono wydarzenia.</div>;

  const isPast = new Date(event.dateStart) < new Date();
  const isAdmin = role === 'admin';
  const participants = event.participants || [];
  
  const userInList = user?.id ? participants.find((p: any) => p.userId === user.id) : null;
  const effectiveRsvpStatus = rsvpStatus || userInList?.status;
  const effectiveNotifyDays = notifyDays !== null ? notifyDays : userInList?.notifyDaysBefore;

  const attendedList = participants.filter((p: any) => p.attended);
  const goingList = participants.filter((p: any) => p.status === 'GOING');
  const interestedList = participants.filter((p: any) => p.status === 'INTERESTED');
  const displayList = isPast ? attendedList : goingList;

  const formatName = (fullName: string) => {
    if (!fullName) return 'Anonim';
    const parts = fullName.trim().split(' ');
    if (parts.length < 2) return fullName;
    return `${parts[0]} ${parts[1][0]}.`;
  };

  return (
    <div className="pb-24">
      {/* Hero Header */}
      <div className="relative h-[60vh] min-h-[500px] flex items-end pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[#121212]">
          <img src={event.image || ''} alt="" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent"></div>
        </div>
        <div className="container mx-auto px-6 md:px-8 relative z-10">
          <Link to="/wydarzenia" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 font-bold uppercase tracking-widest text-[10px] transition-all bg-black/40 backdrop-blur-md px-4 py-2 border border-white/10">
            <ArrowLeft size={14} /> Wróć do bazy wypraw
          </Link>
          <div className="flex flex-wrap gap-3 mb-6">
            {!isPast && event.spots > 0 && (
              <span className={`px-4 py-1.5 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl ${goingList.length >= event.spots ? 'bg-red-600 text-white' : 'bg-primary text-surface'}`}>
                {goingList.length >= event.spots ? 'BRAK MIEJSC' : `${event.spots - goingList.length} WOLNYCH MIEJSC`}
              </span>
            )}
            {isPast && <span className="bg-[#37392E] text-white px-4 py-1.5 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl">WYDARZENIE ARCHIWALNE</span>}
          </div>
          <h1 className="font-display font-black text-5xl md:text-8xl text-white uppercase tracking-tighter leading-[0.85] drop-shadow-2xl">{event.title}</h1>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          <div className="lg:col-span-2">
            <section className="mb-20">
              <h2 className="font-display font-black text-4xl uppercase tracking-tighter mb-10 flex items-center gap-4"><span className="text-primary text-5xl">/</span> O wydarzeniu</h2>
              <p className="text-on-surface-variant text-2xl leading-relaxed font-medium max-w-3xl">{event.description || 'Brak opisu.'}</p>
            </section>

            {/* Mapa i Lokalizacja */}
            {(event.mapLink || event.mapEmbed) && (
              <section className="mb-20">
                <h2 className="font-display font-black text-4xl uppercase tracking-tighter mb-10 flex items-center gap-4">
                  <span className="text-primary text-5xl">/</span> Lokalizacja i trasa
                </h2>
                <div className="bg-[#121212] border-4 border-white/5 p-2 overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative group">
                  {event.mapEmbed ? (
                    <div 
                      className="aspect-video w-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 grayscale-[20%] brightness-[0.85] hover:grayscale-0 transition-all duration-700"
                      dangerouslySetInnerHTML={{ __html: event.mapEmbed }}
                    />
                  ) : (() => {
                    let url = event.mapLink;
                    if (!url) return (
                      <div className="h-64 bg-surface-container-highest flex flex-col items-center justify-center text-on-surface-variant gap-4">
                        <MapPin size={48} className="opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Brak mapy</p>
                      </div>
                    );

                    if (url.includes('mapy.com')) url = url.replace('mapy.com', 'mapy.cz');
                    
                    if (url.includes('google.com/maps') || url.includes('goo.gl/maps')) {
                      const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(url)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
                      return (
                        <div className="relative aspect-video w-full overflow-hidden bg-surface-container-highest">
                          <iframe 
                            src={embedUrl} 
                            className="absolute inset-0 w-full h-full border-0 grayscale-[40%] contrast-[1.2] brightness-[0.8] hover:grayscale-0 transition-all duration-700" 
                            allowFullScreen 
                          />
                          <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10"></div>
                        </div>
                      );
                    }
                    if (url.includes('mapy.cz')) {
                      const isShort = url.includes('mapy.cz/s/');
                      if (isShort) {
                        return (
                          <div className="aspect-video w-full bg-[#1A1C18] relative flex flex-col items-center justify-center overflow-hidden">
                            {/* Dekoracyjne linie topograficzne (stylizacja) */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none scale-150 rotate-12">
                              <svg width="100%" height="100%" viewBox="0 0 100 100">
                                {Array.from({length: 10}).map((_, i) => (
                                  <circle key={i} cx="50" cy="50" r={10 + i*10} fill="none" stroke="white" strokeWidth="0.5" />
                                ))}
                              </svg>
                            </div>
                            <div className="relative z-10 text-center p-8">
                              <div className="w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center mb-8 mx-auto border border-primary/30 relative">
                                 <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20"></div>
                                 <MapPin size={56} className="text-primary" />
                              </div>
                              <h3 className="font-display font-black text-5xl uppercase tracking-tighter mb-4 text-white drop-shadow-lg">Pełna mapa trasy</h3>
                              <p className="text-base text-white/50 max-w-sm mx-auto leading-relaxed mb-10 font-medium">Kliknij poniżej, aby otworzyć interaktywną mapę w nowym oknie dla pełnej interaktywności.</p>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-6 bg-primary text-surface px-14 py-6 font-black text-sm uppercase tracking-[0.3em] hover:bg-white hover:scale-105 transition-all shadow-[0_25px_50px_-12px_rgba(var(--color-primary-rgb),0.5)]">
                                OTWARTE OKNO MAPY <ExternalLink size={24} />
                              </a>
                            </div>
                          </div>
                        );
                      }
                      // For full Mapy.cz links
                      // Oficjalny widżet Mapy.cz (frame.mapy.cz)
                      const widgetUrl = `https://frame.mapy.cz/v1/m?url=${encodeURIComponent(url)}&lang=pl`;
                      return (
                        <div className="relative aspect-video w-full overflow-hidden bg-surface-container-highest">
                           <iframe 
                            src={widgetUrl} 
                            className="absolute inset-0 w-full h-full border-0 grayscale-[20%] brightness-[0.85] hover:grayscale-0 transition-all duration-700" 
                            allowFullScreen 
                           />
                           <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10"></div>
                        </div>
                      );
                    }
                    return (
                      <div className="h-64 bg-surface-container-highest flex flex-col items-center justify-center text-on-surface-variant gap-4">
                        <MapPin size={48} className="opacity-20" />
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2">
                          Otwórz mapę zewnętrzną <ExternalLink size={12} />
                        </a>
                      </div>
                    );
                  })()}
                  {event.location && (
                    <div className="p-8 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-outline-variant/10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                           <MapPin size={24} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Miejsce zbiórki / Cel</p>
                          <span className="font-display font-black text-2xl uppercase tracking-tight">{event.location}</span>
                        </div>
                      </div>
                      <a 
                        href={event.mapLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-primary/10 text-primary px-6 py-3 font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-surface transition-all flex items-center gap-3 border border-primary/20"
                      >
                        Nawiguj do celu <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Listy osób */}
            <section className="mb-20">
              <div className="flex justify-between items-end mb-10 border-b border-outline-variant/20 pb-6">
                <h2 className="font-display font-black text-4xl uppercase tracking-tighter flex items-center gap-4">
                  <span className="text-primary text-5xl">/</span> {isPast ? 'Uczestnicy' : 'Ekipa wyprawy'}
                </h2>
                {isPast && isAdmin && (
                  <button onClick={() => setAdminAttendanceMode(!adminAttendanceMode)} className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest border-4 transition-all ${adminAttendanceMode ? 'bg-primary text-surface border-primary shadow-lg' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary'}`}>
                    {adminAttendanceMode ? 'ZATWIERDŹ LISTĘ' : 'ZARZĄDZAJ OBECNOŚCIĄ'}
                  </button>
                )}
              </div>

              <div className="space-y-16">
                {displayList.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {displayList.map((p: any) => (
                      <div key={p.userId} className={`group flex flex-col items-center p-6 bg-surface-container-low border-2 border-outline-variant/10 relative transition-all hover:border-primary/40 ${adminAttendanceMode ? 'cursor-pointer ring-2 ring-primary/20' : ''}`} onClick={() => adminAttendanceMode && toggleAttendance(p.userId, p.attended)}>
                        <div className="w-20 h-20 bg-surface-container-highest mb-4 overflow-hidden rounded-none border-2 border-surface group-hover:border-primary transition-all rotate-3 group-hover:rotate-0">
                          {p.user.avatarUrl ? <img src={p.user.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-on-surface-variant/20 m-auto mt-4" />}
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-widest text-center">{formatName(p.user.name)}</span>
                        <span className="text-[9px] font-bold text-primary mt-1 opacity-60 uppercase tracking-tighter">Uczestnik</span>
                        {adminAttendanceMode && p.attended && <div className="absolute top-2 right-2 text-primary animate-bounce"><CheckCircle2 size={20} /></div>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-lg text-on-surface-variant italic font-medium">Lista oczekuje na pierwszych śmiałków...</p>}

                {!isPast && interestedList.length > 0 && (
                  <div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-px bg-outline-variant/30 flex-grow"></div>
                      <p className="text-[12px] font-black uppercase tracking-[0.3em] text-on-surface-variant">ZAINTERESOWANI ({interestedList.length})</p>
                      <div className="h-px bg-outline-variant/30 flex-grow"></div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {interestedList.map((p: any) => (
                        <div key={p.userId} className="group flex items-center gap-3 p-3 bg-surface border border-outline-variant/10 hover:border-primary/30 transition-all">
                          <div className="w-10 h-10 bg-surface-container-highest overflow-hidden border border-surface grayscale group-hover:grayscale-0 transition-all">
                            {p.user.avatarUrl ? <img src={p.user.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-on-surface-variant/20 m-auto mt-2" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-tight">{formatName(p.user.name)}</span>
                            <span className="text-[8px] font-bold text-on-surface-variant/60 uppercase">Rozważa udział</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
          
          {/* Panel Boczny - Logistyka */}
          <aside>
            <div className="bg-[#f9f9f8] border border-outline-variant/30 p-8 sticky top-28 text-[#37392E] shadow-xl">
              <h3 className="font-display font-black text-2xl uppercase tracking-tighter mb-8 border-b-4 border-primary pb-4 font-black">LOGISTYKA</h3>
              
              <div className="space-y-6 mb-10">
                <Link 
                  to={`/kalendarz?date=${event.dateStart}`}
                  className="flex items-start gap-4 group cursor-pointer hover:bg-primary/5 p-2 -m-2 transition-all"
                  title="Pokaż w kalendarzu"
                >
                  <Calendar className="text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" size={20} />
                  <div>
                    <p className="font-black uppercase text-[10px] tracking-widest text-[#37392E]/50 mb-1">Kiedy</p>
                    <p className="font-bold text-sm group-hover:text-primary transition-colors underline decoration-primary/30 underline-offset-4">
                      {new Date(event.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </Link>
                <MapyLink url={event.mapLink} locationName={event.location} />
              </div>
              
              {!isPast && (
                role === 'guest' ? (
                  <button onClick={() => useAppContext().loginWithGoogle()} className="w-full font-display font-black uppercase tracking-widest py-5 bg-primary text-surface hover:bg-primary/90 transition-all shadow-[8px_8px_0px_0px_rgba(var(--color-primary-rgb),0.2)]">ZALOGUJ SIĘ, BY DOŁĄCZYĆ</button>
                ) : (
                  <div className="space-y-4">
                    {/* Główny przycisk: Dołącz lub Zarządzaj */}
                    <button 
                      onClick={() => setShowStatusModal(true)} 
                      className={`w-full py-5 font-display font-black text-lg uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(var(--color-primary-rgb),0.2)] ${effectiveRsvpStatus ? 'bg-primary text-surface' : 'bg-primary text-surface'}`}
                    >
                      {effectiveRsvpStatus ? (
                        <>ZARZĄDZAJ UCZESTNICTWEM <Settings size={20} /></>
                      ) : (
                        <>DOŁĄCZ DO WYPRAWY</>
                      )}
                    </button>

                    {/* Przycisk Powiadomień */}
                    <button 
                      onClick={() => setShowNotifyModal(true)} 
                      disabled={!effectiveRsvpStatus}
                      className={`w-full py-4 font-black text-[10px] uppercase tracking-widest border-4 transition-all flex items-center justify-center gap-3 ${effectiveNotifyDays ? 'bg-[#37392E] text-white border-primary shadow-lg' : 'bg-surface border-primary/40 text-on-surface hover:border-primary'} ${!effectiveRsvpStatus ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                    >
                      <Bell size={16} className={effectiveNotifyDays ? 'text-primary' : ''} /> 
                      {effectiveNotifyDays ? `POWIADOMIENIE: ${effectiveNotifyDays} DNI PRZED` : 'USTAW POWIADOMIENIE'}
                    </button>

                    {effectiveRsvpStatus && (
                       <p className="text-[9px] text-center font-bold uppercase tracking-widest opacity-60">Status: {effectiveRsvpStatus === 'GOING' ? 'IDĘ' : 'ZAINTERESOWANY'}</p>
                    )}
                  </div>
                )
              )}
            </div>
          </aside>
        </div>
      </div>

      {showStatusModal && (
        <StatusModal
          event={event}
          initialStatus={effectiveRsvpStatus || undefined}
          onConfirm={handleStatusConfirm}
          onCancel={cancelRsvp}
          onClose={() => setShowStatusModal(false)}
        />
      )}

      {showNotifyModal && (
        <NotifyModal
          event={event}
          initialNotify={effectiveNotifyDays}
          onConfirm={handleNotifyConfirm}
          onClose={() => setShowNotifyModal(false)}
        />
      )}
    </div>
  );
}
