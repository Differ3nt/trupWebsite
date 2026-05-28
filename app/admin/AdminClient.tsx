'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  List,
  UploadCloud,
  Book,
  FileText,
  User,
  Bell,
  Star,
  Trash2,
  Edit2,
} from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { FormField } from '@/components/ui/FormField';
import { Skeleton } from '@/components/ui/Skeleton';

const ALL_HARDWARE = [
  'Kask',
  'Czekan',
  'Raki koszykowe',
  'Raki półautomatyczne',
  'Raki automatyczne',
  'Raczki',
  'Uprząż',
  'Lonża',
  'Detektor Lawinowy',
  'Sonda',
  'Łopata',
  'Lina',
  'Karabinki',
  'Buty zimowe',
  'Kurtka puchowa',
  'Śpiwór letni',
  'Śpiwór zimowy',
  'Namiot',
  'Hamak',
  'Karimata/Materac',
  'Poddupnik',
];

const EMPTY_EVENT = {
  title: '',
  description: '',
  dateStart: '',
  dateEnd: '',
  location: '',
  mapLink: '',
  mapEmbed: '',
  difficulty: 3,
  spots: 12,
  type: 'GÓRY',
  gearRequired: [] as string[],
  gearCritical: [] as string[],
  image: '',
  isExpedition: false,
  highlighted: false,
  featured: true,
  isDraft: false,
  organizer: '',
  meetingPointName: '',
  meetingPointLink: '',
  meetingPointEmbed: '',
  transport: '',
  weatherInfo: '',
  imageFocalX: 50,
  imageFocalY: 50,
  plannedDistance: '',
  plannedElevation: '',
  plannedDuration: '',
};

const TABS = [
  { id: 'create', label: 'Utwórz Wydarzenie', icon: <Plus size={14} /> },
  { id: 'list', label: 'Zarządzaj', icon: <List size={14} /> },
  { id: 'gpx', label: 'Kolejka GPX', icon: <UploadCloud size={14} /> },
  { id: 'wiki', label: 'Wiki', icon: <Book size={14} /> },
  { id: 'news', label: 'Aktualności', icon: <FileText size={14} /> },
  { id: 'members', label: 'Członkowie', icon: <User size={14} /> },
  { id: 'push', label: 'Push', icon: <Bell size={14} /> },
];

