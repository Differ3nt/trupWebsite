import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ArrowLeft, CheckCircle2, AlertTriangle, ExternalLink, Check, Loader2, Bell, X, User as UserIcon, Settings, Star, UserCheck, ChevronRight, HelpCircle, Skull, Map as MapIcon } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useAppContext } from '../contexts/AppContext';
import { cn } from '../lib/utils';
import MapyLink from '../components/MapyLink';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EventCountdown from '../components/EventCountdown';
import { GpxUploadModal } from '../components/GpxUploadModal';
import GpxPreview from '../components/GpxPreview';

const formatName = (fullName: string) => {
  if (!fullName) return 'Anonim';
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0]} ${parts[1][0]}.`;
};

// Modal 1: Wybór Statusu
function StatusModal({ event, initialStatus, onConfirm, onCancel, onClose }: { event: any; initialStatus?: string; onConfirm: (status: string) => void; onCancel: () => void; onClose: () => void }) {
  const { setIsModalOpen } = useAppContext();
  const [status, setStatus] = useState<'INTERESTED' | 'GOING'>((initialStatus as any) || 'GOING');

  React.useEffect(() => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
    return () => {
      setIsModalOpen(false);
      document.body.style.overflow = 'unset';
    };
  }, [setIsModalOpen]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto" onClick={onClose}>
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
    </div>,
    document.body
  );
}

// Modal 2: Wybór Powiadomień
function NotifyModal({ event, initialNotify, onConfirm, onClose }: { event: any; initialNotify?: number | null; onConfirm: (days: number | null) => void; onClose: () => void }) {
  const { setIsModalOpen } = useAppContext();
  const [notifyDays, setNotifyDays] = useState<number | null>(initialNotify !== undefined ? initialNotify : null);

  React.useEffect(() => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
    return () => {
      setIsModalOpen(false);
      document.body.style.overflow = 'unset';
    };
  }, [setIsModalOpen]);

  const daysToEvent = useMemo(() => {
    const today = new Date();
    const eventDate = new Date(event.dateStart);
    const diff = eventDate.getTime() - today.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [event.dateStart]);

  const options = [1, 2, 3, 7, 14, 30].filter(d => d <= daysToEvent);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto" onClick={onClose}>
      <div className="bg-surface border-4 border-primary p-8 max-w-md w-full shadow-[20px_20px_0px_0px_rgba(var(--color-primary-rgb),0.2)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-8">
          <h3 className="font-display font-black text-3xl uppercase tracking-tighter text-on-surface">Powiadomienia</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors"><X size={24} /></button>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant mb-6">Powiadom mnie przed wyprawą:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
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
    </div>,
    document.body
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { role, user, hasHardware, loginWithGoogle } = useAppContext();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
  const [notifyDays, setNotifyDays] = useState<number | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  
  const formatDuration = (min: number) => {
    if (!min) return '';
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  // Admin attendance logic
  const [adminAttendanceMode, setAdminAttendanceMode] = useState(false);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [stickyStyle, setStickyStyle] = useState<React.CSSProperties>({
    position: 'sticky',
    top: '7rem',
  });

  React.useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (!sidebarRef.current) return;
      const sidebar = sidebarRef.current;
      const sidebarHeight = sidebar.offsetHeight;
      const viewportHeight = window.innerHeight;

      if (sidebarHeight > viewportHeight - 112) {
        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;

        if (scrollingDown) {
          setStickyStyle({
            position: 'sticky',
            top: `calc(100vh - ${sidebarHeight + 32}px)`,
          });
        } else {
          setStickyStyle({
            position: 'sticky',
            top: '7rem',
          });
        }
        lastScrollY = currentScrollY;
      } else {
        setStickyStyle({
          position: 'sticky',
          top: '7rem',
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const isPast = useMemo(() => {
    if (!event) return false;
    const end = event.dateEnd ? new Date(event.dateEnd) : new Date(event.dateStart);
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    return end < startOfToday;
  }, [event]);

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

  const mapSection = useMemo(() => {
    if (!event) return null;
    
    const officialGpx = (event.gpxSubmissions || [])
      .filter((g: any) => g.isOfficial)
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    const hasGpx = officialGpx.length > 0;
    
    if (!hasGpx && !(event.mapLink || event.mapEmbed)) return null;

    const renderMap = (url: string, label?: string) => {
      if (!url) return null;
      if (url.includes('mapy.com')) url = url.replace('mapy.com', 'mapy.cz');
      
      let content;
      if (url.includes('google.com/maps') || url.includes('goo.gl/maps')) {
        const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(url)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        content = (
          <div className="relative aspect-video w-full overflow-hidden bg-surface-container-highest">
            <iframe 
              src={embedUrl} 
              className="absolute inset-0 w-full h-full border-0 grayscale-[40%] contrast-[1.2] brightness-[0.8] hover:grayscale-0 transition-all duration-700" 
              allowFullScreen 
            />
            <div className="absolute inset-0 pointer-events-none border-[1px] border-white/10"></div>
          </div>
        );
      } else if (url.includes('mapy.cz')) {
        const isShort = url.includes('mapy.cz/s/');
        if (isShort) {
          content = (
            <div className="aspect-video w-full bg-[#1A1C18] relative flex flex-col items-center justify-center overflow-hidden">
              <div className="relative z-10 text-center p-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto border border-primary/30">
                  <MapPin size={32} className="text-primary" />
                </div>
                <h3 className="font-display font-black text-3xl uppercase tracking-tighter mb-4 text-white">Mapa trasy</h3>
                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-4 bg-primary text-surface px-8 py-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:scale-105 transition-all">
                  OTWÓRZ MAPĘ <ExternalLink size={16} />
                </a>
              </div>
            </div>
          );
        } else {
          const widgetUrl = `https://frame.mapy.cz/v1/m?url=${encodeURIComponent(url)}&lang=pl`;
          content = (
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
      } else {
        content = (
          <div className="h-64 bg-surface-container-highest flex flex-col items-center justify-center text-on-surface-variant gap-4">
            <MapPin size={48} className="opacity-20" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors flex items-center gap-2">
              Otwórz mapę zewnętrzną <ExternalLink size={12} />
            </a>
          </div>
        );
      }

      return (
        <div key={url} className="space-y-4">
          {label && (
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{label}</h4>
            </div>
          )}
          <div className="bg-[#121212] border-4 border-white/5 p-2 overflow-hidden shadow-xl relative group">
            {content}
          </div>
        </div>
      );
    };

    return (
      <div className="mt-12 border-t border-outline-variant/20 pt-10 space-y-12">
        <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface mb-4">
          Trasa
        </h3>
        
        {/* Render Official GPX Tracks */}
        {officialGpx.length > 0 ? (
          <div className="space-y-16">
            {officialGpx.map((g: any) => {
              return (
                <div key={g.id} className="space-y-6">
                  <div className="flex justify-between items-end border-b border-white/10 pb-2">
                    <h3 className="font-display font-black text-xl uppercase text-primary">{g.label || 'Trasa'}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      {g.distance}km · {g.elevationGain}m up · {formatDuration(g.duration)}
                    </p>
                  </div>
                  
                  {/* Interactive GPX Preview (like in Admin) */}
                  {g.filePath && (
                    <div className="bg-[#121212] border-4 border-white/5 overflow-hidden shadow-xl relative group">
                       <GpxPreview fileUrl={`http://localhost:3001/${g.filePath.replace(/\\/g, '/')}`} />
                    </div>
                  )}
                  
                  {/* External Map Embed/Link as fallback/alternative */}
                  {!g.filePath && (g.mapEmbed || g.mapLink) && (
                    <div className="bg-[#121212] border-4 border-white/5 p-2 overflow-hidden shadow-xl relative group">
                      {g.mapEmbed ? (
                        <div 
                          className="aspect-video w-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 grayscale-[20%] brightness-[0.85] hover:grayscale-0 transition-all duration-700"
                          dangerouslySetInnerHTML={{ __html: g.mapEmbed }}
                        />
                      ) : renderMap(g.mapLink)}
                    </div>
                  )}

                  {/* Participants for this specific GPX day */}
                  {g.participantIds?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {g.participantIds.map((pid: string) => {
                        const p = event.participants.find((p: any) => p.userId === pid);
                        if (!p) return null;
                        return (
                          <div key={pid} className="flex items-center gap-2 bg-surface-container-highest/50 px-3 py-1.5 border border-outline-variant/10">
                            {p.user?.avatarUrl ? (
                              <img src={p.user.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                            ) : <UserIcon size={12} className="text-on-surface-variant/40" />}
                            <span className="text-[9px] font-bold uppercase tracking-tight text-on-surface-variant">{p.user?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {/* Render Event Level Map (Hide if we have official GPX tracks already) */}
        {(event.mapEmbed || event.mapLink) && officialGpx.length === 0 && (
          <div className="space-y-8">
            {event.mapEmbed ? (
               <div className="bg-[#121212] border-4 border-white/5 p-2 overflow-hidden shadow-xl relative group">
                 <div
                   className="aspect-video w-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 grayscale-[20%] brightness-[0.85] hover:grayscale-0 transition-all duration-700"
                   dangerouslySetInnerHTML={{ __html: event.mapEmbed }}
                 />
               </div>
            ) : renderMap(event.mapLink)}
          </div>
        )}
      </div>
    );
  }, [event?.mapLink, event?.mapEmbed, event?.location]);

  const meetingPointSection = useMemo(() => {
    if (!event?.meetingPointName) return null;
    return (
      <div className="mt-12 border-t border-outline-variant/20 pt-10">
        <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface mb-4">Miejsce Zbiórki</h3>
        <p className="font-bold uppercase tracking-widest text-on-surface-variant text-sm mb-6">
          {event.meetingPointName}
        </p>
        {event.meetingPointLink && (
          <MapyLink url={event.meetingPointLink} className="mb-4" />
        )}
        {event.meetingPointEmbed && (
          <div className="bg-[#121212] border-4 border-white/5 p-2 overflow-hidden shadow-xl">
            <div
              className="h-48 md:h-64 w-full relative [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0 grayscale-[20%] brightness-[0.85] hover:grayscale-0 transition-all duration-700"
              dangerouslySetInnerHTML={{ __html: event.meetingPointEmbed }}
            />
          </div>
        )}
      </div>
    );
  }, [event?.meetingPointName, event?.meetingPointLink, event?.meetingPointEmbed]);

  if (loading) return (
    <div className="min-h-screen bg-surface">
      <Skeleton className="w-full h-[50vh] rounded-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12">
          <div className="space-y-6">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-12 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-3 mt-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-2 mt-8">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-3 w-full" />)}
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
  if (!event) return <div className="pt-40 text-center font-bold">Nie znaleziono wydarzenia.</div>;


  const isAdmin = role === 'admin';
  const participants = event.participants || [];
  
  const userInList = user?.id ? participants.find((p: any) => p.userId === user.id) : null;
  const effectiveRsvpStatus = rsvpStatus || userInList?.status;
  const effectiveNotifyDays = notifyDays !== null ? notifyDays : userInList?.notifyDaysBefore;

  const missingCriticalItems = (event.gearCritical || []).filter(item => !hasHardware(item));
  const missingCriticalGear = missingCriticalItems.length > 0;

  const attendedList = participants.filter((p: any) => p.attended);
  const goingList = participants.filter((p: any) => p.status === 'GOING');
  const interestedList = participants.filter((p: any) => p.status === 'INTERESTED');
  const displayList = event.isFinalized ? attendedList : goingList;




  return (
    <div className="pb-24">
      {/* Hero Header */}
      <div className="relative h-[70vh] min-h-[500px] flex items-end pb-16 overflow-hidden -mt-24 md:-mt-32">
        <div className="absolute inset-0 bg-[#121212]">
          <img src={event.image ? `${event.image}?raw=1` : ''} alt="" className="w-full h-full object-cover opacity-80" style={{ objectPosition: `${event.imageFocalX ?? 50}% ${event.imageFocalY ?? 50}%` }} draggable={false} onContextMenu={e => e.preventDefault()} />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent"></div>
        </div>
        <div className="container mx-auto px-6 md:px-8 relative z-10">
          <Link to="/wydarzenia" className="btn btn-back inline-flex items-center gap-3 mb-8 px-6 py-4">
            <ArrowLeft size={16} /> Wróć do wydarzeń
          </Link>
          <h1 className="font-display font-black text-5xl md:text-8xl text-white uppercase leading-[0.85] drop-shadow-2xl mb-4">{event.title}</h1>
          
          {event.type === 'GÓRY' && event.difficulty && (
            <div className="flex items-center gap-6 mb-8">
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    className={i < event.difficulty ? 'text-primary' : 'text-white/20'} 
                    fill={i < event.difficulty ? 'currentColor' : 'none'} 
                  />
                ))}
              </div>
              
              {event.type === 'GÓRY' && (() => {
                const showActual = event.isFinalized && (event.actualDistance || event.actualElevation);
                const dist = showActual ? event.actualDistance : event.plannedDistance;
                const elev = showActual ? event.actualElevation : event.plannedElevation;
                const dur  = showActual ? event.actualDuration  : event.plannedDuration;
                if (!dist && !elev && !dur) return null;
                return (
                  <div className="flex flex-wrap gap-3 border-l border-white/10 pl-6 items-center">
                    {!showActual && <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Plan:</span>}
                    {dist > 0 && <Badge variant="primary" className="py-2 px-4 text-xs">{dist} KM</Badge>}
                    {elev > 0 && <Badge variant="warning" className="py-2 px-4 text-xs">{elev}M UP</Badge>}
                    {dur  > 0 && <Badge variant="secondary" className="py-2 px-4 text-xs bg-white/10 text-white border-white/20">{formatDuration(dur)}</Badge>}
                  </div>
                );
              })()}
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-4">
            {!isPast && <EventCountdown targetDate={event.dateStart} />}
            

            {!isPast && (
              event.spots !== null && event.spots > 0 ? (
                <div className={`bg-[#121212] border border-white/10 shadow-xl overflow-hidden h-12 flex items-stretch`}>
                  <div className={`${goingList.length >= event.spots ? 'bg-red-600' : 'bg-primary'} px-3 flex items-center justify-center text-surface`}>
                    <Users size={16} />
                  </div>
                  <div className="px-6 flex items-center">
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white">
                      {goingList.length >= event.spots ? 'BRAK MIEJSC' : `WOLNE MIEJSCA: ${event.spots - goingList.length}`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#121212] border border-white/10 shadow-xl overflow-hidden h-12 flex items-stretch">
                  <div className="bg-primary px-3 flex items-center justify-center text-surface">
                    <Users size={16} />
                  </div>
                  <div className="px-6 flex items-center">
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white">
                      {goingList.length} ZAPISANYCH
                    </p>
                  </div>
                </div>
              )
            )}
            {isPast && (
              <div className="bg-[#121212] border border-white/10 shadow-xl overflow-hidden h-12 flex items-stretch">
                <div className={cn("px-3 flex items-center justify-center text-surface", event.isFinalized ? "bg-green-600" : "bg-surface-variant")}>
                  {event.isFinalized ? <CheckCircle2 size={16} /> : <Calendar size={16} />}
                </div>
                <div className="px-6 flex items-center">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                    {event.isFinalized ? 'WYPRAWA ROZLICZONA' : 'WYDARZENIE ARCHIWALNE'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          <div className="lg:col-span-2">
            <section className="mb-20">
              <h2 className="font-display font-black text-4xl uppercase mb-10 flex items-center gap-4">Opis</h2>
              <div className="text-on-surface-variant text-base leading-relaxed font-medium max-w-3xl markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {event.description || 'Brak opisu.'}
                </ReactMarkdown>
              </div>
              {event.weatherInfo && (
                <div className="mt-12 border-t border-outline-variant/20 pt-10">
                  <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface mb-4">Pogoda</h3>
                  <p className="text-on-surface-variant text-base leading-relaxed font-medium max-w-3xl whitespace-pre-line">
                    {event.weatherInfo}
                  </p>
                </div>
              )}
              {event.transport && (
                <div className="mt-12 border-t border-outline-variant/20 pt-10">
                  <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface mb-4">Dojazd</h3>
                  <p className="text-on-surface-variant text-base leading-relaxed font-medium max-w-3xl whitespace-pre-line">
                    {event.transport}
                  </p>
                </div>
              )}
              {meetingPointSection}
              {mapSection}
            </section>
          </div>

          {/* Panel Boczny - Logistyka */}
          <aside>
            <div ref={sidebarRef} style={stickyStyle} className="bg-surface-container-low border border-outline-variant/30 p-8 text-on-surface shadow-2xl">
              <div className="flex items-center justify-between mb-8 border-b-4 border-primary pb-4">
                <h3 className="font-display font-black text-2xl uppercase font-black">TLDR</h3>
                <div className="flex gap-4">
                  <Tooltip 
                    position="bottom"
                    content={
                      isPast ? (
                        <div className="text-[10px] font-black uppercase tracking-widest">
                          Wydarzenie archiwalne (zapisy wyłączone)
                        </div>
                      ) : (missingCriticalGear && !effectiveRsvpStatus) ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-[0.2em]">
                            <AlertTriangle size={14} /> Brak Wymagań
                          </div>
                          <p className="text-[10px] text-white/50 leading-tight uppercase font-bold tracking-widest">Musisz posiadać ten sprzęt, aby się zapisać:</p>
                          <ul className="space-y-2">
                            {missingCriticalItems.map(item => (
                              <li key={item} className="text-[11px] font-black text-white flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-red-500" /> {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="text-[10px] font-black uppercase tracking-widest">
                          Zmień status udziału
                        </div>
                      )
                    }
                  >
                    <button 
                      disabled={isPast || (missingCriticalGear && !effectiveRsvpStatus)}
                      onClick={() => setShowStatusModal(true)} 
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 transition-all group/btn ring-1 ring-inset font-black uppercase tracking-[0.1em] text-[10px]",
                        (isPast || (missingCriticalGear && !effectiveRsvpStatus)) 
                          ? "opacity-20 cursor-not-allowed grayscale ring-outline-variant/30 bg-surface-container" 
                          : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                        !effectiveRsvpStatus && !missingCriticalGear && "ring-outline-variant/50 text-on-surface-variant hover:ring-primary hover:text-primary bg-surface",
                        effectiveRsvpStatus === 'GOING' && "ring-primary bg-primary/10 text-primary hover:bg-primary/20 shadow-[0_4px_12px_-4px_rgba(var(--color-primary-rgb),0.3)]",
                        effectiveRsvpStatus === 'INTERESTED' && "ring-yellow-500 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 shadow-[0_4px_12px_-4px_rgba(234,179,8,0.3)]"
                      )}
                    >
                      <div className="shrink-0">
                        {effectiveRsvpStatus === 'GOING' ? <CheckCircle2 size={16} /> : 
                         effectiveRsvpStatus === 'INTERESTED' ? <Star size={16} fill="currentColor" /> : 
                         <UserCheck size={16} />}
                      </div>
                      <span>
                        {effectiveRsvpStatus === 'GOING' ? 'Zapisany' : 
                         effectiveRsvpStatus === 'INTERESTED' ? 'Zainteresowany' : 
                         'Zapisz się'}
                      </span>
                    </button>
                  </Tooltip>

                  <button 
                    onClick={() => setShowNotifyModal(true)} 
                    disabled={isPast || !effectiveRsvpStatus}
                    title="Powiadomienia" 
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 transition-all group/btn ring-1 ring-inset font-black uppercase tracking-[0.1em] text-[10px]",
                      (effectiveRsvpStatus && !isPast) 
                        ? "ring-outline-variant/50 text-on-surface-variant hover:ring-primary hover:text-primary bg-surface hover:scale-[1.02] active:scale-[0.98]" 
                        : "opacity-10 cursor-not-allowed grayscale ring-outline-variant/20 bg-surface-container",
                      effectiveNotifyDays && "ring-primary bg-primary/10 text-primary shadow-[0_4px_12px_-4px_rgba(var(--color-primary-rgb),0.3)]"
                    )}
                  >
                    <Bell size={16} />
                    {effectiveNotifyDays && <span>{effectiveNotifyDays}d</span>}
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-10">
                {/* Date Tile */}
                <Link 
                  to={`/kalendarz?date=${event.dateStart}`}
                  className="group flex items-center gap-4 bg-surface p-4 border border-outline-variant/20 hover:border-primary transition-all shadow-sm"
                >
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="text-primary group-hover:scale-110 transition-transform" size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black uppercase text-[9px] tracking-widest text-on-surface-variant mb-0.5">Kiedy</p>
                    <p className="font-display font-black text-sm uppercase truncate">
                      {new Date(event.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </Link>

                {/* Location Tile */}
                <a 
                  href={event.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 bg-surface p-4 border border-outline-variant/20 hover:border-primary transition-all shadow-sm"
                >
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="text-primary group-hover:scale-110 transition-transform" size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black uppercase text-[9px] tracking-widest text-on-surface-variant mb-0.5">Gdzie</p>
                    <p className="font-display font-black text-sm uppercase truncate">
                      {event.location || 'Sprawdź mapę'}
                    </p>
                  </div>
                </a>

                {/* Difficulty Tile */}
                {event.type === 'GÓRY' && event.difficulty && (
                  <div className="group flex items-center gap-4 bg-surface p-4 border border-outline-variant/20 shadow-sm transition-all hover:border-primary">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0">
                      <Skull className="text-primary group-hover:scale-110 transition-transform" size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black uppercase text-[9px] tracking-widest text-on-surface-variant mb-0.5">Trudność</p>
                      <div className="flex gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className={i < event.difficulty ? 'text-primary' : 'text-on-surface-variant/20'}
                            fill={i < event.difficulty ? 'currentColor' : 'none'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Meeting Point Tile */}
                {event.meetingPointName && (
                  <a
                    href={event.meetingPointLink || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-start gap-4 bg-surface p-4 border border-outline-variant/20 shadow-sm transition-all hover:border-primary ${!event.meetingPointLink ? 'pointer-events-none' : ''}`}
                  >
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="text-primary group-hover:scale-110 transition-transform" size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black uppercase text-[9px] tracking-widest text-on-surface-variant mb-0.5">Miejsce Zbiórki</p>
                      <p className="font-display font-black text-sm uppercase leading-tight">{event.meetingPointName}</p>
                    </div>
                  </a>
                )}

                {/* Organizer Tile */}
                {event.organizer && (
                  <div className="group flex items-center gap-4 bg-surface p-4 border border-outline-variant/20 shadow-sm">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0">
                      <UserIcon className="text-primary" size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black uppercase text-[9px] tracking-widest text-on-surface-variant mb-0.5">Organizator</p>
                      <p className="font-display font-black text-sm uppercase truncate">{event.organizer}</p>
                    </div>
                  </div>
                )}

              </div>

              {/* Wymagania Section */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant border-l-4 border-primary pl-3">WYPOSAŻENIE</h4>
                  <Tooltip 
                    position="right"
                    content={
                      <div className="space-y-3 min-w-[180px]">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2">Legenda Oznaczeń</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Check size={12} className="text-primary" />
                            <span className="text-[10px] text-white/80 font-bold uppercase tracking-tight">posiadasz ten sprzęt</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <X size={12} className="text-red-600" />
                            <span className="text-[10px] text-white/80 font-bold uppercase tracking-tight">brak tego sprzętu</span>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <HelpCircle size={14} className="text-on-surface-variant/40 hover:text-primary transition-colors cursor-help" />
                  </Tooltip>
                </div>
                
                <div className="space-y-6">
                  {/* SEKCJIA 1: WYMAGANY */}
                  {(event.gearCritical || []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1 h-1 bg-red-500 rounded-full" /> Wymagany
                      </p>
                      <div className="space-y-1">
                        {(event.gearCritical || [])
                          .sort((a: string, b: string) => (hasHardware(b) ? 1 : 0) - (hasHardware(a) ? 1 : 0))
                          .map((item: string) => {
                            const owned = hasHardware(item);
                            return (
                              <div 
                                key={`critical-${item}`} 
                                className={cn(
                                  "flex items-center justify-between text-[11px] p-2.5 border-l-2 transition-all font-sans",
                                  owned 
                                    ? "bg-primary/5 border-primary" 
                                    : "bg-red-600/5 border-red-600"
                                )}
                              >
                                <span className={cn("font-bold uppercase tracking-tight", !owned && "text-red-700")}>{item}</span>
                                {owned ? <Check size={14} className="text-primary" /> : <X size={14} className="text-red-600" />}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* SEKCJIA 2: SUGEROWANY */}
                  {(event.gearRequired || []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1 h-1 bg-orange-500 rounded-full" /> Sugerowany
                      </p>
                      <div className="space-y-1">
                        {(event.gearRequired || [])
                          .sort((a: string, b: string) => (hasHardware(b) ? 1 : 0) - (hasHardware(a) ? 1 : 0))
                          .map((item: string) => {
                            const owned = hasHardware(item);
                            return (
                              <div 
                                key={`suggested-${item}`} 
                                className={cn(
                                  "flex items-center justify-between text-[11px] p-2.5 border-l-2 transition-all font-sans",
                                  owned 
                                    ? "bg-primary/5 border-primary" 
                                    : "bg-orange-500/5 border-orange-500"
                                )}
                              >
                                <span className={cn("font-bold uppercase tracking-tight", !owned && "text-orange-700")}>{item}</span>
                                {owned ? <Check size={14} className="text-primary" /> : <X size={14} className="text-orange-500" />}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                  {!event.gearCritical?.length && !event.gearRequired?.length && (
                    <p className="text-[10px] italic text-on-surface-variant/60">Brak specjalnych wymagań sprzętowych.</p>
                  )}
                </div>
              </div>

              {/* Sekcja Tras (tylko po finalizacji) */}
              {event.isFinalized && event.gpxSubmissions && event.gpxSubmissions.length > 0 && (
                <div className="mb-10 bg-surface p-6 border border-outline-variant/20">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6 border-l-4 border-primary pl-3">PRZEBYTE TRASY</h4>
                  <div className="space-y-6">
                    {event.gpxSubmissions
                      .filter((r: any) => r.status === 'APPROVED')
                      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                      .map((route: any) => (
                      <div key={route.id} className="border-b border-outline-variant/10 pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-display font-black text-sm uppercase tracking-tight">{route.label || 'Trasa'}</p>
                          <a 
                            href={`/uploads/gpx/${route.filePath.split('/').pop()}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                          >
                            Link do trasy
                          </a>
                        </div>
                        <div className="flex gap-4 text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-widest mb-3">
                          <span>{route.distance}km</span>
                          <span>↑ {route.elevationGain || 0}m</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(route.participantIds || []).map((pid: string) => {
                            const p = participants.find((pt: any) => pt.userId === pid);
                            return p ? (
                                <Badge key={pid} variant="secondary" className="text-[8px] py-0.5 px-2 bg-surface-container border-outline-variant/10">
                                  {formatName(p.user?.name || '')}
                                </Badge>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zapisani Section */}
              <div className="mb-10">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-4 border-l-4 border-primary pl-3">ZAPISANI</h4>
                <div className="space-y-4">
                  {role === 'guest' ? (
                    <div className="bg-primary/5 border border-primary/10 p-4 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 mb-3 leading-relaxed">
                        Zaloguj się, aby zobaczyć listę uczestników
                      </p>
                      <button onClick={() => loginWithGoogle()} className="text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:underline">
                        Logowanie przez Google
                      </button>
                    </div>
                  ) : participants.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {participants.map((p: any) => (
                        <div key={p.userId} className="group relative" title={`${formatName(p.user?.name || '')} (${p.status})`}>
                          <div className={cn(
                            "aspect-square bg-surface-container-highest overflow-hidden border-2 transition-all shadow-sm",
                            p.status === 'GOING' ? "border-primary" : "border-yellow-500/50"
                          )}>
                            {p.user?.avatarUrl ? <img src={p.user.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={20} className="text-on-surface-variant/20 m-auto mt-2" />}
                          </div>
                          {/* Status Indicator Icon */}
                          <div className={cn(
                            "absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center border border-surface shadow-sm",
                            p.status === 'GOING' ? "bg-primary text-surface" : "bg-yellow-500 text-surface"
                          )}>
                            {p.status === 'GOING' ? <Check size={10} strokeWidth={4} /> : <HelpCircle size={10} strokeWidth={4} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] italic text-on-surface-variant/60">Brak zadeklarowanych uczestników.</p>
                  )}
                </div>
              </div>

              {!isPast && role === 'guest' && (
                <button onClick={() => loginWithGoogle()} className="btn btn-primary w-full py-5">ZALOGUJ SIĘ, BY DOŁĄCZYĆ</button>
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
