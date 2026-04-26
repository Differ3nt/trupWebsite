import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, Award, MapPin, UploadCloud, AlertCircle, CheckCircle2, TrendingUp, Bell, Calendar, ChevronRight } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import ImageCropper from '../components/ImageCropper';

export default function Profile() {
  const { role, user, loginWithGoogle, refreshUser } = useAppContext();
  const [showOnboarding, setShowOnboarding] = useState(user && (!user.hardware || user.hardware.length === 0));
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

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
        refreshUser();
      }
    } catch (err) {
      console.error('Błąd uploadu:', err);
    } finally {
      setUploading(false);
    }
  };

  const ALL_HARDWARE = [
    'Kask', 'Czekan', 'Raki koszykowe', 'Raki półautomatyczne', 'Raki automatyczne', 'Raczki',
    'Uprząż', 'Lonża', 'Detektor Lawinowy', 'Sonda', 'Łopata', 'Lina', 'Karabinki', 
    'Buty zimowe', 'Kurtka puchowa', 'Śpiwór letni', 'Śpiwór zimowy', 'Namiot', 'Hamak', 
    'Karimata/Materac', 'Poddupnik'
  ];

  if (role === 'guest') {
    return (
      <div className="container mx-auto px-6 md:px-8 py-48 min-h-[70vh] flex flex-col items-center justify-center text-center">
        <h1 className="font-display font-black text-4xl uppercase mb-4 text-on-surface">Panel Użytkownika</h1>
        <p className="text-on-surface-variant font-bold tracking-widest uppercase text-xs mb-8">Musisz się zalogować, aby zobaczyć swój profil.</p>
        <button onClick={() => loginWithGoogle()} className="bg-primary text-surface px-8 py-4 font-bold uppercase tracking-widest text-sm transition-colors hover:bg-primary/90">
          ZALOGUJ SIĘ PRZEZ GOOGLE
        </button>
      </div>
    );
  }

  const userHardware = Array.isArray(user?.hardware) ? user.hardware : [];
  const participations = Array.isArray(user?.participations) ? user.participations : [];

  const handleGpxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('gpx', file);

    try {
      const res = await fetch('/api/gpx/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        alert('Plik GPX przesłany do moderacji!');
      }
    } catch (error) {
      console.error('Błąd uploadu GPX:', error);
    } finally {
      setUploading(false);
    }
  };

  const toggleHardware = async (item: string) => {
    let newHardware;
    if (userHardware.includes(item)) {
      newHardware = userHardware.filter((h: string) => h !== item);
    } else {
      newHardware = [...userHardware, item];
    }

    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hardware: newHardware })
      });
      await refreshUser();
    } catch (error) {
      console.error('Błąd aktualizacji sprzętu:', error);
    }
  };

  const setDefaults = async () => {
    const defaults = ['Kask', 'Czekan', 'Raki', 'Uprząż'];
    try {
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hardware: defaults })
      });
      await refreshUser();
      setShowOnboarding(false);
    } catch (error) {
      console.error('Błąd ustawiania domyślnych:', error);
    }
  };

  return (
    <div className="container mx-auto px-6 md:px-8 py-32">
      <div className="max-w-5xl mx-auto">
        {showOnboarding && (
           <div className="bg-primary/10 border border-primary/30 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                 <AlertCircle size={32} className="text-primary shrink-0" />
                 <div>
                    <h3 className="font-display font-black text-2xl uppercase tracking-tighter text-on-surface mb-2">UZUPEŁNIJ SWÓJ PROFIL</h3>
                    <p className="text-sm text-on-surface-variant">Szybki start: ustaw podstawowy sprzęt zimowy, aby widzieć wymagania wypraw.</p>
                 </div>
              </div>
              <button 
                 onClick={setDefaults}
                 className="shrink-0 bg-primary text-surface px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-primary/90 transition-colors"
              >
                 USTAW DOMYŚLNY SPRZĘT
              </button>
           </div>
        )}

        <div className="bg-surface-container-low border border-outline-variant/30 p-8 md:p-12 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="relative group">
              <div className="w-32 h-32 bg-surface-container-highest border-4 border-surface overflow-hidden flex items-center justify-center shrink-0">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-on-surface-variant" />
                )}
              </div>
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all border-4 border-primary/40">
                <UploadCloud size={24} className="text-white mb-1" />
                <span className="text-[8px] font-black uppercase text-white tracking-widest">ZMIEŃ FOTO</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // Walidacja rozmiaru (5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      alert('To zdjęcie jest zbyt duże! Maksymalny rozmiar to 5MB.');
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setCropSrc(event.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }} 
                />
              </label>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="font-display font-black text-4xl uppercase tracking-tighter mb-2">{user?.name || 'Użytkownik'}</h1>
              <p className="text-on-surface-variant font-medium mb-6 flex items-center justify-center md:justify-start gap-2">
                <MapPin size={16} /> {user?.email}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="bg-surface px-4 py-2 border border-outline-variant/30 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Ranga</p>
                  <p className="font-display font-black text-2xl text-primary">{user?.role || 'USER'}</p>
                </div>
                <div className="bg-surface px-4 py-2 border border-outline-variant/30 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Wyprawy</p>
                  <p className="font-display font-black text-lg">{participations.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 flex flex-col gap-8">
            {/* Zaplanowane Wyprawy */}
            <div className="bg-surface-container-low border border-outline-variant/30 p-8">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6 flex items-center justify-between">
                <span>Moje Wyprawy</span>
                <TrendingUp size={24} className="text-primary" />
              </h2>
              
              {participations.length > 0 ? (
                <div className="space-y-6">
                  {/* Nadchodzące */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div> Nadchodzące
                    </h3>
                    <div className="space-y-3">
                      {participations.filter((p: any) => new Date(p.event?.dateStart) >= new Date()).map((p: any) => (
                        <Link key={p.id} to={`/wydarzenia/${p.event?.id}`} className="flex items-center justify-between p-4 border border-outline-variant/20 bg-surface/50 hover:border-primary transition-colors group">
                           <div>
                              <p className="font-bold uppercase text-sm tracking-tight group-hover:text-primary transition-colors">{p.event?.title}</p>
                              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">
                                {new Date(p.event?.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                                {p.event?.location ? ` · ${p.event.location}` : ''}
                              </p>
                           </div>
                           <div className="text-right">
                              <span className={`text-[9px] font-bold uppercase px-2 py-1 border ${p.status === 'GOING' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface text-on-surface-variant border-outline-variant/30'}`}>
                                {p.status === 'GOING' ? 'IDĘ' : 'ZAINTERESOWANY'}
                              </span>
                           </div>
                        </Link>
                      ))}
                      {participations.filter((p: any) => new Date(p.event?.dateStart) >= new Date()).length === 0 && (
                        <p className="text-xs text-on-surface-variant italic py-2">Brak nadchodzących planów.</p>
                      )}
                    </div>
                  </div>

                  {/* Archiwum */}
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-outline-variant"></div> Historia
                    </h3>
                    <div className="space-y-2">
                      {participations.filter((p: any) => new Date(p.event?.dateStart) < new Date()).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-3 border border-outline-variant/10 bg-surface/30 opacity-70">
                           <div>
                              <p className="font-bold uppercase text-xs tracking-tight text-on-surface-variant">{p.event?.title}</p>
                              <p className="text-[9px] text-on-surface-variant/60 uppercase font-bold tracking-widest">{new Date(p.event?.dateStart).toLocaleDateString()}</p>
                           </div>
                           <span className="text-[8px] font-bold uppercase text-on-surface-variant/60">
                             {p.status}
                           </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant italic">Brak historii wypraw. Czas wyruszyć w góry!</p>
              )}
            </div>

            {/* GPX Upload */}
            <div className="bg-surface-container-highest border border-primary/30 p-8 text-center flex flex-col items-center relative">
              <input 
                type="file" 
                accept=".gpx" 
                onChange={handleGpxUpload} 
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                disabled={uploading}
              />
              <UploadCloud size={48} className={`text-primary mb-4 ${uploading ? 'animate-bounce' : ''}`} strokeWidth={1} />
              <h3 className="font-display font-black text-xl uppercase mb-2">
                {uploading ? 'WGRYWANIE...' : 'WGRANIE DANYCH (GPX)'}
              </h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">Prześlij swój plik z zegarka, aby zaktualizować statystyki.</p>
              <button className="border-2 border-primary text-primary px-6 py-3 font-bold uppercase tracking-widest text-xs pointer-events-none">
                WYBIERZ PLIK .GPX
              </button>
            </div>

            {/* Notification Settings */}
            <div className="bg-surface border border-outline-variant/30 p-8">
               <div className="flex items-center gap-3 mb-6">
                 <Bell className="text-primary" />
                 <h2 className="font-display font-black text-2xl uppercase tracking-tight">Powiadomienia Push</h2>
               </div>
               <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">Bądź na bieżąco z nowymi wyprawami i komunikatami grupy bezpośrednio na swoim telefonie.</p>
               <button 
                onClick={async () => {
                  try {
                    const registration = await navigator.serviceWorker.ready;
                    const subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: 'BGpW-6WqP_uE8-9M8e8n8...' // To powinno być z env, ale dla testu zostawiam placeholder lub pobieram z API
                    });
                    
                    await fetch('/api/push/subscribe', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(subscription)
                    });
                    alert('Subskrypcja aktywna!');
                  } catch (err) {
                    console.error('Push error:', err);
                    alert('Nie udało się włączyć powiadomień. Upewnij się, że Twoja przeglądarka je wspiera.');
                  }
                }}
                className="w-full py-4 border border-primary text-primary font-bold uppercase tracking-widest text-xs hover:bg-primary hover:text-surface transition-all active:scale-[0.98]"
               >
                 Włącz powiadomienia natywne
               </button>
            </div>
          </div>
          
          <div className="flex flex-col gap-8">
            {/* Kalendarz Link */}
            <div className="bg-primary text-surface p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] relative overflow-hidden group">
               <Calendar className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12 group-hover:scale-110 transition-transform duration-700" />
               <div className="relative z-10">
                 <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-2">Kalendarz TRUP</h2>
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-6">Planuj kolejne szczyty</p>
                 <Link 
                   to="/kalendarz" 
                   className="inline-flex items-center gap-3 bg-surface text-on-surface px-6 py-3 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl"
                 >
                   Otwórz Kalendarz <ChevronRight size={14} />
                 </Link>
               </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/30 p-8">
              <h2 className="font-display font-black text-2xl uppercase tracking-tight mb-6 flex items-center gap-3">
                <Award className="text-primary" /> Mój Sprzęt
              </h2>
              <div className="space-y-3">
                {ALL_HARDWARE.map((item) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group">
                    <div 
                      onClick={() => toggleHardware(item)}
                      className={`w-5 h-5 border-2 flex items-center justify-center transition-colors ${userHardware.includes(item) ? 'bg-primary border-primary' : 'border-outline-variant group-hover:border-primary'}`}
                    >
                      {userHardware.includes(item) && <CheckCircle2 size={14} className="text-surface" />}
                    </div>
                    <span className={`text-xs font-bold uppercase tracking-widest ${userHardware.includes(item) ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {cropSrc && (
        <ImageCropper 
          image={cropSrc} 
          aspect={1} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setCropSrc(null)} 
        />
      )}
    </div>
  );
}