export function AdminClient() {
  const [activeTab, setActiveTab] = useState<string>('create');

  // Events
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newEvent, setNewEvent] = useState({ ...EMPTY_EVENT });
  const [editingId, setEditingId] = useState<string | null>(null);

  // GPX queue
  const [gpxQueue, setGpxQueue] = useState<any[]>([]);

  // Wiki
  const [wikiArticles, setWikiArticles] = useState<any[]>([]);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [newWikiArticle, setNewWikiArticle] = useState({
    title: '',
    category: 'Poradnik',
    content: '',
    tags: [] as string[],
    authorName: '',
  });
  const [editingWikiId, setEditingWikiId] = useState<string | null>(null);

  // News
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newNewsItem, setNewNewsItem] = useState({ title: '', content: '', type: 'GENERAL' });
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);

  // Members
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Push
  const [pushMessage, setPushMessage] = useState('');
  const [pushTitle, setPushTitle] = useState('');

  useEffect(() => {
    if (activeTab === 'list') fetchEvents();
    if (activeTab === 'gpx') fetchGpxQueue();
    if (activeTab === 'wiki') fetchWikiArticles();
    if (activeTab === 'news') fetchNews();
    if (activeTab === 'members') fetchUsers();
  }, [activeTab]);

  async function fetchEvents() {
    setEventsLoading(true);
    try {
      const r = await fetch('/api/events/admin');
      const data = await r.json();
      if (Array.isArray(data)) setEvents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setEventsLoading(false);
    }
  }

  async function fetchGpxQueue() {
    try {
      const r = await fetch('/api/gpx/queue');
      const data = await r.json();
      if (Array.isArray(data)) setGpxQueue(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchWikiArticles() {
    setWikiLoading(true);
    try {
      const r = await fetch('/api/wiki');
      const data = await r.json();
      if (Array.isArray(data)) setWikiArticles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setWikiLoading(false);
    }
  }

  async function fetchNews() {
    setNewsLoading(true);
    try {
      const r = await fetch('/api/news');
      const data = await r.json();
      if (Array.isArray(data)) setNews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setNewsLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const r = await fetch('/api/users');
      const data = await r.json();
      if (Array.isArray(data)) setAllUsers(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateOrUpdate(isDraft = false) {
    setLoading(true);
    try {
      const payload = { ...newEvent, isDraft };
      const url = editingId ? `/api/events/${editingId}` : '/api/events';
      const method = editingId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (r.ok) {
        setNewEvent({ ...EMPTY_EVENT });
        setEditingId(null);
        setActiveTab('list');
        fetchEvents();
      } else {
        alert('Błąd zapisu.');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd zapisu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrUpdateWiki(isDraft = false) {
    setLoading(true);
    try {
      const url = editingWikiId ? `/api/wiki/${editingWikiId}` : '/api/wiki';
      const method = editingWikiId ? 'PUT' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWikiArticle),
      });
      if (r.ok) {
        setNewWikiArticle({
          title: '',
          category: 'Poradnik',
          content: '',
          tags: [],
          authorName: '',
        });
        setEditingWikiId(null);
        fetchWikiArticles();
      } else {
        alert('Błąd zapisu.');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd zapisu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrUpdateNews(isDraft = false) {
    setLoading(true);
    try {
      const url = editingNewsId ? `/api/news/${editingNewsId}` : '/api/news';
      const method = editingNewsId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNewsItem),
      });
      if (r.ok) {
        setNewNewsItem({ title: '', content: '', type: 'GENERAL' });
        setEditingNewsId(null);
        fetchNews();
      } else {
        alert('Błąd zapisu.');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd zapisu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-12">
      {/* Tab navigation */}
      <div className="sticky top-28 bg-surface border-b border-outline-variant/30 flex flex-wrap gap-2 px-6 py-4 z-10">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            leftIcon={tab.icon}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Create Event Tab */}
      {activeTab === 'create' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4">
            {editingId ? 'Edytuj Wydarzenie' : 'Nowe Wydarzenie'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <FormField label="Nazwa" required>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Nazwa wyprawy"
                />
              </FormField>
              <FormField label="Typ">
                <Select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="GÓRY">Góry</option>
                  <option value="INTEGRACJA">Integracja</option>
                  <option value="KULTURA">Kultura</option>
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Data Start" required>
                  <Input
                    type="date"
                    value={newEvent.dateStart}
                    onChange={(e) => setNewEvent((p) => ({ ...p, dateStart: e.target.value }))}
                  />
                </FormField>
                <FormField label="Data Koniec">
                  <Input
                    type="date"
                    value={newEvent.dateEnd}
                    onChange={(e) => setNewEvent((p) => ({ ...p, dateEnd: e.target.value }))}
                  />
                </FormField>
              </div>
              <FormField label="Lokalizacja">
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))}
                />
              </FormField>
              <FormField label="Liczba miejsc">
                <Input
                  type="number"
                  value={newEvent.spots}
                  onChange={(e) => setNewEvent((p) => ({ ...p, spots: +e.target.value }))}
                />
              </FormField>
              {newEvent.type === 'GÓRY' && (
                <FormField label="Trudność">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNewEvent((p) => ({ ...p, difficulty: n }))}
                        className={`p-2 transition-colors ${
                          newEvent.difficulty >= n ? 'text-primary' : 'text-on-surface-variant/30'
                        }`}
                      >
                        <Star size={20} fill={newEvent.difficulty >= n ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </FormField>
              )}
              <FormField label="Organizator">
                <Input
                  value={newEvent.organizer}
                  onChange={(e) => setNewEvent((p) => ({ ...p, organizer: e.target.value }))}
                />
              </FormField>
              <FormField label="Opis" required>
                <Textarea
                  rows={8}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Markdown supported..."
                />
              </FormField>
              <FormField label="Dojazd">
                <Textarea
                  rows={3}
                  value={newEvent.transport}
                  onChange={(e) => setNewEvent((p) => ({ ...p, transport: e.target.value }))}
                />
              </FormField>
              <FormField label="Pogoda">
                <Textarea
                  rows={3}
                  value={newEvent.weatherInfo}
                  onChange={(e) => setNewEvent((p) => ({ ...p, weatherInfo: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="space-y-4">
              <FormField label="URL Obrazu">
                <Input
                  value={newEvent.image}
                  onChange={(e) => setNewEvent((p) => ({ ...p, image: e.target.value }))}
                  placeholder="/uploads/..."
                />
                <p className="text-[10px] text-on-surface-variant/50 mt-1">
                  Wybierz obraz z panelu Galerii i wklej URL
                </p>
              </FormField>
              <FormField label="Link do Mapy">
                <Input
                  value={newEvent.mapLink}
                  onChange={(e) => setNewEvent((p) => ({ ...p, mapLink: e.target.value }))}
                />
              </FormField>
              <FormField label="Embed Mapy">
                <Textarea
                  rows={3}
                  value={newEvent.mapEmbed}
                  onChange={(e) => setNewEvent((p) => ({ ...p, mapEmbed: e.target.value }))}
                />
              </FormField>
              <FormField label="Miejsce Zbiórki">
                <Input
                  value={newEvent.meetingPointName}
                  onChange={(e) => setNewEvent((p) => ({ ...p, meetingPointName: e.target.value }))}
                />
              </FormField>
              <FormField label="Link Zbiórki">
                <Input
                  value={newEvent.meetingPointLink}
                  onChange={(e) => setNewEvent((p) => ({ ...p, meetingPointLink: e.target.value }))}
                />
              </FormField>

              {/* Planned stats */}
              <div className="grid grid-cols-3 gap-2">
                <FormField label="Dyst. (km)">
                  <Input
                    type="number"
                    value={newEvent.plannedDistance}
                    onChange={(e) => setNewEvent((p) => ({ ...p, plannedDistance: e.target.value }))}
                  />
                </FormField>
                <FormField label="Wznios. (m)">
                  <Input
                    type="number"
                    value={newEvent.plannedElevation}
                    onChange={(e) => setNewEvent((p) => ({ ...p, plannedElevation: e.target.value }))}
                  />
                </FormField>
                <FormField label="Czas (min)">
                  <Input
                    type="number"
                    value={newEvent.plannedDuration}
                    onChange={(e) => setNewEvent((p) => ({ ...p, plannedDuration: e.target.value }))}
                  />
                </FormField>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-4">
                <Checkbox
                  label="Ekspedycja"
                  checked={newEvent.isExpedition}
                  onChange={(e) => setNewEvent((p) => ({ ...p, isExpedition: e.target.checked }))}
                />
                <Checkbox
                  label="Wyróżnione (osiągnięcia)"
                  checked={newEvent.highlighted}
                  onChange={(e) => setNewEvent((p) => ({ ...p, highlighted: e.target.checked }))}
                />
                <Checkbox
                  label="Polecane (featured)"
                  checked={newEvent.featured}
                  onChange={(e) => setNewEvent((p) => ({ ...p, featured: e.target.checked }))}
                />
                <Checkbox
                  label="Szkic"
                  checked={newEvent.isDraft}
                  onChange={(e) => setNewEvent((p) => ({ ...p, isDraft: e.target.checked }))}
                />
              </div>

              {/* Gear */}
              <div className="pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  Wymagany Sprzęt (krytyczny)
                </p>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {ALL_HARDWARE.map((item) => (
                    <Checkbox
                      key={`crit-${item}`}
                      label={item}
                      checked={newEvent.gearCritical.includes(item)}
                      onChange={(e) =>
                        setNewEvent((p) => ({
                          ...p,
                          gearCritical: e.target.checked
                            ? [...p.gearCritical, item]
                            : p.gearCritical.filter((g) => g !== item),
                        }))
                      }
                    />
                  ))}
                </div>

                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3 mt-4">
                  Sugerowany Sprzęt
                </p>
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                  {ALL_HARDWARE.map((item) => (
                    <Checkbox
                      key={`sugg-${item}`}
                      label={item}
                      checked={newEvent.gearRequired.includes(item)}
                      onChange={(e) =>
                        setNewEvent((p) => ({
                          ...p,
                          gearRequired: e.target.checked
                            ? [...p.gearRequired, item]
                            : p.gearRequired.filter((g) => g !== item),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button variant="secondary" onClick={() => handleCreateOrUpdate(true)} isLoading={loading}>
              Zapisz Szkic
            </Button>
            <Button variant="primary" onClick={() => handleCreateOrUpdate(false)} isLoading={loading}>
              Opublikuj
            </Button>
            {editingId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setNewEvent({ ...EMPTY_EVENT });
                }}
              >
                Anuluj edycję
              </Button>
            )}
          </div>
        </div>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6">Zarządzanie Wydarzeniami</h2>
          {eventsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-lg uppercase truncate">{event.title}</p>
                    <div className="flex gap-3 mt-1">
                      <Badge variant={event.isDraft ? 'warning' : 'success'}>
                        {event.isDraft ? 'Szkic' : 'Publiczne'}
                      </Badge>
                      <Badge variant="secondary">{event.type}</Badge>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(event.dateStart).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const dateStart = event.dateStart
                          ? new Date(event.dateStart).toISOString().split('T')[0]
                          : '';
                        const dateEnd = event.dateEnd
                          ? new Date(event.dateEnd).toISOString().split('T')[0]
                          : '';
                        setNewEvent({ ...EMPTY_EVENT, ...event, dateStart, dateEnd });
                        setEditingId(event.id);
                        setActiveTab('create');
                      }}
                    >
                      Edytuj
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        if (window.confirm('Usunąć wydarzenie?')) {
                          await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
                          fetchEvents();
                        }
                      }}
                    >
                      Usuń
                    </Button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center py-12 text-on-surface-variant">Brak wydarzeń.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* GPX Tab */}
      {activeTab === 'gpx' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6">Kolejka GPX</h2>
          <div className="space-y-4">
            {gpxQueue.length === 0 && (
              <p className="text-on-surface-variant text-center py-12">Kolejka pusta.</p>
            )}
            {gpxQueue.map((item) => (
              <div
                key={item.id}
                className="p-6 bg-surface-container-low border border-outline-variant/20"
              >
                <p className="font-display font-black text-xl uppercase mb-2">
                  {item.event?.title || 'Brak wydarzenia'}
                </p>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                  <span>Dystans: {item.distance}km</span>
                  <span>Wznios: {item.elevationGain}m</span>
                  <span>Label: {item.label || '-'}</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      await fetch(`/api/gpx/${item.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'APPROVED' }) });
                      fetchGpxQueue();
                    }}
                  >
                    Zatwierdź
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      await fetch(`/api/gpx/${item.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'REJECTED' }) });
                      fetchGpxQueue();
                    }}
                  >
                    Odrzuć
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wiki Tab */}
      {activeTab === 'wiki' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4">
            {editingWikiId ? 'Edytuj Artykuł' : 'Nowy Artykuł'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <FormField label="Tytuł" required>
                <Input
                  value={newWikiArticle.title}
                  onChange={(e) => setNewWikiArticle((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Tytuł artykułu"
                />
              </FormField>
              <FormField label="Kategoria">
                <Select
                  value={newWikiArticle.category}
                  onChange={(e) => setNewWikiArticle((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="Poradnik">Poradnik</option>
                  <option value="Recenzja">Recenzja</option>
                  <option value="Artykuł">Artykuł</option>
                </Select>
              </FormField>
              <FormField label="Autor">
                <Input
                  value={newWikiArticle.authorName}
                  onChange={(e) => setNewWikiArticle((p) => ({ ...p, authorName: e.target.value }))}
                  placeholder="Imię i nazwisko"
                />
              </FormField>
              <FormField label="Tagi (rozdzielone przecinkami)">
                <Input
                  value={newWikiArticle.tags.join(', ')}
                  onChange={(e) =>
                    setNewWikiArticle((p) => ({ ...p, tags: e.target.value.split(',').map((t) => t.trim()) }))
                  }
                  placeholder="tag1, tag2, tag3"
                />
              </FormField>
            </div>
            <div className="space-y-4">
              <FormField label="Treść" required>
                <Textarea
                  rows={12}
                  value={newWikiArticle.content}
                  onChange={(e) => setNewWikiArticle((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Markdown supported..."
                />
              </FormField>
            </div>
          </div>
          <div className="flex gap-4 mb-12">
            <Button variant="primary" onClick={() => handleCreateOrUpdateWiki()} isLoading={loading}>
              Zapisz
            </Button>
            {editingWikiId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingWikiId(null);
                  setNewWikiArticle({
                    title: '',
                    category: 'Poradnik',
                    content: '',
                    tags: [],
                    authorName: '',
                  });
                }}
              >
                Anuluj edycję
              </Button>
            )}
          </div>

          <h2 className="font-display font-black text-2xl uppercase mb-6">Artykuły</h2>
          {wikiLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-2">
              {wikiArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-lg uppercase truncate">{article.title}</p>
                    <div className="flex gap-3 mt-1">
                      <Badge variant="secondary">{article.category}</Badge>
                      <span className="text-[10px] text-on-surface-variant">by {article.authorName}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewWikiArticle(article);
                        setEditingWikiId(article.id);
                      }}
                    >
                      Edytuj
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        if (window.confirm('Usunąć artykuł?')) {
                          await fetch(`/api/wiki/${article.id}`, { method: 'DELETE' });
                          fetchWikiArticles();
                        }
                      }}
                    >
                      Usuń
                    </Button>
                  </div>
                </div>
              ))}
              {wikiArticles.length === 0 && (
                <p className="text-center py-12 text-on-surface-variant">Brak artykułów.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4">
            {editingNewsId ? 'Edytuj Aktualność' : 'Nowa Aktualność'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <FormField label="Tytuł" required>
                <Input
                  value={newNewsItem.title}
                  onChange={(e) => setNewNewsItem((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Tytuł aktualności"
                />
              </FormField>
              <FormField label="Typ">
                <Select
                  value={newNewsItem.type}
                  onChange={(e) => setNewNewsItem((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="GENERAL">Ogólne</option>
                  <option value="ALERT">Ostrzeżenie</option>
                  <option value="ANNOUNCEMENT">Ogłoszenie</option>
                </Select>
              </FormField>
            </div>
            <div className="space-y-4">
              <FormField label="Treść" required>
                <Textarea
                  rows={12}
                  value={newNewsItem.content}
                  onChange={(e) => setNewNewsItem((p) => ({ ...p, content: e.target.value }))}
                  placeholder="Markdown supported..."
                />
              </FormField>
            </div>
          </div>
          <div className="flex gap-4 mb-12">
            <Button variant="primary" onClick={() => handleCreateOrUpdateNews()} isLoading={loading}>
              Zapisz
            </Button>
            {editingNewsId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingNewsId(null);
                  setNewNewsItem({ title: '', content: '', type: 'GENERAL' });
                }}
              >
                Anuluj edycję
              </Button>
            )}
          </div>

          <h2 className="font-display font-black text-2xl uppercase mb-6">Aktualności</h2>
          {newsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-2">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/20"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-black text-lg uppercase truncate">{item.title}</p>
                    <div className="flex gap-3 mt-1">
                      <Badge variant="secondary">{item.type}</Badge>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(item.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewNewsItem(item);
                        setEditingNewsId(item.id);
                      }}
                    >
                      Edytuj
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={async () => {
                        if (window.confirm('Usunąć aktualność?')) {
                          await fetch(`/api/news/${item.id}`, { method: 'DELETE' });
                          fetchNews();
                        }
                      }}
                    >
                      Usuń
                    </Button>
                  </div>
                </div>
              ))}
              {news.length === 0 && (
                <p className="text-center py-12 text-on-surface-variant">Brak aktualności.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6">Członkowie</h2>
          <div className="space-y-2">
            {allUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-display font-black text-lg uppercase truncate">{user.email}</p>
                  <div className="flex gap-3 mt-1">
                    <Badge variant={user.role === 'ADMIN' ? 'success' : 'secondary'}>{user.role}</Badge>
                    <Badge variant={user.status === 'ACTIVE' ? 'success' : 'warning'}>{user.status}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
                      await fetch(`/api/users/${user.id}/role`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: newRole }),
                      });
                      fetchUsers();
                    }}
                  >
                    {user.role === 'ADMIN' ? 'Zdegraduj' : 'Promuj'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      if (window.confirm('Usunąć użytkownika?')) {
                        await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
                        fetchUsers();
                      }
                    }}
                  >
                    Usuń
                  </Button>
                </div>
              </div>
            ))}
            {allUsers.length === 0 && (
              <p className="text-center py-12 text-on-surface-variant">Brak użytkowników.</p>
            )}
          </div>
        </div>
      )}

      {/* Push Tab */}
      {activeTab === 'push' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6">Wyślij Powiadomienie</h2>
          <div className="max-w-2xl">
            <div className="space-y-4">
              <FormField label="Tytuł" required>
                <Input
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder="Tytuł powiadomienia"
                />
              </FormField>
              <FormField label="Wiadomość" required>
                <Textarea
                  rows={6}
                  value={pushMessage}
                  onChange={(e) => setPushMessage(e.target.value)}
                  placeholder="Treść wiadomości"
                />
              </FormField>
            </div>
            <Button
              variant="primary"
              className="mt-6"
              onClick={async () => {
                try {
                  await fetch('/api/push/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: pushTitle, message: pushMessage }),
                  });
                  setPushTitle('');
                  setPushMessage('');
                  alert('Powiadomienie wysłane!');
                } catch (e) {
                  console.error(e);
                  alert('Błąd wysyłania.');
                }
              }}
            >
              Wyślij
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
