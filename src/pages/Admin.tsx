import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Send, Star, Plus, Trash2, StarOff, CheckCircle, XCircle, Loader2, Edit3, AlertTriangle, LogOut, Trophy, Image as ImageIcon } from 'lucide-react';
import ImagePicker from '../components/ImagePicker';
import { useAppContext } from '../contexts/AppContext';

const ALL_HARDWARE = [
  'Kask', 'Czekan', 'Raki koszykowe', 'Raki półautomatyczne', 'Raki automatyczne', 'Raczki',
  'Uprząż', 'Lonża', 'Detektor Lawinowy', 'Sonda', 'Łopata', 'Lina', 'Karabinki', 
  'Buty zimowe', 'Kurtka puchowa', 'Śpiwór letni', 'Śpiwór zimowy', 'Namiot', 'Hamak', 
  'Karimata/Materac', 'Poddupnik'
];

const EMPTY_EVENT = {
  title: '', description: '', dateStart: '', dateEnd: '',
  location: '', mapLink: '', mapEmbed: '', difficulty: 3 as number,
  spots: 12 as number, type: 'GÓRY', gearRequired: [] as string[], gearCritical: [] as string[], image: '',
  isExpedition: false, highlighted: false, featured: true
};

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 font-bold text-xs uppercase tracking-widest shadow-2xl ${type === 'success' ? 'bg-primary text-surface' : 'bg-red-900 text-red-100'}`}>
      {type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {message}
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onClose }: { title: string; message: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 p-8">
      <div className="bg-surface border border-outline-variant/30 p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-on-surface">{title}</h3>
          </div>
        </div>
        <p className="text-sm text-on-surface-variant mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-[10px] uppercase tracking-widest border border-outline-variant/50 text-on-surface-variant hover:text-on-surface transition-colors">Anuluj</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 py-3 font-display font-black text-xs uppercase tracking-widest bg-primary text-surface hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">Potwierdź</button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}{required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function Admin() {
  const { role, logout } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  const [gpxQueue, setGpxQueue] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [pushMessage, setPushMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [newEvent, setNewEvent] = useState(EMPTY_EVENT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const executeCreateOrUpdate = async () => {
    setLoading(true);
    try {
      const url = editingId ? `/api/events/${editingId}` : '/api/events';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newEvent,
          difficulty: Number(newEvent.difficulty || 3),
          spots: Number(newEvent.spots || 0),
          gearRequired: newEvent.gearRequired
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(editingId ? 'Wydarzenie zaktualizowane!' : 'Wydarzenie stworzone pomyślnie!', 'success');
        setNewEvent(EMPTY_EVENT);
        setEditingId(null);
        loadEvents();
        setActiveTab('list');
      } else {
        showToast(data.details || data.error || 'Błąd podczas operacji', 'error');
      }
    } catch {
      showToast('Błąd połączenia z serwerem', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setConfirmAction({
      title: editingId ? 'Potwierdź Edycję' : 'Potwierdź Utworzenie',
      message: `Czy na pewno chcesz ${editingId ? 'zapisać zmiany w wydarzeniu' : 'stworzyć nowe wydarzenie'} "${newEvent.title || 'bez tytułu'}"?`,
      onConfirm: executeCreateOrUpdate
    });
  };

  const toggleGear = (gear: string) => {
    setNewEvent(prev => {
      const isRequired = prev.gearRequired.includes(gear);
      const isCritical = prev.gearCritical.includes(gear);

      if (!isRequired && !isCritical) {
        // First click: Required (Warto mieć)
        return { ...prev, gearRequired: [...prev.gearRequired, gear] };
      } else if (isRequired) {
        // Second click: Critical (Trzeba mieć)
        return { 
          ...prev, 
          gearRequired: prev.gearRequired.filter(g => g !== gear),
          gearCritical: [...prev.gearCritical, gear]
        };
      } else {
        // Third click: None
        return { 
          ...prev, 
          gearCritical: prev.gearCritical.filter(g => g !== gear)
        };
      }
    });
  };

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await fetch('/api/events', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch { /* ignore */ }
    finally { setEventsLoading(false); }
  };

  const toggleFeatured = async (eventId: string, current: boolean) => {
    try {
      await fetch(`/api/events/${eventId}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ featured: !current })
      });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, featured: !current } : e));
      showToast(!current ? 'Dodano do Aktualności' : 'Usunięto z Aktualności', 'success');
    } catch {
      showToast('Błąd aktualizacji', 'error');
    }
  };

  const toggleHighlighted = async (eventId: string, current: boolean) => {
    try {
      await fetch(`/api/events/${eventId}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ highlighted: !current })
      });
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, highlighted: !current } : e));
      showToast(!current ? 'Dodano do Osiągnięć' : 'Usunięto z Osiągnięć', 'success');
    } catch {
      showToast('Błąd aktualizacji', 'error');
    }
  };

  const deleteEvent = (eventId: string, title: string) => {
    setConfirmAction({
      title: 'Potwierdź Usuwanie',
      message: `Czy na pewno chcesz bezpowrotnie usunąć wyprawę "${title}"? Wszystkie zgłoszenia do tej wyprawy również zostaną usunięte.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/events/${eventId}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          if (res.ok) {
            setEvents(prev => prev.filter(e => e.id !== eventId));
            showToast('Wyprawa usunięta', 'success');
          } else {
            const errData = await res.json().catch(() => ({}));
            showToast(errData.error || 'Błąd usuwania', 'error');
          }
        } catch (err: any) {
          showToast('Błąd połączenia', 'error');
        }
      }
    });
  };

  const startEditing = (event: any) => {
    setNewEvent({
      ...event,
      title: event.title || '',
      description: event.description || '',
      location: event.location || '',
      mapLink: event.mapLink || '',
      image: event.image || '',
      dateStart: event.dateStart ? new Date(event.dateStart).toISOString().split('T')[0] : '',
      dateEnd: event.dateEnd ? new Date(event.dateEnd).toISOString().split('T')[0] : '',
      gearRequired: event.gearRequired || []
    });
    setEditingId(event.id);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'gpx') {
      fetch('/api/gpx/queue', { credentials: 'include' })
        .then(r => r.json())
        .then(d => setGpxQueue(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
    if (activeTab === 'list') {
      loadEvents();
    }
  }, [activeTab]);

  const handleGpxAction = async (id: string, status: string) => {
    try {
      await fetch(`/api/gpx/queue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      setGpxQueue(prev => prev.filter(q => q.id !== id));
    } catch { /* ignore */ }
  };

  const handleSendPush = async () => {
    if (!pushMessage.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: pushMessage })
      });
      if (res.ok) {
        showToast('Powiadomienie wysłane!', 'success');
        setPushMessage('');
      } else {
        showToast('Błąd wysyłania powiadomienia', 'error');
      }
    } catch {
      showToast('Błąd połączenia', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'create', label: 'Nowe Wydarzenie', icon: <Plus size={14} /> },
    { id: 'list', label: 'Lista Wydarzeń', icon: <Star size={14} /> },
    { id: 'gpx', label: `Kolejka GPX${gpxQueue.length > 0 ? ` (${gpxQueue.length})` : ''}`, icon: null },
    { id: 'push', label: 'Powiadomienia', icon: <Send size={14} /> },
  ];

  return (
    <div className="pb-24 bg-surface min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <h1 className="font-display font-black text-4xl sm:text-5xl uppercase tracking-tighter mb-10 flex items-center gap-4 text-on-surface">
          <Shield className="text-primary" size={36} /> Panel Administratora
        </h1>

        {/* Bootstrap banner — widoczny gdy rola to 'user' */}
        {role === 'user' && (
          <div className="mb-8 border border-yellow-400/40 bg-yellow-400/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-bold text-xs uppercase tracking-widest text-yellow-700 mb-1">Twoja rola: Użytkownik</p>
              <p className="text-sm text-on-surface-variant">Kliknij przycisk aby nadać sobie uprawnienia Administratora (jednorazowe, możliwe tylko jeśli brak innych adminów).</p>
            </div>
            <button
              onClick={async () => {
                const res = await fetch('/api/auth/make-admin', { method: 'POST', credentials: 'include' });
                const data = await res.json();
                if (data.success) { showToast(data.message, 'success'); window.location.reload(); }
                else showToast(data.error, 'error');
              }}
              className="shrink-0 bg-yellow-600 text-white px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-yellow-700 transition-colors"
            >
              Zostań Administratorem
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-56 flex flex-col gap-1 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left px-5 py-3 font-bold tracking-widest text-[10px] uppercase flex items-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-primary text-surface' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            
            <div className="mt-4 pt-4 border-t border-outline-variant/30">
              <button
                onClick={() => {
                  setConfirmAction({
                    title: 'Wyloguj Się',
                    message: 'Czy na pewno chcesz zakończyć obecną sesję?',
                    onConfirm: logout
                  });
                }}
                className="w-full text-left px-5 py-3 font-bold tracking-widest text-[10px] uppercase flex items-center gap-2 text-red-500 hover:bg-red-500/5 transition-colors"
              >
                <LogOut size={14} /> Wyloguj
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* === NOWA WYPRAWA === */}
            {activeTab === 'create' && (
              <form onSubmit={handleCreateEvent} className="bg-surface-container-low border border-outline-variant/30 p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 mb-6">
                  <h2 className="font-display font-black text-2xl uppercase text-on-surface">
                    {editingId ? 'Edycja Wydarzenia' : 'Kreator Wydarzenia'}
                  </h2>
                  {editingId && (
                    <button 
                      type="button"
                      onClick={() => { setEditingId(null); setNewEvent(EMPTY_EVENT); }}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline"
                    >
                      Anuluj edycję
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Tytuł Wydarzenia" required>
                    <input required type="text" className="w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm focus:outline-none focus:border-primary" value={newEvent.title || ''} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                  </InputField>
                  <InputField label="Kategoria Wydarzenia">
                    <select 
                      className="w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm focus:outline-none focus:border-primary" 
                      value={newEvent.type} 
                      onChange={e => {
                        const newType = e.target.value;
                        const isMountain = ['GÓRY', 'EKSPEDYCJA'].includes(newType);
                        setNewEvent({ 
                          ...newEvent, 
                          type: newType,
                          isExpedition: isMountain ? newEvent.isExpedition : false 
                        });
                      }}
                    >
                      <option>GÓRY</option>
                      <option>EKSPEDYCJA</option>
                      <option>INTEGRACJA</option>
                      <option>KULTURA</option>
                      <option>PIWO</option>
                    </select>
                  </InputField>
                </div>

                {['GÓRY', 'EKSPEDYCJA'].includes(newEvent.type) && (
                  <div 
                    onClick={() => setNewEvent({ ...newEvent, isExpedition: !newEvent.isExpedition })}
                    className={`flex items-center justify-between p-4 border transition-all cursor-pointer group ${
                      newEvent.isExpedition 
                        ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' 
                        : 'bg-surface border-outline-variant/20 hover:border-outline-variant/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 flex items-center justify-center transition-colors ${newEvent.isExpedition ? 'bg-primary text-surface' : 'bg-surface-container text-on-surface-variant'}`}>
                        <Trophy size={20} />
                      </div>
                      <div>
                        <p className={`font-display font-black uppercase tracking-tight text-sm ${newEvent.isExpedition ? 'text-primary' : 'text-on-surface'}`}>Oficjalna Wyprawa Grupy</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70">Wymaga określenia trudności i sprzętu</p>
                      </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${newEvent.isExpedition ? 'bg-primary' : 'bg-outline-variant/30'}`}>
                      <div className={`w-4 h-4 bg-surface shadow-sm transition-transform duration-300 ${newEvent.isExpedition ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Data Rozpoczęcia" required>
                    <input required type="date" className="w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm focus:outline-none focus:border-primary" value={newEvent.dateStart || ''} onChange={e => setNewEvent({ ...newEvent, dateStart: e.target.value })} />
                  </InputField>
                  <InputField label="Data Zakończenia (opcjonalnie)">
                    <input type="date" className="w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm focus:outline-none focus:border-primary" value={newEvent.dateEnd || ''} onChange={e => setNewEvent({ ...newEvent, dateEnd: e.target.value })} />
                  </InputField>
                </div>

                <div className={`grid grid-cols-1 ${newEvent.isExpedition ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>
                  <InputField label="Lokalizacja" required>
                    <input required type="text" className="w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm focus:outline-none focus:border-primary" value={newEvent.location || ''} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                  </InputField>
                  {newEvent.isExpedition && (
                    <InputField label="Poziom Trudności (1-5 gwiazdek)">
                      <div className="flex gap-2 items-center bg-surface border border-outline-variant/50 p-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewEvent({ ...newEvent, difficulty: star })}
                            className={`text-2xl transition-all ${
                              (newEvent.difficulty as number) >= star ? 'text-primary scale-110' : 'text-on-surface-variant/30 hover:text-primary/50'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                        <span className="ml-4 font-display font-black text-primary">{newEvent.difficulty}/5</span>
                      </div>
                    </InputField>
                  )}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={newEvent.spots !== null} 
                        onChange={e => setNewEvent({ ...newEvent, spots: e.target.checked ? 12 : null })}
                        className="w-3 h-3 accent-primary"
                      />
                      Ograniczona liczba miejsc
                    </label>
                    {newEvent.spots !== null && (
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className="w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm focus:outline-none focus:border-primary"
                        value={newEvent.spots || 0}
                        onChange={e => setNewEvent({ ...newEvent, spots: parseInt(e.target.value) || 0 })}
                      />
                    )}
                    {newEvent.spots === null && (
                      <div className="p-3 bg-surface border border-outline-variant/20 text-[10px] uppercase font-bold text-on-surface-variant/50">
                        Brak limitu miejsc
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Link do Mapy (Przycisk)">
                    <input type="url" className="w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm focus:outline-none focus:border-primary" placeholder="https://mapy.cz/..." value={newEvent.mapLink || ''} onChange={e => setNewEvent({ ...newEvent, mapLink: e.target.value })} />
                  </InputField>
                  <InputField label="Kod Embed Mapy (Iframe)">
                    <input type="text" className="w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm focus:outline-none focus:border-primary" placeholder='<iframe src="..." ...></iframe>' value={newEvent.mapEmbed || ''} onChange={e => setNewEvent({ ...newEvent, mapEmbed: e.target.value })} />
                  </InputField>
                </div>

                <InputField label="Zdjęcie Tła">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowImagePicker(true)}
                      className="flex items-center gap-3 bg-surface border border-outline-variant/50 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface hover:border-primary transition-all group"
                    >
                      <ImageIcon size={16} className="text-primary group-hover:scale-110 transition-transform" />
                      Wybierz Zdjęcie
                    </button>
                    <div className="flex-1">
                      <input 
                        type="url" 
                        className="w-full bg-surface/50 border border-outline-variant/30 p-3 text-on-surface text-sm focus:outline-none opacity-60 cursor-not-allowed" 
                        placeholder="lub wklej URL..." 
                        value={newEvent.image || ''} 
                        readOnly
                      />
                    </div>
                  </div>
                  {newEvent.image && (
                    <div className="mt-4 relative group h-48 overflow-hidden border border-outline-variant/30">
                      <img src={newEvent.image} alt="preview" className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-700" onError={e => (e.currentTarget.style.display = 'none')} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => setNewEvent({...newEvent, image: ''})} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </InputField>

                {showImagePicker && (
                  <ImagePicker 
                    onSelect={(url) => setNewEvent({ ...newEvent, image: url })} 
                    onClose={() => setShowImagePicker(false)} 
                  />
                )}

                <InputField label="Opis Wydarzenia">
                  <textarea className="w-full bg-surface border border-outline-variant/50 p-3 text-on-surface text-sm min-h-[120px] focus:outline-none focus:border-primary resize-vertical" placeholder="Opisz wydarzenie — plan, logistyka, cele..." value={newEvent.description || ''} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                </InputField>

                {newEvent.isExpedition && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">Wymagany Sprzęt</label>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-primary"><div className="w-2 h-2 bg-primary"></div> Warto mieć</div>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-red-500"><div className="w-2 h-2 bg-red-500"></div> Trzeba mieć</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {ALL_HARDWARE.map(gear => {
                        const isReq = newEvent.gearRequired.includes(gear);
                        const isCrit = newEvent.gearCritical.includes(gear);
                        return (
                          <button
                            key={gear}
                            type="button"
                            onClick={() => toggleGear(gear)}
                            className={`px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest border transition-all text-left flex items-center justify-between ${
                              isCrit ? 'bg-red-500 border-red-500 text-white' : 
                              isReq ? 'bg-primary border-primary text-surface' : 
                              'border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-on-surface'
                            }`}
                          >
                            {gear}
                            {isCrit && <AlertTriangle size={12} />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[9px] text-on-surface-variant italic uppercase tracking-widest">Kliknij wielokrotnie, aby zmienić priorytet sprzętu.</p>
                  </div>
                )}

                <div className="flex items-center gap-4 p-4 border border-outline-variant/20 bg-surface">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!(newEvent as any).highlighted}
                      onChange={e => setNewEvent({ ...newEvent, highlighted: e.target.checked } as any)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      <Trophy size={14} className="text-primary" /> Oznacz jako osiągnięcie grupy
                    </span>
                  </label>
                </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-surface py-4 font-display font-black text-lg uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : (editingId ? <Edit3 size={20} /> : <Plus size={20} />)}
                    {loading ? (editingId ? 'Zapisywanie...' : 'Tworzenie...') : (editingId ? 'Zapisz Zmiany' : 'Stwórz Wydarzenie')}
                  </button>
              </form>
            )}

            {/* === LISTA WYPRAW === */}
            {activeTab === 'list' && (
              <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface">Zarządzanie Wydarzeniami</h2>
                {eventsLoading ? (
                  <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
                ) : events.length === 0 ? (
                  <p className="text-center py-16 text-on-surface-variant italic text-sm">Brak wydarzeń w bazie. Stwórz pierwsze!</p>
                ) : (
                  <div className="space-y-3">
                    {events.map(event => (
                      <div 
                        key={event.id} 
                        onClick={() => navigate(`/wydarzenia/${event.id}`)}
                        className="bg-surface border border-outline-variant/30 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer hover:bg-surface-container-lowest transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap text-[9px] font-bold uppercase tracking-widest">
                            <span className="text-primary bg-primary/10 px-2 py-0.5">{event.type}</span>
                            {event.featured && <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5">⭐ Aktualności</span>}
                            {event.highlighted && <span className="text-amber-700 bg-amber-100 px-2 py-0.5">🏆 Osiągnięcie</span>}
                          </div>
                          <p className="font-display font-black text-lg uppercase tracking-tight text-on-surface mt-1 group-hover:text-primary transition-colors">{event.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 opacity-70">
                            {new Date(event.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {event.location ? ` · ${event.location}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleFeatured(event.id, event.featured); }}
                            title={event.featured ? 'Usuń z wyróżnionych' : 'Dodaj do wyróżnionych'}
                            className={`p-2 border transition-colors ${event.featured ? 'border-yellow-400 text-yellow-600 bg-yellow-50/50' : 'border-outline-variant/30 text-on-surface-variant hover:border-yellow-400 hover:text-yellow-600'}`}
                          >
                            {event.featured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleHighlighted(event.id, event.highlighted); }}
                            title={event.highlighted ? 'Usuń z Osiągnięć' : 'Oznacz jako Osiągnięcie'}
                            className={`p-2 border transition-colors ${event.highlighted ? 'border-amber-400 text-amber-600 bg-amber-50/50' : 'border-outline-variant/30 text-on-surface-variant hover:border-amber-400 hover:text-amber-600'}`}
                          >
                            <Trophy size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditing(event); }}
                            title="Edytuj wydarzenie"
                            className="p-2 border border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
                          >
                             <Edit3 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteEvent(event.id, event.title); }}
                            title="Usuń wydarzenie"
                            className="p-2 border border-outline-variant/30 text-on-surface-variant hover:border-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* === KOLEJKA GPX === */}
            {activeTab === 'gpx' && (
              <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface">Oczekujące Trasy GPX</h2>
                <div className="space-y-4">
                  {gpxQueue.map(item => (
                    <div key={item.id} className="bg-surface p-4 border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="font-bold uppercase text-sm mb-1 text-on-surface">{item.user?.name || 'Anonim'}</p>
                        <p className="text-xs text-on-surface-variant">Plik: {item.fileName} · {new Date(item.createdAt).toLocaleString('pl-PL')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleGpxAction(item.id, 'REJECTED')} className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest border border-outline-variant/50 text-on-surface-variant hover:border-red-400 hover:text-red-600 transition-colors">Odrzuć</button>
                        <button onClick={() => handleGpxAction(item.id, 'APPROVED')} className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest bg-primary text-surface hover:bg-primary/90 transition-colors">Zatwierdź</button>
                      </div>
                    </div>
                  ))}
                  {gpxQueue.length === 0 && <p className="text-center py-12 text-on-surface-variant italic text-sm">Brak oczekujących zgłoszeń.</p>}
                </div>
              </div>
            )}

            {/* === POWIADOMIENIA === */}
            {activeTab === 'push' && (
              <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface flex items-center gap-3">
                  Nadawanie Powiadomień <Send className="text-primary" size={20} />
                </h2>
                <textarea
                  className="w-full bg-surface border border-outline-variant/50 p-4 text-on-surface mb-4 min-h-[150px] focus:outline-none focus:border-primary text-sm resize-none"
                  placeholder="Treść powiadomienia (max 150 znaków)..."
                  maxLength={150}
                  value={pushMessage}
                  onChange={e => setPushMessage(e.target.value)}
                />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{pushMessage.length}/150 znaków</span>
                </div>
                <button
                  onClick={handleSendPush}
                  disabled={loading || !pushMessage.trim()}
                  className="bg-primary text-surface px-8 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Wysyłanie...</> : 'Wyślij Push'}
                </button>
                <p className="text-on-surface-variant text-xs mt-4 uppercase tracking-widest font-bold">
                  Uwaga: Zostanie natychmiast wysłane do wszystkich zapisanych na powiadomienia.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.title}
          message={confirmAction.message}
          onConfirm={confirmAction.onConfirm}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
