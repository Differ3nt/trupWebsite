import React, { useState, useEffect } from 'react';
import { Link, useBlocker, useBeforeUnload } from 'react-router-dom';
import { User, Settings, Award, MapPin, UploadCloud, CheckCircle2, TrendingUp, Bell, Calendar, ChevronRight, Phone, Mail, Mountain, Compass, Map, LogOut, Clock, Users } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import ImageCropper from '../components/ImageCropper';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { GpxUploadModal } from '../components/GpxUploadModal';
import { Map as MapIcon, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Profile() {
  const { role, user, loginWithGoogle, refreshUser, logout, showToast } = useAppContext();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  // Form states for settings
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hardware, setHardware] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showGpxModal, setShowGpxModal] = useState<any>(null);
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<any>(null);

  const isDirty = user ? (
    name !== (user.name || '') ||
    nickname !== (user.nickname || '') ||
    phoneNumber !== (user.phoneNumber || '') ||
    JSON.stringify([...hardware].sort()) !== JSON.stringify([...(Array.isArray(user.hardware) ? user.hardware : [])].sort())
  ) : false;

  // Browser-level navigation guard (refresh, close tab)
  useBeforeUnload(
    React.useCallback(
      (event) => {
        if (isDirty) {
          event.preventDefault();
        }
      },
      [isDirty]
    )
  );

  // App-level navigation guard (React Router links)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowConfirmExit(true);
    }
  }, [blocker.state]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setNickname(user.nickname || '');
      setPhoneNumber(user.phoneNumber || '');
      setHardware(Array.isArray(user.hardware) ? user.hardware : []);
      
      // Fetch pending settlements (all past mountain events not finalized)
      fetch('/api/events', { credentials: 'include' })
        .then(r => r.json())
        .then(data => {
          const now = new Date();
          now.setHours(0,0,0,0);
          const pending = (Array.isArray(data) ? data : [])
            .filter(e => {
              const date = new Date(e.dateStart);
              return date < now && !e.isFinalized && e.type === 'GÓRY' && !e.isDraft;
            });
          setPendingEvents(pending);
        })
        .catch(() => {});
    }
  }, [user]);

  const ALL_HARDWARE = [
    'Kask', 'Czekan', 'Raki koszykowe', 'Raki półautomatyczne', 'Raki automatyczne', 'Raczki',
    'Uprząż', 'Lonża', 'Detektor Lawinowy', 'Sonda', 'Łopata', 'Lina', 'Karabinki',
    'Buty zimowe', 'Kurtka puchowa', 'Śpiwór letni', 'Śpiwór zimowy', 'Namiot', 'Hamak',
    'Karimata/Materac', 'Poddupnik'
  ];

  if (role === 'guest') {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <PageHeader
            title="Twój Profil"
            subtitle="DANE UŻYTKOWNIKA, OSIĄGNIĘCIA I EKWIPUNEK."
            category="Konto członka"
            className="mb-0"
          />
          <div className="flex items-center gap-3">
            <button onClick={() => logout()} className="btn btn-secondary px-6 py-3 text-[10px] gap-2">
              <LogOut size={14} /> Wyloguj się
            </button>
          </div>
        </div>
        <div className="container mx-auto px-6 md:px-8 py-48 min-h-[70vh] flex flex-col items-center justify-center text-center">
          <h1 className="font-display font-black text-4xl uppercase mb-4 text-on-surface">Panel Użytkownika</h1>
          <p className="text-on-surface-variant font-bold tracking-widest uppercase text-xs mb-8">Musisz się zalogować, aby zobaczyć swój profil.</p>
          <button onClick={() => loginWithGoogle()} className="btn btn-primary px-8 py-4">
            ZALOGUJ SIĘ PRZEZ GOOGLE
          </button>
        </div>
      </div>
    );
  }

  const participations = Array.isArray(user?.participations) ? user.participations : [];
  const pastParticipations = participations
    .filter((p: any) => p.attended || (new Date(p.event?.dateStart) < new Date() && p.status === 'GOING' && !p.event?.isDraft))
    .sort((a: any, b: any) => new Date(b.event?.dateStart).getTime() - new Date(a.event?.dateStart).getTime());
  const gpxSubmissions = Array.isArray(user?.gpxSubmissions) ? user.gpxSubmissions : [];

  // Stats calculation
  const attendedExpeditions = participations.filter((p: any) => p.attended).length;
  const totalKm = gpxSubmissions.filter((g: any) => g.status === 'APPROVED').reduce((sum: number, g: any) => sum + (g.distance || 0), 0);
  const totalElevation = gpxSubmissions.filter((g: any) => g.status === 'APPROVED').reduce((sum: number, g: any) => sum + (g.elevationGain || 0), 0);
  const totalDuration = gpxSubmissions.filter((g: any) => g.status === 'APPROVED').reduce((sum: number, g: any) => sum + (g.duration || 0), 0);

  const formatTotalTime = (min: number) => {
    const d = Math.floor(min / (60 * 24));
    const h = Math.floor((min % (60 * 24)) / 60);
    const m = Math.round(min % 60);
    
    if (d > 0) return `${d} dni ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nickname, phoneNumber, hardware })
      });
      if (res.ok) {
        await refreshUser();
        showToast('Profil został pomyślnie zaktualizowany!', 'success');
      } else {
        const errorData = await res.json();
        showToast(errorData.error || 'Błąd podczas zapisywania zmian.', 'error');
      }
    } catch (err) {
      console.error('Update error:', err);
      showToast('Błąd połączenia z serwerem.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGpxUpload = async (formData: FormData) => {
    try {
      const res = await fetch('/api/gpx/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        showToast('Trasa przesłana! Admin ją zweryfikuje.', 'success');
        setShowGpxModal(null);
        refreshUser();
      } else {
        showToast(data.error || 'Błąd przesyłania', 'error');
      }
    } catch { showToast('Błąd połączenia', 'error'); }
  };



  const handleCropComplete = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('image', blob, 'avatar.jpg');
    try {
      const res = await fetch('/api/images/upload-simple', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: data.url })
        });
        await refreshUser();
      }
    } catch (err) {
      console.error('Błąd uploadu:', err);
      showToast('Błąd przesyłania zdjęcia.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const toggleHardware = (item: string) => {
    setHardware(prev =>
      prev.includes(item) ? prev.filter(h => h !== item) : [...prev, item]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <PageHeader
          title="Twój Profil"
          subtitle="DANE UŻYTKOWNIKA, OSIĄGNIĘCIA I EKWIPUNEK."
          category="Konto członka"
          className="mb-0"
        />
      </div>

      <div className="relative flex flex-col md:flex-row items-center gap-8 mb-16 p-8 bg-surface-container-low border border-outline-variant/30">
        <div className="w-32 h-32 md:w-40 md:h-40 bg-surface-container-highest border-4 border-primary/20 overflow-hidden flex items-center justify-center shrink-0 shadow-2xl relative">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={64} className="text-on-surface-variant" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="font-display font-black text-3xl md:text-5xl uppercase tracking-tighter text-on-surface mb-2">
            {user?.name || 'Użytkownik TRUP'}
            {user?.nickname && <span className="text-primary ml-4">"{user.nickname}"</span>}
          </h2>
          <p className="text-primary font-bold uppercase tracking-[0.2em] text-xs mb-6">{user?.email}</p>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'settings' && isDirty) {
              setShowConfirmExit(true);
            } else {
              setActiveTab(activeTab === 'overview' ? 'settings' : 'overview');
            }
          }}
          className={cn(
            "absolute top-0 right-0 p-4 -translate-y-full transition-all z-20",
            activeTab === 'settings' ? "text-primary bg-primary/10 ring-1 ring-inset ring-primary" : "text-on-surface-variant hover:text-primary hover:bg-primary/5"
          )}
          title={activeTab === 'settings' ? "Wróć do podsumowania" : "Ustawienia profilu"}
        >
          <Settings size={24} className={cn("transition-transform duration-500", activeTab === 'settings' && "rotate-90")} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Stats Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                <h3 className="font-display font-black text-xl uppercase tracking-tight mb-8 flex items-center gap-2">
                  <TrendingUp size={20} className="text-primary" /> Twoje Statystyki
                </h3>

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Mountain size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Wyprawy</p>
                      <p className="font-display font-black text-3xl">{attendedExpeditions}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Map size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Dystans</p>
                      <p className="font-display font-black text-3xl">{totalKm.toFixed(1)} <span className="text-sm font-sans text-on-surface-variant/60 lowercase">km</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Compass size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Przewyższenie</p>
                      <p className="font-display font-black text-3xl">{totalElevation.toLocaleString()} <span className="text-sm font-sans text-on-surface-variant/60 lowercase">m</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Clock size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Czas w górach</p>
                      <p className="font-display font-black text-3xl">{formatTotalTime(totalDuration)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary text-surface p-8 group relative overflow-hidden">
                <Calendar className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
                <h3 className="font-display font-black text-xl uppercase mb-2 relative z-10">Gotowy na więcej?</h3>
                <p className="text-xs opacity-80 mb-6 relative z-10 leading-relaxed">Sprawdź kalendarz i zapisz się na kolejne wyjście w góry.</p>
                <Link to="/kalendarz" className="btn btn-secondary inline-flex items-center gap-2 px-4 py-2 text-[10px]">
                  Kalendarz <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            {/* Expeditions Main */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Nadchodzące */}
              <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-8">Nadchodzące Wyprawy</h2>
                <div className="space-y-4">
                  {participations.filter((p: any) => new Date(p.event?.dateStart) >= new Date()).length > 0 ? (
                    participations.filter((p: any) => new Date(p.event?.dateStart) >= new Date()).map((p: any) => (
                      <Link key={p.id} to={`/wydarzenia/${p.event?.id}`} className="flex flex-col md:flex-row md:items-center justify-between p-6 border border-outline-variant/20 bg-surface/50 hover:border-primary transition-all group">
                        <div>
                          <p className="font-display font-black text-xl uppercase tracking-tight group-hover:text-primary transition-colors">{p.event?.title}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest flex items-center gap-1">
                              <Calendar size={12} /> {new Date(p.event?.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                            </p>
                            {p.event?.location && (
                              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest flex items-center gap-1">
                                <MapPin size={12} /> {p.event.location}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <span className={`text-[10px] font-black uppercase px-3 py-1.5 border ${p.status === 'GOING' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-surface text-on-surface-variant border-outline-variant/30'}`}>
                            {p.status === 'GOING' ? 'ZAPISANY' : 'INTERESUJE MNIE'}
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-outline-variant/20">
                      <p className="text-sm text-on-surface-variant italic mb-4">Nie masz jeszcze planów górskich na najbliższy czas.</p>
                      <Link to="/wydarzenia" className="text-primary font-bold uppercase tracking-widest text-[10px] hover:underline">Przeglądaj wydarzenia</Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Do rozliczenia */}
              {pendingEvents.length > 0 && (
                <div className="bg-primary/5 border-2 border-dashed border-primary/20 p-8">
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-2 text-primary">Wyprawy do Rozliczenia</h2>
                  <p className="text-xs text-on-surface-variant font-medium mb-8">Te wyprawy już się odbyły, ale nie mają jeszcze wgranych tras GPX. Pomóż nam uzupełnić archiwum!</p>

                  <div className="space-y-4">
                    {pendingEvents.map((ev: any) => (
                      <div key={ev.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-surface border border-primary/20">
                        <div>
                          <h3 className="font-display font-black text-lg uppercase text-on-surface">{ev.title}</h3>
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                            {new Date(ev.dateStart).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowGpxModal(ev)}
                          variant="primary"
                          size="sm"
                          className="mt-4 md:mt-0"
                          leftIcon={<MapIcon size={14} />}
                        >
                          Wgraj GPX
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historia */}
              <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-8 flex items-center gap-3">
                  <Award className="text-primary" /> Historia Wydarzeń
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pastParticipations.length > 0 ? (
                    pastParticipations.map((p: any) => {
                      const eventStats = gpxSubmissions
                        .filter((g: any) => g.eventId === p.event.id && g.status === 'APPROVED')
                        .reduce((acc: any, g: any) => ({
                          distance: acc.distance + (g.distance || 0),
                          elevation: acc.elevation + (g.elevationGain || 0)
                        }), { distance: 0, elevation: 0 });
                      
                      const attendeesCount = p.event.participants?.length || 0;

                      return (
                        <Link 
                          key={p.id} 
                          to={`/wydarzenia/${p.event.id}`}
                          className="group relative bg-surface border border-outline-variant/10 overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-sm hover:shadow-xl"
                        >
                          {/* Image Header */}
                          <div className="relative h-40 overflow-hidden">
                            <img 
                              src={p.event.image || ''} 
                              alt="" 
                              className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            
                            <div className="absolute top-4 left-4">
                              <Badge variant="secondary" className="backdrop-blur-md bg-black/60 border-none text-[8px] px-2 py-1">
                                {new Date(p.event.dateStart).toLocaleDateString('pl-PL')}
                              </Badge>
                            </div>
                            
                            {/* Category Overlay */}
                            <div className="absolute top-4 right-4">
                              <Badge variant="outline" className="backdrop-blur-md bg-white/10 border-white/20 text-white text-[7px] px-2 py-1 uppercase tracking-tighter">
                                {p.event.type}
                              </Badge>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4">
                            <div className="flex justify-between items-start">
                              <h3 className="font-display font-black text-lg uppercase tracking-tighter text-on-surface leading-tight group-hover:text-primary transition-colors">
                                {p.event.title}
                              </h3>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-1.5 opacity-60">
                              <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                <Users size={10} /> {attendeesCount} osób
                              </span>
                              {p.event.location && (
                                <span className="text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                                  <MapPin size={10} /> {p.event.location}
                                </span>
                              )}
                            </div>

                            {p.event.type === 'GÓRY' && (eventStats.distance > 0 || eventStats.elevation > 0) && (
                              <div className="mt-4 pt-4 border-t border-outline-variant/5 grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black uppercase tracking-tighter text-on-surface-variant/50">Dystans</span>
                                  <span className="text-[11px] font-display font-black text-primary">{eventStats.distance.toFixed(1)} km</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[8px] font-black uppercase tracking-tighter text-on-surface-variant/50">Przewyższenie</span>
                                  <span className="text-[11px] font-display font-black text-primary">+{eventStats.elevation.toLocaleString()} m</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-end mt-4 pt-4 border-t border-outline-variant/5">
                              <ChevronRight size={14} className="text-primary translate-x-0 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-outline-variant/20">
                      <p className="text-sm text-on-surface-variant italic">Cierpliwości, Twój górski dziennik wkrótce się zapełni!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12"
          >
            {/* Profile Edit */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                <h3 className="font-display font-black text-xl uppercase mb-8 flex items-center gap-2">
                  <Settings size={20} className="text-primary" /> Edytuj Dane
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Imię i Nazwisko</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 p-3 text-sm font-bold focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Przydomek (Opcjonalnie)</label>
                    <input
                      type="text"
                      placeholder="Twoja ksywka..."
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-surface border border-outline-variant/30 p-3 text-sm font-bold focus:border-primary outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Adres Email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-surface-container-high border border-outline-variant/30 p-3 text-sm font-bold text-on-surface-variant/50 outline-none cursor-not-allowed opacity-70"
                    />
                    <p className="text-[8px] text-on-surface-variant/40 mt-1 uppercase font-bold tracking-tighter">* Email jest zsynchronizowany z Twoim kontem Google</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Numer Telefonu</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
                      <input
                        type="tel"
                        placeholder="np. +48 123 456 789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/30 p-3 pl-10 text-sm font-bold focus:border-primary outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn btn-primary w-full py-4 text-xs disabled:opacity-50"
                  >
                    {isSaving ? 'ZAPISYWANIE...' : 'ZAPISZ ZMIANY'}
                  </button>
                </form>
              </div>

              <button
                onClick={() => logout()}
                className="btn btn-danger flex items-center justify-center gap-2 p-4 text-[10px]"
              >
                <LogOut size={16} /> Wyloguj się z systemu
              </button>
            </div>

            {/* Hardware Management */}
            <div className="lg:col-span-7">
              <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display font-black text-xl uppercase flex items-center gap-2">
                    <Award size={24} className="text-primary" /> Twój Szpej
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Zaznacz co posiadasz
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {ALL_HARDWARE.map((item) => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer group">
                      <div
                        onClick={() => toggleHardware(item)}
                        className={`w-5 h-5 ring-2 ring-inset flex items-center justify-center transition-colors ${hardware.includes(item) ? 'bg-primary ring-primary' : 'ring-outline-variant group-hover:ring-primary'}`}
                      >
                        {hardware.includes(item) && <CheckCircle2 size={14} className="text-surface" />}
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${hardware.includes(item) ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                        {item}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="mt-12 p-6 bg-primary/5 border border-primary/10">
                  <p className="text-[10px] leading-relaxed text-on-surface-variant font-medium">
                    Informacja o Twoim sprzęcie pozwala organizatorom lepiej planować logistykę wypraw i dobierać brakujący ekwipunek dla grupy.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {cropSrc && (
        <ImageCropper
          image={cropSrc}
          aspect={1}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {showGpxModal && (
        <GpxUploadModal
          event={showGpxModal}
          onUpload={handleGpxUpload}
          onClose={() => setShowGpxModal(null)}
        />
      )}

      {showConfirmExit && (
        <ConfirmationModal 
          title="Niezapisane zmiany"
          message={blocker.state === "blocked" 
            ? "MASZ NIEZAPISANE ZMIANY. CZY CHCESZ JE ZAPISAĆ PRZED WYJŚCIEM?" 
            : "MASZ NIEZAPISANE ZMIANY W SWOIM PROFILU. CZY CHCESZ JE ZAPISAĆ PRZED POWROTEM?"}
          confirmText="ZAPISZ I WYJDŹ"
          discardText="PORZUĆ ZMIANY"
          cancelText="WRÓĆ DO EDYCJI"
          onConfirm={async () => {
            // Save changes first
            setIsSaving(true);
            try {
              const res = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, nickname, phoneNumber, hardware })
              });
              if (res.ok) {
                await refreshUser();
                showToast('Zmiany zostały zapisane. Przechodzę dalej...', 'success');
                
                // Then proceed
                if (blocker.state === "blocked") {
                  blocker.proceed();
                } else {
                  setActiveTab('overview');
                }
              } else {
                showToast('Błąd podczas zapisywania.', 'error');
              }
            } catch (err) {
              showToast('Błąd połączenia.', 'error');
            } finally {
              setIsSaving(false);
              setShowConfirmExit(false);
            }
          }}
          onDiscard={() => {
            // Reset states to original user values
            if (user) {
              setName(user.name || '');
              setNickname(user.nickname || '');
              setPhoneNumber(user.phoneNumber || '');
              setHardware(Array.isArray(user.hardware) ? user.hardware : []);
            }
            
            if (blocker.state === "blocked") {
              blocker.proceed();
            } else {
              setActiveTab('overview');
            }
            showToast('Zmiany zostały porzucone.', 'info');
            setShowConfirmExit(false);
          }}
          onClose={() => {
            if (blocker.state === "blocked") {
              blocker.reset();
            }
            setShowConfirmExit(false);
          }}
        />
      )}
    </div>
  );
}
