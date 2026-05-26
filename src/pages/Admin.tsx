import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit3, Loader2, Star, StarOff, Trophy, Trash2, 
  User, Tag as TagIcon, Zap, Book, Send, Settings, 
  PlusCircle, List, FileText, Bell, Map as MapIcon, LogOut,
  AlertTriangle, Image as ImageIcon, Calendar, CheckCircle, ArrowRight, UploadCloud,
  ChevronUp, ChevronDown, RefreshCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ImagePicker from '../components/ImagePicker';
import ImagePositionPicker from '../components/ImagePositionPicker';
import { GpxUploadModal } from '../components/GpxUploadModal';
import GpxPreview from '../components/GpxPreview';
import { useAppContext } from '../contexts/AppContext';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Checkbox } from '../components/ui/Checkbox';
import { FormField } from '../components/ui/FormField';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { cn } from '../lib/utils';

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
  isExpedition: false, highlighted: false, featured: true, isDraft: false,
  organizer: '', meetingPointName: '', meetingPointLink: '', meetingPointEmbed: '', transport: '', weatherInfo: '',
  imageFocalX: 50 as number, imageFocalY: 50 as number,
  plannedDistance: '' as any, plannedElevation: '' as any, plannedDuration: '' as any
};


// Removed local InputField

export default function Admin() {
  const { role, logout, showToast, confirmAction } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');
  const [gpxQueue, setGpxQueue] = useState<any[]>([]);
  const [completionQueue, setCompletionQueue] = useState<any[]>([]);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [finalizingEvent, setFinalizingEvent] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [pushMessage, setPushMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [newEvent, setNewEvent] = useState(EMPTY_EVENT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [wikiArticles, setWikiArticles] = useState<any[]>([]);
  const [newWikiArticle, setNewWikiArticle] = useState<{ title: string; category: string; content: string; tags: string[]; authorName: string }>({ 
    title: '', category: 'Poradnik', content: '', tags: [], authorName: '' 
  });
  const [wikiLoading, setWikiLoading] = useState(false);
  const [editingWikiId, setEditingWikiId] = useState<string | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newNewsItem, setNewNewsItem] = useState({ title: '', content: '', type: 'GENERAL', link: '', imageUrl: '' });
  const [hoveredDifficulty, setHoveredDifficulty] = useState<number>(0);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showGpxModal, setShowGpxModal] = useState<any | null>(null);

  const isFormDirty = () => {
    // Check if newEvent is different from EMPTY_EVENT
    const isModified = JSON.stringify(newEvent) !== JSON.stringify(EMPTY_EVENT);
    return isModified && activeTab === 'create';
  };

  const handleTabChange = (tab: string) => {
    if (activeTab === 'create' && isFormDirty()) {
      confirmAction({
        title: 'Niezapisane zmiany',
        message: 'Masz niezapisane zmiany w kreatorze. Czy chcesz zapisać je jako szkic przed przejściem dalej?',
        variant: 'primary',
        confirmText: 'ZAPISZ SZKIC',
        discardText: 'NIE ZAPISUJ',
        cancelText: 'ANULUJ',
        onConfirm: async () => {
          await executeCreateOrUpdate(true);
          setActiveTab(tab);
        },
        onDiscard: () => {
          setActiveTab(tab);
          setNewEvent(EMPTY_EVENT);
        }
        // onClose (Anuluj) is handled by default (closes modal, stays on page)
      });
    } else {
      setActiveTab(tab);
    }
  };

  // Prevent leaving page if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [newEvent, activeTab]);

  const executeCreateOrUpdate = async (forceDraft?: boolean) => {
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
          isDraft: forceDraft !== undefined ? forceDraft : newEvent.isDraft,
          difficulty: newEvent.type === 'GÓRY' ? Number(newEvent.difficulty || 3) : null,
          spots: Number(newEvent.spots || 0),
          gearRequired: newEvent.type === 'GÓRY' ? newEvent.gearRequired : [],
          gearCritical: newEvent.type === 'GÓRY' ? newEvent.gearCritical : []
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          forceDraft === true ? 'Szkic zapisany!' :
          forceDraft === false && editingId ? 'Wydarzenie opublikowane!' :
          editingId ? 'Wydarzenie zaktualizowane!' : 'Wydarzenie opublikowane!',
          'success'
        );
        setNewEvent(EMPTY_EVENT);
        setEditingId(null);
        loadEvents();
        const isPast = new Date(newEvent.dateStart) < new Date(new Date().setHours(0,0,0,0));
        if (isPast && !forceDraft && !editingId) {
          setActiveTab('gpx');
        } else {
          setActiveTab('list');
        }
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
    
    // Manual validation for publication
    if (!newEvent.title || !newEvent.dateStart || !newEvent.type) {
      showToast('Uzupełnij tytuł, datę rozpoczęcia i typ przed publikacją!', 'error');
      return;
    }

    // Publishing a draft forces isDraft:false; editing a published event keeps its current state
    const publishingDraft = editingId && newEvent.isDraft;
    const forceDraftArg = publishingDraft ? false : undefined;

    confirmAction({
      title: publishingDraft ? 'Opublikuj Wydarzenie' : (editingId ? 'Potwierdź Edycję' : 'Potwierdź Utworzenie'),
      message: publishingDraft
        ? `Wydarzenie "${newEvent.title}" zostanie opublikowane i będzie widoczne dla wszystkich.`
        : `Czy na pewno chcesz ${editingId ? 'zapisać zmiany w wydarzeniu' : 'stworzyć nowe wydarzenie'} "${newEvent.title || 'bez tytułu'}"?`,
      variant: 'primary',
      onConfirm: () => executeCreateOrUpdate(forceDraftArg)
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

  const loadAllUsers = async () => {
    try {
      const res = await fetch('/api/users', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setAllUsers(data);
    } catch { /* ignore */ }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(status === 'ACTIVE' ? 'Członek zatwierdzony' : 'Status zaktualizowany', 'success');
        loadAllUsers();
      } else {
        showToast('Błąd aktualizacji statusu', 'error');
      }
    } catch {
      showToast('Błąd połączenia', 'error');
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await fetch('/api/events', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch { /* ignore */ }
    finally { setEventsLoading(false); }
  };

  const toggleFeatured = async (eventId: string, title: string) => {
    try {
      const res = await fetch('/api/news/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventId, title })
      });
      const data = await res.json();
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, featured: data.added } : e));
      showToast(data.added ? 'Dodano do Aktualności' : 'Usunięto z Aktualności', 'success');
      loadNews();
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
    confirmAction({
      title: 'Usuń Wydarzenie',
      message: `CZY NA PEWNO CHCESZ USUNĄĆ WYPRAWĘ "${title.toUpperCase()}"?`,
      variant: 'danger',
      onConfirm: () => {
        const deletedEvent = events.find(e => e.id === eventId);
        setEvents(prev => prev.filter(e => e.id !== eventId));
        
        let undoClicked = false;
        showToast(`Usunięto: ${title}`, 'success', () => {
          undoClicked = true;
          setEvents(prev => [...prev, deletedEvent].sort((a, b) => new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()));
        });

        setTimeout(async () => {
          if (!undoClicked) {
            await fetch(`/api/events/${eventId}`, { method: 'DELETE', credentials: 'include' });
          }
        }, 6000);
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
      gearRequired: event.gearRequired || [],
      gearCritical: event.gearCritical || [],
      isDraft: event.isDraft || false,
      organizer: event.organizer || '',
      meetingPointName: event.meetingPointName || '',
      meetingPointLink: event.meetingPointLink || '',
      meetingPointEmbed: event.meetingPointEmbed || '',
      transport: event.transport || '',
      weatherInfo: event.weatherInfo || '',
      imageFocalX: event.imageFocalX ?? 50,
      imageFocalY: event.imageFocalY ?? 50,
      plannedDistance: event.plannedDistance ?? '',
      plannedElevation: event.plannedElevation ?? '',
      plannedDuration: event.plannedDuration != null ? Math.round(event.plannedDuration / 60 * 10) / 10 : ''
    });
    setEditingId(event.id);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadWikiArticles = async () => {
    setWikiLoading(true);
    try {
      const res = await fetch('/api/wiki', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setWikiArticles(data);
    } catch { /* ignore */ }
    finally { setWikiLoading(false); }
  };

  const handleSaveWiki = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingWikiId ? `/api/wiki/${editingWikiId}` : '/api/wiki';
      const method = editingWikiId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newWikiArticle)
      });
      if (res.ok) {
        showToast(editingWikiId ? 'Artykuł zaktualizowany' : 'Artykuł dodany', 'success');
        setNewWikiArticle({ title: '', category: 'Poradnik', content: '', tags: [], authorName: '' });
        setEditingWikiId(null);
        loadWikiArticles();
      } else {
        showToast('Błąd zapisu artykułu', 'error');
      }
    } catch {
      showToast('Błąd połączenia', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteWiki = (id: string, title: string) => {
    confirmAction({
      title: 'Usuń Artykuł',
      message: `CZY NA PEWNO CHCESZ USUNĄĆ ARTYKUŁ "${title.toUpperCase()}"?`,
      variant: 'danger',
      onConfirm: () => {
        const deletedArticle = wikiArticles.find(a => a.id === id);
        setWikiArticles(prev => prev.filter(a => a.id !== id));
        
        let undoClicked = false;
        showToast(`Usunięto artykuł: ${title}`, 'success', () => {
          undoClicked = true;
          setWikiArticles(prev => [...prev, deletedArticle]);
        });

        setTimeout(async () => {
          if (!undoClicked) {
            await fetch(`/api/wiki/${id}`, { method: 'DELETE', credentials: 'include' });
          }
        }, 6000);
      }
    });
  };

  const startEditingWiki = (article: any) => {
    setNewWikiArticle({
      title: article.title,
      category: article.category,
      content: article.content,
      tags: Array.isArray(article.tags) ? article.tags : [],
      authorName: article.authorName || ''
    });
    setEditingWikiId(article.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  useEffect(() => {
    if (activeTab === 'gpx') {
      fetch('/api/gpx/queue', { credentials: 'include' })
        .then(r => r.json())
        .then(d => setGpxQueue(Array.isArray(d) ? d : []))
        .catch(() => {});
      loadCompletionQueue();
    }
    if (activeTab === 'list') {
      loadEvents();
    }
    if (activeTab === 'wiki') {
      loadWikiArticles();
    }
    if (activeTab === 'news') {
      loadNews();
    }
    if (activeTab === 'members') {
      loadAllUsers();
    }
  }, [activeTab]);

  const loadNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('/api/news', { credentials: 'include' });
      const data = await res.json();
      if (Array.isArray(data)) setNews(data);
    } catch { /* ignore */ }
    finally { setNewsLoading(false); }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newNewsItem)
      });
      if (res.ok) {
        showToast('Aktualność dodana', 'success');
        setNewNewsItem({ title: '', content: '', type: 'GENERAL', link: '', imageUrl: '' });
        loadNews();
      }
    } catch { showToast('Błąd zapisu', 'error'); }
    finally { setLoading(false); }
  };

  const deleteNews = (id: string, title: string) => {
    confirmAction({
      title: 'Usuń Aktualność',
      message: `CZY NA PEWNO CHCESZ USUNĄĆ AKTUALNOŚĆ "${title.toUpperCase()}"?`,
      variant: 'danger',
      onConfirm: () => {
        const deletedItem = news.find(n => n.id === id);
        setNews(prev => prev.filter(n => n.id !== id));
        
        let undoClicked = false;
        showToast(`Usunięto aktualność: ${title}`, 'success', () => {
          undoClicked = true;
          setNews(prev => [...prev, deletedItem]);
        });

        setTimeout(async () => {
          if (!undoClicked) {
            await fetch(`/api/news/${id}`, { method: 'DELETE', credentials: 'include' });
          }
        }, 6000);
      }
    });
  };

  const toggleWikiNews = async (articleId: string, title: string) => {
    try {
      const res = await fetch('/api/news/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ articleId, title })
      });
      const data = await res.json();
      showToast(data.added ? 'Artykuł wyróżniony' : 'Usunięto wyróżnienie', 'success');
      loadNews();
      loadWikiArticles();
    } catch { showToast('Błąd', 'error'); }
  };


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

  const loadCompletionQueue = async () => {
    setCompletionLoading(true);
    try {
      const res = await fetch('/api/events/admin/completion-queue', { credentials: 'include' });
      const data = await res.json();
      setCompletionQueue(Array.isArray(data) ? data : []);
    } catch { showToast('Błąd ładowania kolejki rozliczeń', 'error'); }
    finally { setCompletionLoading(false); }
  };

  const finalizeEvent = async (eventId: string, payload: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast('Wydarzenie sfinalizowane!', 'success');
        setFinalizingEvent(null);
        loadCompletionQueue();
      } else {
        showToast('Błąd finalizacji', 'error');
      }
    } catch { showToast('Błąd połączenia', 'error'); }
    finally { setLoading(false); }
  };

  const handleAdminGpxUpload = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/gpx/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        showToast('Trasa GPX została dodana!', 'success');
        setShowGpxModal(null);
        // Refresh the finalizing event data
        if (finalizingEvent) {
          const updatedRes = await fetch(`/api/events/${finalizingEvent.id}`, { credentials: 'include' });
          const updatedData = await updatedRes.json();
          setFinalizingEvent(updatedData);
        }
      } else {
        showToast(data.error || 'Błąd uploadu', 'error');
      }
    } catch { showToast('Błąd połączenia', 'error'); }
    finally { setLoading(false); }
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


  useEffect(() => {
    loadEvents();
    loadWikiArticles();
    loadNews();
    loadCompletionQueue();
    
    // Load GPX Queue
    fetch('/api/gpx/queue', { credentials: 'include' })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setGpxQueue(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="pb-24 bg-surface min-h-screen">

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <PageHeader 
          title="Panel Admina" 
          subtitle="ZARZĄDZANIE WYPRAWAMI, WIEDZĄ I AKTUALNOŚCIAMI GRUPY TRUP."
          category="System zarządzania"
        />

        {/* Bootstrap banner — widoczny gdy rola to 'user' */}
        {/* Bootstrap banner — widoczny gdy rola to 'user' */}
        {role === 'user' && (
          <Card className="mb-8 border-warning/40 bg-warning/5 p-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-stretch">
              <div className="p-6 flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="warning" className="animate-pulse">Tryb Konfiguracji</Badge>
                  <p className="font-bold text-[10px] uppercase tracking-widest text-warning-700">Twoja rola: Użytkownik</p>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  System wykrył brak aktywnego administratora. Kliknij przycisk obok, aby nadać sobie uprawnienia. 
                  <span className="block mt-1 opacity-70 italic">Uwaga: Ta opcja zniknie po nadaniu pierwszego administratora.</span>
                </p>
              </div>
              <div className="bg-warning/10 p-6 flex items-center justify-center border-l border-warning/20">
                <Button
                  onClick={async () => {
                    const res = await fetch('/api/auth/make-admin', { method: 'POST', credentials: 'include' });
                    const data = await res.json();
                    if (data.success) { showToast(data.message, 'success'); window.location.reload(); }
                    else showToast(data.error, 'error');
                  }}
                  variant="warning"
                  className="shrink-0 shadow-lg shadow-warning/20"
                  leftIcon={<Settings size={16} />}
                >
                  Zostań Administratorem
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar */}
          <div className="w-full md:w-56 flex flex-col gap-1 shrink-0 md:sticky md:top-24">
            {/* Nowe Wydarzenie */}
            <Button
              onClick={() => handleTabChange('create')}
              variant={activeTab === 'create' ? 'primary' : 'secondary'}
              className="!justify-start gap-3 group"
              leftIcon={<Plus size={14} className={cn("transition-colors", activeTab === 'create' ? "text-black group-hover:text-green-500" : "text-green-500")} />}
            >
              Kreator wydarzeń
            </Button>

            {/* Rozliczenia */}
            <Button
              onClick={() => handleTabChange('gpx')}
              variant={activeTab === 'gpx' ? 'primary' : 'secondary'}
              className="!justify-start gap-3"
              leftIcon={<CheckCircle size={14} className="text-green-500" />}
            >
              Rozliczenia{completionQueue.length > 0 ? ` (${completionQueue.length})` : ''}
            </Button>

            {/* Powiadomienia */}
            <Button
              onClick={() => handleTabChange('push')}
              variant={activeTab === 'push' ? 'primary' : 'secondary'}
              className="!justify-start gap-3"
              leftIcon={<Send size={14} className="text-green-500" />}
            >
              Wyślij powiadomienie
            </Button>

            <div className="mt-6 space-y-1">
              <p className="px-5 text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-2">Bazy:</p>
              
              {/* Baza Wydarzeń */}
              <Button
                onClick={() => handleTabChange('list')}
                variant={activeTab === 'list' ? 'primary' : 'secondary'}
                className="!justify-start gap-3 w-full"
                leftIcon={<Star size={14} className="text-green-500" />}
              >
                Wydarzenia
              </Button>

              <Button
                onClick={() => handleTabChange('wiki')}
                variant={activeTab === 'wiki' ? 'primary' : 'secondary'}
                className="!justify-start gap-3 w-full"
                leftIcon={<Book size={14} className="text-green-500" />}
              >
                Wiedza
              </Button>

              <Button
                onClick={() => handleTabChange('news')}
                variant={activeTab === 'news' ? 'primary' : 'secondary'}
                className="!justify-start gap-3 w-full"
                leftIcon={<Zap size={14} className="text-green-500" />}
              >
                Aktualności
              </Button>

              {/* Baza Grafik */}
              <Button
                asChild
                variant="secondary"
                className="!justify-start gap-3 w-full"
                leftIcon={<ImageIcon size={14} className="text-green-500" />}
              >
                <Link to="/admin/galeria">Grafiki</Link>
              </Button>
            </div>

            <div className="mt-6 space-y-1">
              <p className="px-5 text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 mb-2">Ludzie:</p>
              <Button
                onClick={() => handleTabChange('members')}
                variant={activeTab === 'members' ? 'primary' : 'secondary'}
                className="!justify-start gap-3 w-full"
                leftIcon={<User size={14} className={cn("transition-colors", activeTab === 'members' ? "text-black" : "text-green-500")} />}
              >
                Członkowie{allUsers.filter((u: any) => u.status === 'INACTIVE').length > 0 ? ` (${allUsers.filter((u: any) => u.status === 'INACTIVE').length})` : ''}
              </Button>
            </div>

            <div className="mt-6 space-y-1">
              {/* Kalendarz */}
              <Button
                asChild
                variant="secondary"
                className="!justify-start gap-3 w-full"
                leftIcon={<Calendar size={14} className="text-green-500" />}
              >
                <Link to="/kalendarz">Kalendarz</Link>
              </Button>
            </div>

            </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* === NOWA WYPRAWA === */}
            {activeTab === 'create' && (
              <form noValidate onSubmit={handleCreateEvent} className="bg-surface-container-low border border-outline-variant/30 p-4 sm:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 mb-6">
                  <h2 className="font-display font-black text-2xl uppercase text-on-surface">
                    {editingId ? 'Edycja Wydarzenia' : 'Kreator Wydarzenia'}
                  </h2>
                  {editingId && (
                    <Button 
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => { setEditingId(null); setNewEvent(EMPTY_EVENT); }}
                    >
                      Anuluj edycję
                    </Button>
                  )}
                </div>

                {/* 1. TYTUŁ I TYP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Tytuł Wydarzenia" required>
                    <Input type="text" value={newEvent.title || ''} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                  </FormField>
                  <FormField label="Kategoria Wydarzenia">
                    <Select 
                      value={newEvent.type} 
                      onChange={e => {
                        const newType = e.target.value;
                        setNewEvent({ 
                          ...newEvent, 
                          type: newType,
                          isExpedition: newType === 'GÓRY'
                        });
                      }}
                    >
                      <option>GÓRY</option>
                      <option>INTEGRACJA</option>
                      <option>KULTURA</option>
                    </Select>
                  </FormField>
                </div>

                {/* 2. DATY */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Data Rozpoczęcia" required>
                    <Input type="date" value={newEvent.dateStart || ''} onChange={e => setNewEvent({ ...newEvent, dateStart: e.target.value })} />
                  </FormField>
                  <FormField label="Data Zakończenia (opcjonalnie)">
                    <Input type="date" value={newEvent.dateEnd || ''} onChange={e => setNewEvent({ ...newEvent, dateEnd: e.target.value })} />
                  </FormField>
                </div>

                {/* 3. ILOŚĆ MIEJSC */}
                <div className="max-w-xs space-y-2">
                  <Checkbox 
                    label="Ograniczona liczba miejsc"
                    checked={newEvent.spots !== null} 
                    onChange={e => setNewEvent({ ...newEvent, spots: e.target.checked ? 12 : null })}
                  />
                  {newEvent.spots !== null ? (
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={newEvent.spots || 0}
                      onChange={e => setNewEvent({ ...newEvent, spots: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <div className="h-11 bg-surface-container border border-outline-variant/30 flex items-center px-4 text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 cursor-not-allowed">
                      Brak limitu miejsc
                    </div>
                  )}
                </div>

                {/* 4. SEKCJE SPECYFICZNE */}
                {newEvent.type === 'GÓRY' ? (
                  <div className="space-y-6 pt-6 border-t border-outline-variant/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Poziom Trudności (1-5 gwiazdek)">
                        <div 
                          className="flex gap-2 items-center justify-start bg-surface-container border border-outline-variant/30 h-11 px-4"
                          onMouseLeave={() => setHoveredDifficulty(0)}
                        >
                          {[1, 2, 3, 4, 5].map((star) => {
                            const isLit = (hoveredDifficulty || (newEvent.difficulty as number)) >= star;
                            return (
                              <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoveredDifficulty(star)}
                                onClick={() => setNewEvent({ ...newEvent, difficulty: star })}
                                className={cn(
                                  "text-xl transition-all duration-200",
                                  isLit ? 'text-primary scale-110' : 'text-on-surface-variant/30',
                                  hoveredDifficulty >= star && hoveredDifficulty !== 0 && "opacity-80 scale-125"
                                )}
                              >
                                ★
                              </button>
                            );
                          })}
                        </div>
                      </FormField>
                      <FormField label="Organizator Wyprawy">
                        <Input type="text" placeholder="Ksywa / Imię" value={newEvent.organizer || ''} onChange={e => setNewEvent({ ...newEvent, organizer: e.target.value })} />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <FormField label="Planowany Dystans (km)">
                        <Input type="number" min="0" step="0.1" placeholder="np. 12.5" value={newEvent.plannedDistance ?? ''} onChange={e => setNewEvent({ ...newEvent, plannedDistance: e.target.value })} />
                      </FormField>
                      <FormField label="Planowane Przewyższenie (m)">
                        <Input type="number" min="0" step="1" placeholder="np. 800" value={newEvent.plannedElevation ?? ''} onChange={e => setNewEvent({ ...newEvent, plannedElevation: e.target.value })} />
                      </FormField>
                      <FormField label="Czas Trwania (godz.)">
                        <Input type="number" min="0" step="0.5" placeholder="np. 6" value={newEvent.plannedDuration ?? ''} onChange={e => setNewEvent({ ...newEvent, plannedDuration: e.target.value })} />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Lokalizacja (Nazwa)" required>
                        <Input type="text" value={newEvent.location || ''} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                      </FormField>
                      <FormField label="Link do Map (Przycisk)">
                        <Input type="url" placeholder="https://mapy.cz/..." value={newEvent.mapLink || ''} onChange={e => setNewEvent({ ...newEvent, mapLink: e.target.value })} />
                      </FormField>
                    </div>

                    <FormField label="Link do Embedu Trasy (Iframe)">
                      <Input type="text" placeholder='<iframe src="..." ...></iframe>' value={newEvent.mapEmbed || ''} onChange={e => setNewEvent({ ...newEvent, mapEmbed: e.target.value })} />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Nazwa Miejsca Zbiórki">
                        <Input type="text" placeholder="Np. Parking pod wyciągiem" value={newEvent.meetingPointName || ''} onChange={e => setNewEvent({ ...newEvent, meetingPointName: e.target.value })} />
                      </FormField>
                      <FormField label="Link / Embed Punktu Zbiórki">
                        <Input type="text" placeholder='Link lub iframe' value={newEvent.meetingPointEmbed || ''} onChange={e => setNewEvent({ ...newEvent, meetingPointEmbed: e.target.value })} />
                      </FormField>
                    </div>

                    <FormField label="Informacje o Dojeździe (Opis)">
                      <Textarea value={newEvent.transport || ''} onChange={e => setNewEvent({ ...newEvent, transport: e.target.value })} />
                    </FormField>

                    <FormField label="Pogoda (Opis)">
                      <Textarea value={newEvent.weatherInfo || ''} onChange={e => setNewEvent({ ...newEvent, weatherInfo: e.target.value })} />
                    </FormField>

                    <FormField 
                      label="Opis Wydarzenia"
                      description="Obsługuje Markdown"
                    >
                      <Textarea placeholder="Plan wyprawy..." value={newEvent.description || ''} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                    </FormField>

                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant block">Potrzebny Sprzęt</label>
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
                    </div>

                    <FormField label="Zdjęcie Wydarzenia">
                      <div className="flex gap-4">
                        <Button type="button" variant="secondary" onClick={() => setShowImagePicker(true)} leftIcon={<ImageIcon size={16} />}>Wybierz</Button>
                        <Input type="url" placeholder="URL zdjęcia..." value={newEvent.image || ''} readOnly className="opacity-60" />
                      </div>
                      {newEvent.image && (
                        <ImagePositionPicker
                          src={newEvent.image}
                          focalX={newEvent.imageFocalX ?? 50}
                          focalY={newEvent.imageFocalY ?? 50}
                          onChange={(x, y) => setNewEvent(prev => ({ ...prev, imageFocalX: x, imageFocalY: y }))}
                          className="mt-4"
                        />
                      )}
                    </FormField>
                  </div>
                ) : (
                  <div className="space-y-6 pt-6 border-t border-outline-variant/30">
                    <FormField label="Organizator">
                      <Input type="text" value={newEvent.organizer || ''} onChange={e => setNewEvent({ ...newEvent, organizer: e.target.value })} />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Lokalizacja (Nazwa)" required>
                        <Input type="text" value={newEvent.location || ''} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} />
                      </FormField>
                      <FormField label="Link do Map (Przycisk)">
                        <Input type="url" value={newEvent.mapLink || ''} onChange={e => setNewEvent({ ...newEvent, mapLink: e.target.value })} />
                      </FormField>
                    </div>

                    <FormField label="Link do Embedu Mapy">
                      <Input type="text" placeholder='<iframe src="..." ...></iframe>' value={newEvent.mapEmbed || ''} onChange={e => setNewEvent({ ...newEvent, mapEmbed: e.target.value })} />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField label="Nazwa Miejsca Zbiórki">
                        <Input type="text" value={newEvent.meetingPointName || ''} onChange={e => setNewEvent({ ...newEvent, meetingPointName: e.target.value })} />
                      </FormField>
                      <FormField label="Link / Embed Punktu Zbiórki">
                        <Input type="text" value={newEvent.meetingPointEmbed || ''} onChange={e => setNewEvent({ ...newEvent, meetingPointEmbed: e.target.value })} />
                      </FormField>
                    </div>

                    <FormField label="Informacje o Dojeździe (Opis)">
                      <Textarea value={newEvent.transport || ''} onChange={e => setNewEvent({ ...newEvent, transport: e.target.value })} />
                    </FormField>

                    <FormField label="Pogoda (Opis)">
                      <Textarea value={newEvent.weatherInfo || ''} onChange={e => setNewEvent({ ...newEvent, weatherInfo: e.target.value })} />
                    </FormField>

                    <FormField label="Opis Wydarzenia">
                      <Textarea value={newEvent.description || ''} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
                    </FormField>

                    <FormField label="Zdjęcie Wydarzenia">
                      <div className="flex gap-4">
                        <Button type="button" variant="secondary" onClick={() => setShowImagePicker(true)} leftIcon={<ImageIcon size={16} />}>Wybierz</Button>
                        <Input type="url" value={newEvent.image || ''} readOnly className="opacity-60" />
                      </div>
                      {newEvent.image && (
                        <ImagePositionPicker
                          src={newEvent.image}
                          focalX={newEvent.imageFocalX ?? 50}
                          focalY={newEvent.imageFocalY ?? 50}
                          onChange={(x, y) => setNewEvent(prev => ({ ...prev, imageFocalX: x, imageFocalY: y }))}
                          className="mt-4"
                        />
                      )}
                    </FormField>
                  </div>
                )}

                {showImagePicker && (
                  <ImagePicker 
                    onSelect={(url) => setNewEvent({ ...newEvent, image: url })} 
                    onClose={() => setShowImagePicker(false)} 
                  />
                )}

                <div className="flex gap-4">
                  <Button
                    type="submit"
                    isLoading={loading}
                    className="flex-1 py-4 text-lg"
                    leftIcon={editingId && newEvent.isDraft ? <Plus size={20} /> : editingId ? <Edit3 size={20} /> : <Plus size={20} />}
                  >
                    {editingId && newEvent.isDraft ? 'Opublikuj' : editingId ? 'Zapisz Zmiany' : 'Opublikuj Wydarzenie'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    isLoading={loading}
                    className="flex-1 py-4 text-lg"
                    onClick={() => executeCreateOrUpdate(true)}
                    leftIcon={<FileText size={20} />}
                  >
                    {editingId ? (newEvent.isDraft ? 'Zaktualizuj Szkic' : 'Cofnij do Szkicu') : 'Zapisz Szkic'}
                  </Button>
                </div>
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
                  <div className="space-y-12">
                    {/* Sekcja Szkice */}
                    {events.filter(e => e.isDraft).length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-4 flex items-center gap-3">
                          <FileText size={14} /> Zapisane Szkice
                        </h3>
                        <div className="space-y-3">
                          {events.filter(e => e.isDraft).map(event => (
                            <Card 
                              key={event.id} 
                              onClick={() => startEditing(event)}
                              className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer hover:bg-surface-container-lowest group border-l-4 border-l-amber-500/50"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">SZKIC</Badge>
                                  <Badge variant="primary">{event.type}</Badge>
                                </div>
                                <p className="font-display font-black text-lg uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors">{event.title || 'BEZ TYTUŁU'}</p>
                                <p className="text-xs text-on-surface-variant mt-0.5 opacity-70">
                                  {event.dateStart ? new Date(event.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : 'BRAK DATY'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button variant="secondary" size="icon" onClick={(e) => { e.stopPropagation(); startEditing(event); }}><Edit3 size={16} /></Button>
                                <Button variant="danger" size="icon" onClick={(e) => { e.stopPropagation(); deleteEvent(event.id, event.title); }}><Trash2 size={16} /></Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sekcja Opublikowane */}
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant mb-4 flex items-center gap-3">
                        <CheckCircle size={14} /> Opublikowane Wydarzenia
                      </h3>
                      <div className="space-y-3">
                        {events.filter(e => !e.isDraft).map(event => (
                          <Card 
                            key={event.id} 
                            onClick={() => navigate(`/wydarzenia/${event.id}`)}
                            className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer hover:bg-surface-container-lowest group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <Badge variant="primary">{event.type}</Badge>
                                {event.featured && <Badge variant="warning">⭐ Aktualności</Badge>}
                                {event.highlighted && <Badge variant="success">🏆 Osiągnięcie</Badge>}
                              </div>
                              <p className="font-display font-black text-lg uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors">{event.title}</p>
                              <p className="text-xs text-on-surface-variant mt-0.5 opacity-70">
                                {new Date(event.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                                {event.location ? ` · ${event.location}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="warning"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); toggleFeatured(event.id, event.title); }}
                                title={event.featured ? 'Usuń z wyróżnionych' : 'Dodaj do wyróżnionych'}
                                className={event.featured ? 'bg-yellow-100 text-amber-600 border-yellow-200' : ''}
                              >
                                {event.featured ? <Star size={16} fill="currentColor" /> : <StarOff size={16} />}
                              </Button>
                              <Button
                                variant="warning"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); toggleHighlighted(event.id, event.highlighted); }}
                                title={event.highlighted ? 'Usuń z Osiągnięć' : 'Oznacz jako Osiągnięcie'}
                                className={event.highlighted ? 'bg-yellow-100 text-amber-600 border-yellow-200' : ''}
                              >
                                <Trophy size={16} />
                              </Button>
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); startEditing(event); }}
                                title="Edytuj"
                              >
                                 <Edit3 size={16} />
                              </Button>
                              {event.isFinalized && (
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  title="Rozlicz ponownie"
                                  onClick={async (e) => { 
                                    e.stopPropagation(); 
                                    const res = await fetch(`/api/events/${event.id}`, { credentials: 'include' });
                                    const fullEvent = await res.json();
                                    setFinalizingEvent(fullEvent);
                                    setActiveTab('gpx');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                >
                                  <RefreshCcw size={16} />
                                </Button>
                              )}
                              <Button
                                variant="danger"
                                size="icon"
                                onClick={(e) => { e.stopPropagation(); deleteEvent(event.id, event.title); }}
                                title="Usuń"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </Card>
                        ))}
                        {events.filter(e => !e.isDraft).length === 0 && (
                          <p className="text-center py-8 text-on-surface-variant italic text-sm">Brak opublikowanych wydarzeń.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === BAZA WIEDZY WIKI === */}
            {activeTab === 'wiki' && (
              <div className="space-y-8">
                <form onSubmit={handleSaveWiki} className="bg-surface-container-low border border-outline-variant/30 p-8 space-y-6">
                  <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4 mb-6">
                    <h2 className="font-display font-black text-2xl uppercase text-on-surface">
                      {editingWikiId ? 'Edycja Artykułu' : 'Nowy Artykuł Wiki'}
                    </h2>
                    {editingWikiId && (
                      <Button 
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingWikiId(null); setNewWikiArticle({ title: '', category: 'Poradnik', content: '', tags: [], authorName: '' }); }}
                      >
                        Anuluj edycję
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Tytuł Artykułu" required>
                      <Input required type="text" value={newWikiArticle.title} onChange={e => setNewWikiArticle({ ...newWikiArticle, title: e.target.value })} />
                    </FormField>
                    <FormField label="Kategoria">
                      <Select value={newWikiArticle.category} onChange={e => setNewWikiArticle({ ...newWikiArticle, category: e.target.value })}>
                        <option>Poradnik</option>
                        <option>Recenzja</option>
                        <option>Artykuł</option>
                      </Select>
                    </FormField>
                    <FormField label="Autor (opcjonalnie)">
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={14} />
                        <Input 
                          type="text" 
                          placeholder="Imię i Nazwisko..."
                          className="pl-10" 
                          value={newWikiArticle.authorName} 
                          onChange={e => setNewWikiArticle({ ...newWikiArticle, authorName: e.target.value })} 
                        />
                      </div>
                    </FormField>
                  </div>

                  <FormField label="Tagi (oddzielone przecinkami)">
                    <div className="relative">
                      <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40" size={14} />
                      <Input 
                        type="text" 
                        placeholder="np. szpej, góry, zima"
                        className="pl-10" 
                        value={newWikiArticle.tags.join(', ')} 
                        onChange={e => setNewWikiArticle({ 
                          ...newWikiArticle, 
                          tags: e.target.value.split(',').map(t => t.trim()).filter(t => t !== '') 
                        })} 
                      />
                    </div>
                  </FormField>
                  
                  <FormField label="Treść Artykułu (Markdown/Text)" required>
                    <Textarea required className="min-h-[200px]" value={newWikiArticle.content} onChange={e => setNewWikiArticle({ ...newWikiArticle, content: e.target.value })} />
                  </FormField>

                  <Button
                    type="submit"
                    isLoading={loading}
                    className="w-full py-4 text-lg"
                    leftIcon={editingWikiId ? <Edit3 size={20} /> : <Plus size={20} />}
                  >
                    {editingWikiId ? 'Zapisz Artykuł' : 'Dodaj do Bazy Wiedzy'}
                  </Button>
                </form>

                <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                  <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface">Zarządzaj Artykułami</h2>
                  {wikiLoading ? (
                    <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>
                  ) : wikiArticles.length === 0 ? (
                    <p className="text-center py-12 text-on-surface-variant italic text-sm">Brak artykułów w bazie.</p>
                  ) : (
                    <div className="space-y-3">
                      {wikiArticles.map(article => (
                        <Card 
                          key={article.id} 
                          onClick={() => navigate(`/wiki/${article.id}`)}
                          className="p-4 flex items-center justify-between gap-4 group cursor-pointer hover:bg-surface-container-low transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <Badge variant="primary">{article.category}</Badge>
                              <div className="flex gap-2">
                                {Array.isArray(article.tags) && article.tags.map((tag: string, i: number) => (
                                  <Badge key={i} variant="outline" className="gap-1">
                                    <TagIcon size={8} /> {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <p className="font-display font-black text-lg uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors">{article.title}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="warning"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); toggleWikiNews(article.id, article.title); }} 
                              title="Wyróżnij w aktualnościach"
                              className={article.isFeatured ? 'bg-yellow-100 text-amber-600 border-yellow-200' : ''}
                            >
                              <Star size={16} fill={article.isFeatured ? "currentColor" : "none"} />
                            </Button>
                            <Button variant="secondary" size="icon" onClick={(e) => { e.stopPropagation(); startEditingWiki(article); }}><Edit3 size={16} /></Button>
                            <Button variant="danger" size="icon" onClick={(e) => { e.stopPropagation(); deleteWiki(article.id, article.title); }}><Trash2 size={16} /></Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === SYSTEM AKTUALNOŚCI === */}
            {activeTab === 'news' && (
              <div className="space-y-8">
                <form onSubmit={handleSaveNews} className="bg-surface-container-low border border-outline-variant/30 p-8 space-y-6">
                  <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface flex items-center gap-3">
                    Nowe Ogłoszenie <Zap className="text-primary" size={20} />
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Tytuł Ogłoszenia" required>
                      <Input required type="text" value={newNewsItem.title} onChange={e => setNewNewsItem({ ...newNewsItem, title: e.target.value })} />
                    </FormField>
                    <FormField label="Typ">
                      <Select value={newNewsItem.type} onChange={e => setNewNewsItem({ ...newNewsItem, type: e.target.value })}>
                        <option value="UPDATE">Aktualizacja Strony</option>
                        <option value="GENERAL">Ogólne</option>
                      </Select>
                    </FormField>
                  </div>
                  <FormField label="Treść (krótki opis)">
                    <Textarea className="min-h-[100px] resize-none" value={newNewsItem.content} onChange={e => setNewNewsItem({ ...newNewsItem, content: e.target.value })} />
                  </FormField>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Link (opcjonalnie)">
                      <Input type="text" value={newNewsItem.link} onChange={e => setNewNewsItem({ ...newNewsItem, link: e.target.value })} placeholder="/galeria, /wiki itp." />
                    </FormField>
                    <FormField label="URL Zdjęcia (opcjonalnie)">
                      <Input type="text" value={newNewsItem.imageUrl} onChange={e => setNewNewsItem({ ...newNewsItem, imageUrl: e.target.value })} />
                    </FormField>
                  </div>
                  <Button type="submit" isLoading={loading} className="w-full py-4 text-lg" leftIcon={<Plus size={20} />}>
                    Dodaj Ogłoszenie
                  </Button>
                </form>

                <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                  <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface">Zarządzaj Kolejką Aktualności</h2>
                  {newsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>
                  ) : news.length === 0 ? (
                    <p className="text-center py-12 text-on-surface-variant italic text-sm">Brak aktywnych aktualności.</p>
                  ) : (
                    <div className="space-y-3">
                      {news.map(item => (
                        <Card key={item.id} className="p-4 flex items-center justify-between gap-4 group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-surface-container flex items-center justify-center text-primary shrink-0">
                              {item.type === 'EVENT' ? <Trophy size={18} /> : item.type === 'ARTICLE' ? <Book size={18} /> : <Zap size={18} />}
                            </div>
                            <div>
                              <Badge variant="secondary" className="mb-1">{item.type}</Badge>
                              <p className="font-display font-black text-base uppercase tracking-tight text-on-surface">{item.eventTitle || item.articleTitle || item.title}</p>
                            </div>
                          </div>
                          <Button variant="danger" size="icon" onClick={() => deleteNews(item.id, item.eventTitle || item.articleTitle || item.title)} title="Usuń z aktualności">
                            <Trash2 size={16} />
                          </Button>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* === CZŁONKOWIE === */}
            {activeTab === 'members' && (
              <div className="space-y-8">

                {/* Pending approval */}
                {allUsers.filter((u: any) => u.status === 'INACTIVE').length > 0 && (
                  <div className="bg-surface-container-low border border-outline-variant/30 p-4 sm:p-8">
                    <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface flex items-center gap-3">
                      Oczekują na zatwierdzenie
                      <span className="bg-primary text-surface text-xs font-black px-2 py-0.5">{allUsers.filter((u: any) => u.status === 'INACTIVE').length}</span>
                    </h2>
                    <div className="space-y-3">
                      {allUsers.filter((u: any) => u.status === 'INACTIVE').map((u: any) => (
                        <div key={u.id} className="flex items-center gap-4 p-4 bg-surface-container border border-outline-variant/20">
                          <div className="w-10 h-10 bg-surface-container-highest overflow-hidden shrink-0">
                            {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-2.5 text-on-surface-variant" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-on-surface truncate">{u.name || '—'}</p>
                            <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                          </div>
                          <Button size="sm" onClick={() => updateUserStatus(u.id, 'ACTIVE')} leftIcon={<CheckCircle size={14} />}>
                            Zatwierdź
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suspended */}
                {allUsers.filter((u: any) => u.status === 'FLAGGED').length > 0 && (
                  <div className="bg-surface-container-low border border-outline-variant/30 p-4 sm:p-8">
                    <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface flex items-center gap-3">
                      Zawieszeni
                      <span className="bg-red-500/20 text-red-500 text-xs font-black px-2 py-0.5">{allUsers.filter((u: any) => u.status === 'FLAGGED').length}</span>
                    </h2>
                    <div className="space-y-3">
                      {allUsers.filter((u: any) => u.status === 'FLAGGED').map((u: any) => (
                        <div key={u.id} className="flex items-center gap-4 p-4 bg-surface-container border border-red-500/20">
                          <div className="w-10 h-10 bg-surface-container-highest overflow-hidden shrink-0">
                            {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover opacity-50" /> : <User size={20} className="m-auto mt-2.5 text-on-surface-variant/40" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-on-surface/60 truncate">{u.name || '—'}</p>
                            <p className="text-xs text-on-surface-variant/60 truncate">{u.email}</p>
                          </div>
                          <Button size="sm" variant="secondary" onClick={() => updateUserStatus(u.id, 'ACTIVE')} leftIcon={<CheckCircle size={14} />}>
                            Przywróć dostęp
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Active members */}
                <div className="bg-surface-container-low border border-outline-variant/30 p-4 sm:p-8">
                  <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface">
                    Aktywni członkowie ({allUsers.filter((u: any) => u.status === 'ACTIVE').length})
                  </h2>
                  <div className="space-y-2">
                    {allUsers.filter((u: any) => u.status === 'ACTIVE').map((u: any) => (
                      <div key={u.id} className="flex items-center gap-4 p-3 bg-surface-container border border-outline-variant/20">
                        <div className="w-8 h-8 bg-surface-container-highest overflow-hidden shrink-0">
                          {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-1 text-on-surface-variant" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-on-surface truncate">
                            {u.name || '—'}{u.nickname && <span className="text-primary ml-2">"{u.nickname}"</span>}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {u.role === 'ADMIN' ? (
                            <Badge variant="primary" className="text-[9px]">ADMIN</Badge>
                          ) : (
                            <Button size="sm" variant="danger" onClick={() => updateUserStatus(u.id, 'FLAGGED')} leftIcon={<Trash2 size={14} />}>
                              Zawieś
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* === ROZLICZENIA I KOLEJKA GPX === */}
            {activeTab === 'gpx' && (
              <div className="space-y-8">
                {finalizingEvent ? (
                  <ExpeditionFinalizer 
                    event={finalizingEvent} 
                    loading={loading}
                    allUsers={allUsers}
                    onUploadGpx={(ev: any) => setShowGpxModal(ev)}
                    onCancel={() => setFinalizingEvent(null)}
                    onFinalize={(payload: any) => finalizeEvent(finalizingEvent.id, payload)}
                  />
                ) : (
                  <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                    <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface flex items-center gap-3">
                      Kolejka Rozliczeń <CheckCircle className="text-primary" size={20} />
                    </h2>
                    {completionLoading ? (
                      <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>
                    ) : completionQueue.length === 0 ? (
                      <div className="text-center py-16">
                        <CheckCircle size={48} className="mx-auto text-primary/20 mb-4" />
                        <p className="text-on-surface-variant italic text-sm">Wszystkie wyprawy zostały rozliczone.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {completionQueue.map(event => (
                          <Card key={event.id} className="p-6 border border-outline-variant/30 hover:border-primary/50 transition-colors group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="primary">{event.type}</Badge>
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60">
                                    {new Date(event.dateStart).toLocaleDateString('pl-PL')}
                                  </span>
                                </div>
                                <h3 className="font-display font-black text-xl uppercase text-on-surface group-hover:text-primary transition-colors">{event.title}</h3>
                                <div className="flex gap-4 mt-2">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                                    <User size={12} className="text-primary" /> {event.participants.length} zapisanych
                                  </div>
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-1.5">
                                    <MapIcon size={12} className="text-primary" /> {event.gpxSubmissions.length} tras GPX
                                  </div>
                                </div>
                              </div>
                              <Button 
                                onClick={() => setFinalizingEvent(event)}
                                rightIcon={<ArrowRight size={14} />}
                              >
                                Rozlicz Wyprawę
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* === POWIADOMIENIA === */}
            {activeTab === 'push' && (
              <div className="bg-surface-container-low border border-outline-variant/30 p-8">
                <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4 text-on-surface flex items-center gap-3">
                  Nadawanie Powiadomień <Send className="text-primary" size={20} />
                </h2>
                <Textarea
                  className="mb-4 min-h-[150px] resize-none"
                  placeholder="Treść powiadomienia (max 150 znaków)..."
                  maxLength={150}
                  value={pushMessage}
                  onChange={e => setPushMessage(e.target.value)}
                />
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">{pushMessage.length}/150 znaków</span>
                </div>
                <Button
                  onClick={handleSendPush}
                  isLoading={loading}
                  disabled={!pushMessage.trim()}
                  leftIcon={<Send size={14} />}
                >
                  Wyślij Push
                </Button>
                <p className="text-on-surface-variant text-xs mt-4 uppercase tracking-widest font-bold">
                  Uwaga: Zostanie natychmiast wysłane do wszystkich zapisanych na powiadomienia.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showGpxModal && (
        <GpxUploadModal 
          event={showGpxModal} 
          onUpload={handleAdminGpxUpload} 
          onClose={() => setShowGpxModal(null)} 
        />
      )}
    </div>
  );
}

/**
 * Komponent do finalizacji rozliczenia wyprawy przez admina.
 */
function ExpeditionFinalizer({ event, onFinalize, onCancel, loading, allUsers, onUploadGpx }: any) {
  const [attendedIds, setAttendedIds] = useState<string[]>(
    event.participants.filter((p: any) => p.status === 'GOING').map((p: any) => p.userId)
  );
  const [routes, setRoutes] = useState<any[]>(
    event.gpxSubmissions.map((g: any) => ({
      id: g.id,
      label: g.label || 'Trasa',
      distance: g.distance,
      elevationGain: g.elevationGain,
      duration: g.duration,
      participantIds: g.participantIds || [],
      isOfficial: g.isOfficial,
      filePath: g.filePath,
      mapLink: g.mapLink,
      mapEmbed: g.mapEmbed,
      userName: g.user?.name || 'Admin'
    }))
  );

  // Synchronize routes if event.gpxSubmissions changes (after upload)
  useEffect(() => {
    setRoutes(event.gpxSubmissions.map((g: any) => ({
      id: g.id,
      label: g.label || 'Trasa',
      distance: g.distance,
      elevationGain: g.elevationGain,
      duration: g.duration,
      participantIds: g.participantIds || [],
      isOfficial: g.isOfficial,
      order: g.order || 0,
      filePath: g.filePath,
      mapLink: g.mapLink,
      mapEmbed: g.mapEmbed,
      userName: g.user?.name || 'Admin'
    })));
  }, [event.gpxSubmissions]);

  const moveRoute = (index: number, direction: 'up' | 'down') => {
    const newRoutes = [...routes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRoutes.length) return;
    
    [newRoutes[index], newRoutes[targetIndex]] = [newRoutes[targetIndex], newRoutes[index]];
    
    // Update order property based on new positions
    const orderedRoutes = newRoutes.map((r, i) => ({ ...r, order: i }));
    setRoutes(orderedRoutes);
  };

  const formatDuration = (min: number) => {
    if (!min) return '0m';
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const toggleAttendance = (userId: string) => {
    setAttendedIds(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const updateRouteParticipants = (routeId: string, userIds: string[]) => {
    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, participantIds: userIds } : r));
    
    // Jeśli ktoś został dodany do trasy, automatycznie zaznaczamy go jako obecnego na wyprawie
    setAttendedIds(prev => {
      const newAttended = [...prev];
      userIds.forEach(uid => {
        if (!newAttended.includes(uid)) {
          newAttended.push(uid);
        }
      });
      return newAttended;
    });
  };

  const setOfficial = (routeId: string) => {
    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, isOfficial: !r.isOfficial } : r));
  };

  const isMountain = event.type === 'GÓRY';

  const [showExtraUsers, setShowExtraUsers] = useState(false);
  const [previewRouteId, setPreviewRouteId] = useState<string | null>(null);

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 p-8 space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
        <h2 className="font-display font-black text-2xl uppercase text-on-surface">Rozliczanie: {event.title}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel}>Anuluj</Button>
        </div>
      </div>

      {/* Lista Obecności */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Lista Obecności</h3>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setShowExtraUsers(!showExtraUsers)}
            className="text-[10px]"
          >
            {showExtraUsers ? 'Ukryj Przybory' : '+ Dodaj spoza listy'}
          </Button>
        </div>

        {showExtraUsers && (
          <div className="p-4 bg-surface-container-highest border border-primary/20 space-y-4 animate-in fade-in zoom-in duration-200">
            <p className="text-[9px] font-bold uppercase tracking-widest text-primary/70">Wybierz użytkowników do dodania:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {allUsers
                .filter((u: any) => !event.participants.some((p: any) => p.userId === u.id) && !attendedIds.includes(u.id))
                .map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setAttendedIds(prev => [...prev, u.id]);
                    }}
                    className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest border border-outline-variant/50 text-on-surface-variant hover:border-primary hover:text-primary transition-all text-left bg-surface-container"
                  >
                    {u.name}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Display original participants + manually added ones */}
          {allUsers.filter((u: any) => event.participants.some((p: any) => p.userId === u.id) || attendedIds.includes(u.id)).map((u: any) => {
            const p = event.participants.find((p: any) => p.userId === u.id);
            const isAttended = attendedIds.includes(u.id);
            return (
              <div 
                key={u.id} 
                onClick={() => toggleAttendance(u.id)}
                className={cn(
                  "p-3 border flex items-center gap-3 cursor-pointer transition-all",
                  isAttended ? "border-primary bg-primary/5" : "border-outline-variant/20 bg-surface"
                )}
              >
                <Checkbox checked={isAttended} readOnly />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{u.name}</p>
                  <Badge variant={p?.status === 'GOING' ? 'success' : 'secondary'} className="text-[9px]">
                    {p?.status || 'MANUAL'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trasy GPX (tylko dla GÓRY) */}
      {isMountain && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Trasy GPX i Przypisanie Członków</h3>
            <Button size="sm" variant="secondary" leftIcon={<UploadCloud size={14} />} onClick={() => onUploadGpx(event)}>
              Wgraj Trasę GPX (Admin)
            </Button>
          </div>
          <div className="space-y-4">
            {routes.map((route: any, index: number) => (
              <Card key={route.id} className={cn("p-6 border-l-4", route.isOfficial ? "border-l-primary" : "border-l-outline-variant/30")}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5 mr-2">
                        <button 
                          onClick={() => moveRoute(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-surface-container-highest disabled:opacity-20 transition-colors"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button 
                          onClick={() => moveRoute(index, 'down')}
                          disabled={index === routes.length - 1}
                          className="p-1 hover:bg-surface-container-highest disabled:opacity-20 transition-colors"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </div>
                      
                      <Input 
                        className="font-bold uppercase text-lg bg-transparent border-none p-0 h-auto w-auto focus:ring-0" 
                        value={route.label} 
                        placeholder="Nazwa dnia / trasy"
                        onChange={(e) => setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, label: e.target.value } : r))}
                      />
                      {route.isOfficial && <Badge variant="primary">OFICJALNA</Badge>}
                    </div>
                    <p className="text-xs text-on-surface-variant mb-4">
                      Wgrana przez: {route.userName} · {route.distance}km · {route.elevationGain}m up · {formatDuration(route.duration)}
                    </p>
                    
                    <div className="flex gap-2 mb-4">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="text-[9px] h-8 px-4"
                        leftIcon={<MapIcon size={12} />}
                        onClick={() => setPreviewRouteId(previewRouteId === route.id ? null : route.id)}
                      >
                        {previewRouteId === route.id ? 'Ukryj Podgląd' : 'Podgląd Trasy na Mapie'}
                      </Button>
                      <a 
                        href={`http://localhost:3001/${route.filePath}`} 
                        download
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface-container-highest hover:bg-primary/20 text-[9px] font-bold uppercase tracking-widest transition-all border border-outline-variant/20 h-8"
                      >
                        <UploadCloud size={12} className="rotate-180" /> Pobierz Plik
                      </a>
                    </div>

                    {previewRouteId === route.id && (
                      <div className="mb-6 rounded-lg overflow-hidden border-2 border-primary/20 animate-in fade-in zoom-in-95 duration-300">
                        <GpxPreview fileUrl={`http://localhost:3001/${route.filePath}`} />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">Link do Mapy (np. Mapy.cz)</label>
                        <Input 
                          className="text-xs h-8"
                          value={route.mapLink || ''} 
                          onChange={(e) => setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, mapLink: e.target.value } : r))}
                          placeholder="https://mapy.cz/s/..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">Embed Mapy (iframe)</label>
                        <Input 
                          className="text-xs h-8"
                          value={route.mapEmbed || ''} 
                          onChange={(e) => setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, mapEmbed: e.target.value } : r))}
                          placeholder="<iframe ...></iframe>"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60">Czas trwania (minuty)</label>
                        <Input 
                          type="number"
                          className="text-xs h-8"
                          value={route.duration || 0} 
                          onChange={(e) => setRoutes(prev => prev.map(r => r.id === route.id ? { ...r, duration: parseInt(e.target.value) || 0 } : r))}
                          placeholder="Czas w minutach"
                        />
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant={route.isOfficial ? 'primary' : 'secondary'} 
                    size="sm"
                    onClick={() => setOfficial(route.id)}
                  >
                    {route.isOfficial ? 'Oficjalna' : 'Ustaw jako oficjalną'}
                  </Button>
                </div>
<div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">Uczestnicy tej trasy (Zadeklarowani: {route.participantIds.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set([...event.participants.map((p: any) => p.userId), ...attendedIds])].map(userId => {
                      const user = allUsers.find(u => u.id === userId);
                      const isAssigned = route.participantIds.includes(userId);
                      const p = event.participants.find((p: any) => p.userId === userId);
                      const status = p?.status;
                      
                      return (
                        <button
                          key={userId}
                          onClick={() => {
                            const newIds = isAssigned ? route.participantIds.filter((id: any) => id !== userId) : [...route.participantIds, userId];
                            updateRouteParticipants(route.id, newIds);
                          }}
                          className={cn(
                            "px-3 py-1 text-[10px] font-bold uppercase border transition-all flex items-center gap-2",
                            isAssigned ? "bg-primary text-black border-primary" : "bg-surface-container text-on-surface-variant border-outline-variant/20 opacity-50"
                          )}
                        >
                          {user?.name}
                          {status === 'GOING' && <div className="w-1 h-1 bg-black/40 rounded-full" title="Zadeklarował udział" />}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Additional people assigned to this route but not in attendedIds (unlikely but possible if we add them via the select below) */}
                  {route.participantIds.filter((id: string) => !attendedIds.includes(id)).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-outline-variant/5">
                      {route.participantIds.filter((id: string) => !attendedIds.includes(id)).map((userId: string) => {
                        const u = allUsers.find(au => au.id === userId);
                        return (
                          <button
                            key={userId}
                            onClick={() => {
                              const newIds = route.participantIds.filter((id: any) => id !== userId);
                              updateRouteParticipants(route.id, newIds);
                            }}
                            className="px-3 py-1 text-[10px] font-bold uppercase border bg-primary text-black border-primary transition-all"
                          >
                            {u?.name} (Zewn.)
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Add User From All Members */}
                  <div className="mt-4 pt-4 border-t border-outline-variant/5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-3">Dodaj innego członka do tej trasy:</p>
                    <div className="flex gap-2">
                      <select 
                        className="bg-surface-container border border-outline-variant/30 text-[10px] px-2 py-1 uppercase font-bold text-on-surface-variant focus:outline-none focus:border-primary flex-1"
                        onChange={(e) => {
                          const userId = e.target.value;
                          if (userId && !route.participantIds.includes(userId)) {
                            updateRouteParticipants(route.id, [...route.participantIds, userId]);
                            // Also ensure they are in attendedIds for the event
                            if (!attendedIds.includes(userId)) {
                              setAttendedIds(prev => [...prev, userId]);
                            }
                          }
                          e.target.value = "";
                        }}
                      >
                        <option value="">Wybierz członka...</option>
                        {allUsers
                          .filter(u => !route.participantIds.includes(u.id))
                          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {routes.length === 0 && <p className="text-center py-8 text-on-surface-variant italic text-sm">Brak wgranych tras GPX dla tej wyprawy.</p>}
          </div>
        </div>
      )}

      <div className="pt-8 border-t border-outline-variant/30 flex gap-4">
        <Button 
          className="flex-1 py-4 text-lg" 
          isLoading={loading}
          disabled={isMountain && routes.length > 0 && !routes.some(r => r.isOfficial)}
          onClick={() => onFinalize({ attendedUserIds: attendedIds, routesData: routes })}
        >
          Zatwierdź i Finalizuj Wydarzenie
        </Button>
      </div>
    </div>
  );
}
