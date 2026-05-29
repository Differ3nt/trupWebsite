'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Plus,
  List,
  UploadCloud,
  Book,
  FileText,
  User,
  Bell,
  Star,
  Trophy,
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
import { useUIStore } from '@/lib/store/ui';

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

export function AdminClient() {
  const { data: session, update: updateSession } = useSession();
  const { openConfirm } = useUIStore();
  const t = useTranslations('admin');
  const tTabs = useTranslations('admin.tabs');
  const tCommon = useTranslations('admin.common');
  const tEvents = useTranslations('admin.events');
  const tGpx = useTranslations('admin.gpx');
  const tWiki = useTranslations('admin.wikiAdmin');
  const tNews = useTranslations('admin.newsAdmin');
  const tMembers = useTranslations('admin.membersAdmin');
  const tPush = useTranslations('admin.pushAdmin');

  const TABS = [
    { id: 'create', label: tTabs('create'), icon: <Plus size={14} /> },
    { id: 'list', label: tTabs('list'), icon: <List size={14} /> },
    { id: 'gpx', label: tTabs('gpx'), icon: <UploadCloud size={14} /> },
    { id: 'wiki', label: tTabs('wiki'), icon: <Book size={14} /> },
    { id: 'news', label: tTabs('news'), icon: <FileText size={14} /> },
    { id: 'members', label: tTabs('members'), icon: <User size={14} /> },
    { id: 'push', label: tTabs('push'), icon: <Bell size={14} /> },
  ];

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

  // Warn user about unsaved changes in create form
  useEffect(() => {
    const isFormDirty = activeTab === 'create' && newEvent.title !== '';
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTab, newEvent.title]);

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
        toast.error(tCommon('saveError'));
      }
    } catch (e) {
      console.error(e);
      toast.error(tCommon('saveError'));
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
          category: tWiki('categoryGuide'),
          content: '',
          tags: [],
          authorName: '',
        });
        setEditingWikiId(null);
        fetchWikiArticles();
      } else {
        toast.error(tCommon('saveError'));
      }
    } catch (e) {
      console.error(e);
      toast.error(tCommon('saveError'));
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
        toast.error(tCommon('saveError'));
      }
    } catch (e) {
      console.error(e);
      toast.error(tCommon('saveError'));
    } finally {
      setLoading(false);
    }
  }

  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleMakeAdmin = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch('/api/auth/make-admin', { method: 'POST' });
      if (res.ok) {
        await updateSession();
        window.location.reload();
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  // Bootstrap banner: show only when the user is not yet an admin
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="mt-12 flex items-center justify-center min-h-[40vh]">
        <div className="max-w-md w-full border border-primary/30 bg-surface-container-low p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <User size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="font-display font-black text-3xl uppercase tracking-tighter text-on-surface mb-3">
              {t('bootstrap.title')}
            </h2>
            <p className="text-sm text-on-surface-variant">
              {t('bootstrap.description')}
            </p>
          </div>
          <Button
            onClick={handleMakeAdmin}
            isLoading={isUpgrading}
            disabled={isUpgrading}
            size="lg"
          >
            {t('bootstrap.button')}
          </Button>
        </div>
      </div>
    );
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
            {editingId ? tEvents('editTitle') : tEvents('sectionTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <FormField label={tEvents('nameLabel')} required>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent((p) => ({ ...p, title: e.target.value }))}
                  placeholder={tEvents('namePlaceholder')}
                />
              </FormField>
              <FormField label={tEvents('typeLabel')}>
                <Select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="GÓRY">{tEvents('typeMountains')}</option>
                  <option value="INTEGRACJA">{tEvents('typeIntegration')}</option>
                  <option value="KULTURA">{tEvents('typeCulture')}</option>
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label={tEvents('dateStartLabel')} required>
                  <Input
                    type="date"
                    value={newEvent.dateStart}
                    onChange={(e) => setNewEvent((p) => ({ ...p, dateStart: e.target.value }))}
                  />
                </FormField>
                <FormField label={tEvents('dateEndLabel')}>
                  <Input
                    type="date"
                    value={newEvent.dateEnd}
                    onChange={(e) => setNewEvent((p) => ({ ...p, dateEnd: e.target.value }))}
                  />
                </FormField>
              </div>
              <FormField label={tEvents('locationLabel')}>
                <Input
                  value={newEvent.location}
                  onChange={(e) => setNewEvent((p) => ({ ...p, location: e.target.value }))}
                />
              </FormField>
              <FormField label={tEvents('spotsLabel')}>
                <Input
                  type="number"
                  value={newEvent.spots}
                  onChange={(e) => setNewEvent((p) => ({ ...p, spots: +e.target.value }))}
                />
              </FormField>
              {newEvent.type === 'GÓRY' && (
                <FormField label={tEvents('difficultyLabel')}>
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
              <FormField label={tEvents('organizerLabel')}>
                <Input
                  value={newEvent.organizer}
                  onChange={(e) => setNewEvent((p) => ({ ...p, organizer: e.target.value }))}
                />
              </FormField>
              <FormField label={tEvents('descriptionLabel')} required>
                <Textarea
                  rows={8}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))}
                  placeholder={tEvents('descriptionPlaceholder')}
                />
              </FormField>
              <FormField label={tEvents('transportLabel')}>
                <Textarea
                  rows={3}
                  value={newEvent.transport}
                  onChange={(e) => setNewEvent((p) => ({ ...p, transport: e.target.value }))}
                />
              </FormField>
              <FormField label={tEvents('weatherLabel')}>
                <Textarea
                  rows={3}
                  value={newEvent.weatherInfo}
                  onChange={(e) => setNewEvent((p) => ({ ...p, weatherInfo: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="space-y-4">
              <FormField label={tEvents('imageUrlLabel')}>
                <Input
                  value={newEvent.image}
                  onChange={(e) => setNewEvent((p) => ({ ...p, image: e.target.value }))}
                  placeholder={tEvents('imageUrlPlaceholder')}
                />
                <p className="text-[10px] text-on-surface-variant/50 mt-1">
                  {tEvents('imageUrlHint')}
                </p>
              </FormField>
              <FormField label={tEvents('mapLinkLabel')}>
                <Input
                  value={newEvent.mapLink}
                  onChange={(e) => setNewEvent((p) => ({ ...p, mapLink: e.target.value }))}
                />
              </FormField>
              <FormField label={tEvents('mapEmbedLabel')}>
                <Textarea
                  rows={3}
                  value={newEvent.mapEmbed}
                  onChange={(e) => setNewEvent((p) => ({ ...p, mapEmbed: e.target.value }))}
                />
              </FormField>
              <FormField label={tEvents('meetingPointLabel')}>
                <Input
                  value={newEvent.meetingPointName}
                  onChange={(e) => setNewEvent((p) => ({ ...p, meetingPointName: e.target.value }))}
                />
              </FormField>
              <FormField label={tEvents('meetingPointLinkLabel')}>
                <Input
                  value={newEvent.meetingPointLink}
                  onChange={(e) => setNewEvent((p) => ({ ...p, meetingPointLink: e.target.value }))}
                />
              </FormField>

              {/* Planned stats */}
              <div className="grid grid-cols-3 gap-2">
                <FormField label={tEvents('plannedDistanceLabel')}>
                  <Input
                    type="number"
                    value={newEvent.plannedDistance}
                    onChange={(e) => setNewEvent((p) => ({ ...p, plannedDistance: e.target.value }))}
                  />
                </FormField>
                <FormField label={tEvents('plannedElevationLabel')}>
                  <Input
                    type="number"
                    value={newEvent.plannedElevation}
                    onChange={(e) => setNewEvent((p) => ({ ...p, plannedElevation: e.target.value }))}
                  />
                </FormField>
                <FormField label={tEvents('plannedDurationLabel')}>
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
                  label={tEvents('expeditionCheckbox')}
                  checked={newEvent.isExpedition}
                  onChange={(e) => setNewEvent((p) => ({ ...p, isExpedition: e.target.checked }))}
                />
                <Checkbox
                  label={tEvents('highlightedCheckbox')}
                  checked={newEvent.highlighted}
                  onChange={(e) => setNewEvent((p) => ({ ...p, highlighted: e.target.checked }))}
                />
                <Checkbox
                  label={tEvents('featuredCheckbox')}
                  checked={newEvent.featured}
                  onChange={(e) => setNewEvent((p) => ({ ...p, featured: e.target.checked }))}
                />
                <Checkbox
                  label={tEvents('draftCheckbox')}
                  checked={newEvent.isDraft}
                  onChange={(e) => setNewEvent((p) => ({ ...p, isDraft: e.target.checked }))}
                />
              </div>

              {/* Gear — 3-state toggle: none → Warto mieć → Trzeba mieć → none */}
              <div className="pt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-3">
                  {tEvents('gearLabel')}
                </p>
                <div className="grid grid-cols-2 gap-1 max-h-52 overflow-y-auto">
                  {ALL_HARDWARE.map((item) => {
                    const isCritical = newEvent.gearCritical.includes(item);
                    const isRequired = newEvent.gearRequired.includes(item);
                    const state: 'critical' | 'required' | 'none' = isCritical ? 'critical' : isRequired ? 'required' : 'none';
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (state === 'none') {
                            setNewEvent((p) => ({ ...p, gearRequired: [...p.gearRequired, item] }));
                          } else if (state === 'required') {
                            setNewEvent((p) => ({
                              ...p,
                              gearRequired: p.gearRequired.filter((g) => g !== item),
                              gearCritical: [...p.gearCritical, item],
                            }));
                          } else {
                            setNewEvent((p) => ({ ...p, gearCritical: p.gearCritical.filter((g) => g !== item) }));
                          }
                        }}
                        className={`text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center justify-between gap-1 ${
                          state === 'critical'
                            ? 'border-error/60 bg-error/10 text-error'
                            : state === 'required'
                              ? 'border-primary/60 bg-primary/10 text-primary'
                              : 'border-outline-variant/20 text-on-surface-variant/60 hover:border-outline-variant/50 hover:text-on-surface-variant'
                        }`}
                      >
                        <span className="truncate">{item}</span>
                        {state !== 'none' && (
                          <span className="text-[8px] flex-shrink-0 font-black">
                            {state === 'critical' ? tEvents('gearCriticalBadge') : tEvents('gearRequiredBadge')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button variant="secondary" onClick={() => handleCreateOrUpdate(true)} isLoading={loading}>
              {tEvents('saveDraftButton')}
            </Button>
            <Button variant="primary" onClick={() => handleCreateOrUpdate(false)} isLoading={loading}>
              {tEvents('publishButton')}
            </Button>
            {editingId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingId(null);
                  setNewEvent({ ...EMPTY_EVENT });
                }}
              >
                {tEvents('cancelEditButton')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6">{tEvents('manageSectionTitle')}</h2>
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
                        {event.isDraft ? tEvents('draftStatusBadge') : tEvents('publicStatusBadge')}
                      </Badge>
                      <Badge variant="secondary">{event.type}</Badge>
                      <span className="text-[10px] text-on-surface-variant">
                        {new Date(event.dateStart).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      title={tEvents('featuredToggleTitle')}
                      onClick={async () => {
                        const updated = { featured: !event.featured };
                        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, ...updated } : e));
                        await fetch(`/api/events/${event.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
                      }}
                      className={`p-1.5 border transition-colors ${event.featured ? 'border-primary text-primary' : 'border-outline-variant/30 text-on-surface-variant/40 hover:border-primary/50 hover:text-primary/60'}`}
                    >
                      <Star size={14} fill={event.featured ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      title={tEvents('highlightedToggleTitle')}
                      onClick={async () => {
                        const updated = { highlighted: !event.highlighted };
                        setEvents(prev => prev.map(e => e.id === event.id ? { ...e, ...updated } : e));
                        await fetch(`/api/events/${event.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
                      }}
                      className={`p-1.5 border transition-colors ${event.highlighted ? 'border-yellow-500 text-yellow-500' : 'border-outline-variant/30 text-on-surface-variant/40 hover:border-yellow-500/50 hover:text-yellow-500/60'}`}
                    >
                      <Trophy size={14} fill={event.highlighted ? 'currentColor' : 'none'} />
                    </button>
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
                      {tEvents('editButton')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        openConfirm({
                          title: tEvents('deleteConfirmTitle'),
                          message: tEvents('deleteConfirmMessage'),
                          variant: 'danger',
                          onConfirm: () => {
                            // Optimistically remove
                            const deletedEvent = event;
                            setEvents(prev => prev.filter(e => e.id !== event.id));

                            let cancelled = false;
                            const undoTimeout = setTimeout(async () => {
                              if (cancelled) return;
                              try {
                                await fetch(`/api/events/${event.id}`, { method: 'DELETE' });
                              } catch (e) {
                                console.error(e);
                                // restore on failure
                                setEvents(prev => [...prev, deletedEvent].sort((a, b) =>
                                  new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
                                ));
                                toast.error(tCommon('deleteError'));
                              }
                            }, 6000);

                            toast.success(tCommon('deleteSuccess'), {
                              duration: 6000,
                              action: {
                                label: tCommon('undoButton'),
                                onClick: () => {
                                  cancelled = true;
                                  clearTimeout(undoTimeout);
                                  setEvents(prev => [...prev, deletedEvent].sort((a, b) =>
                                    new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
                                  ));
                                }
                              }
                            });
                          }
                        });
                      }}
                    >
                      {tEvents('deleteButton')}
                    </Button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center py-12 text-on-surface-variant">{tCommon('noEvents')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* GPX Tab */}
      {activeTab === 'gpx' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6">{tGpx('sectionTitle')}</h2>
          <div className="space-y-4">
            {gpxQueue.length === 0 && (
              <p className="text-on-surface-variant text-center py-12">{tCommon('emptyQueue')}</p>
            )}
            {gpxQueue.map((item) => (
              <div
                key={item.id}
                className="p-6 bg-surface-container-low border border-outline-variant/20"
              >
                <p className="font-display font-black text-xl uppercase mb-2">
                  {item.event?.title || tGpx('noEvent')}
                </p>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                  <span>{tGpx('distanceLabel')} {item.distance}km</span>
                  <span>{tGpx('elevationLabel')} {item.elevationGain}m</span>
                  <span>{tGpx('labelLabel')} {item.label || '-'}</span>
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
                    {tGpx('approveButton')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      await fetch(`/api/gpx/${item.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'REJECTED' }) });
                      fetchGpxQueue();
                    }}
                  >
                    {tGpx('rejectButton')}
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
            {editingWikiId ? tWiki('editTitle') : tWiki('sectionTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <FormField label={tWiki('titleLabel')} required>
                <Input
                  value={newWikiArticle.title}
                  onChange={(e) => setNewWikiArticle((p) => ({ ...p, title: e.target.value }))}
                  placeholder={tWiki('titlePlaceholder')}
                />
              </FormField>
              <FormField label={tWiki('categoryLabel')}>
                <Select
                  value={newWikiArticle.category}
                  onChange={(e) => setNewWikiArticle((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="Poradnik">{tWiki('categoryGuide')}</option>
                  <option value="Recenzja">{tWiki('categoryReview')}</option>
                  <option value="Artykuł">{tWiki('categoryArticle')}</option>
                </Select>
              </FormField>
              <FormField label={tWiki('authorLabel')}>
                <Input
                  value={newWikiArticle.authorName}
                  onChange={(e) => setNewWikiArticle((p) => ({ ...p, authorName: e.target.value }))}
                  placeholder={tWiki('authorPlaceholder')}
                />
              </FormField>
              <FormField label={tWiki('tagsLabel')}>
                <Input
                  value={newWikiArticle.tags.join(', ')}
                  onChange={(e) =>
                    setNewWikiArticle((p) => ({ ...p, tags: e.target.value.split(',').map((t) => t.trim()) }))
                  }
                  placeholder={tWiki('tagsPlaceholder')}
                />
              </FormField>
            </div>
            <div className="space-y-4">
              <FormField label={tWiki('contentLabel')} required>
                <Textarea
                  rows={12}
                  value={newWikiArticle.content}
                  onChange={(e) => setNewWikiArticle((p) => ({ ...p, content: e.target.value }))}
                  placeholder={tWiki('contentPlaceholder')}
                />
              </FormField>
            </div>
          </div>
          <div className="flex gap-4 mb-12">
            <Button variant="primary" onClick={() => handleCreateOrUpdateWiki()} isLoading={loading}>
              {tWiki('saveButton')}
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
                {tWiki('cancelEditButton')}
              </Button>
            )}
          </div>

          <h2 className="font-display font-black text-2xl uppercase mb-6">{tWiki('articlesHeading')}</h2>
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
                      <span className="text-[10px] text-on-surface-variant">{tWiki('byAuthor')} {article.authorName}</span>
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
                      {tWiki('editButton')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        openConfirm({
                          title: tWiki('deleteConfirmTitle'),
                          message: tWiki('deleteConfirmMessage'),
                          variant: 'danger',
                          onConfirm: () => {
                            // Optimistically remove
                            const deletedArticle = article;
                            setWikiArticles(prev => prev.filter(a => a.id !== article.id));

                            let cancelled = false;
                            const undoTimeout = setTimeout(async () => {
                              if (cancelled) return;
                              try {
                                await fetch(`/api/wiki/${article.id}`, { method: 'DELETE' });
                              } catch (e) {
                                console.error(e);
                                // restore on failure
                                setWikiArticles(prev => [...prev, deletedArticle]);
                                toast.error(tCommon('deleteError'));
                              }
                            }, 6000);

                            toast.success(tCommon('deleteSuccess'), {
                              duration: 6000,
                              action: {
                                label: tCommon('undoButton'),
                                onClick: () => {
                                  cancelled = true;
                                  clearTimeout(undoTimeout);
                                  setWikiArticles(prev => [...prev, deletedArticle]);
                                }
                              }
                            });
                          }
                        });
                      }}
                    >
                      {tWiki('deleteButton')}
                    </Button>
                  </div>
                </div>
              ))}
              {wikiArticles.length === 0 && (
                <p className="text-center py-12 text-on-surface-variant">{tCommon('noArticles')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6 border-b border-outline-variant/30 pb-4">
            {editingNewsId ? tNews('editTitle') : tNews('sectionTitle')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <FormField label={tNews('titleLabel')} required>
                <Input
                  value={newNewsItem.title}
                  onChange={(e) => setNewNewsItem((p) => ({ ...p, title: e.target.value }))}
                  placeholder={tNews('titlePlaceholder')}
                />
              </FormField>
              <FormField label={tNews('typeLabel')}>
                <Select
                  value={newNewsItem.type}
                  onChange={(e) => setNewNewsItem((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="GENERAL">{tNews('typeGeneral')}</option>
                  <option value="ALERT">{tNews('typeAlert')}</option>
                  <option value="ANNOUNCEMENT">{tNews('typeAnnouncement')}</option>
                </Select>
              </FormField>
            </div>
            <div className="space-y-4">
              <FormField label={tNews('contentLabel')} required>
                <Textarea
                  rows={12}
                  value={newNewsItem.content}
                  onChange={(e) => setNewNewsItem((p) => ({ ...p, content: e.target.value }))}
                  placeholder={tNews('contentPlaceholder')}
                />
              </FormField>
            </div>
          </div>
          <div className="flex gap-4 mb-12">
            <Button variant="primary" onClick={() => handleCreateOrUpdateNews()} isLoading={loading}>
              {tNews('saveButton')}
            </Button>
            {editingNewsId && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingNewsId(null);
                  setNewNewsItem({ title: '', content: '', type: 'GENERAL' });
                }}
              >
                {tNews('cancelEditButton')}
              </Button>
            )}
          </div>

          <h2 className="font-display font-black text-2xl uppercase mb-6">{tNews('newsHeading')}</h2>
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
                      {tNews('editButton')}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        openConfirm({
                          title: tNews('deleteConfirmTitle'),
                          message: tNews('deleteConfirmMessage'),
                          variant: 'danger',
                          onConfirm: () => {
                            // Optimistically remove
                            const deletedNews = item;
                            setNews(prev => prev.filter(n => n.id !== item.id));

                            let cancelled = false;
                            const undoTimeout = setTimeout(async () => {
                              if (cancelled) return;
                              try {
                                await fetch(`/api/news/${item.id}`, { method: 'DELETE' });
                              } catch (e) {
                                console.error(e);
                                // restore on failure
                                setNews(prev => [...prev, deletedNews].sort((a, b) =>
                                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                ));
                                toast.error(tCommon('deleteError'));
                              }
                            }, 6000);

                            toast.success(tCommon('deleteSuccess'), {
                              duration: 6000,
                              action: {
                                label: tCommon('undoButton'),
                                onClick: () => {
                                  cancelled = true;
                                  clearTimeout(undoTimeout);
                                  setNews(prev => [...prev, deletedNews].sort((a, b) =>
                                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                  ));
                                }
                              }
                            });
                          }
                        });
                      }}
                    >
                      {tNews('deleteButton')}
                    </Button>
                  </div>
                </div>
              ))}
              {news.length === 0 && (
                <p className="text-center py-12 text-on-surface-variant">{tCommon('noNews')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6">{tMembers('heading')}</h2>
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
                    {user.role === 'ADMIN' ? tMembers('demoteButton') : tMembers('promoteButton')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      openConfirm({
                        title: tMembers('deleteConfirmTitle'),
                        message: tMembers('deleteConfirmMessage'),
                        variant: 'danger',
                        onConfirm: () => {
                          // Optimistically remove
                          const deletedUser = user;
                          setAllUsers(prev => prev.filter(u => u.id !== user.id));

                          let cancelled = false;
                          const undoTimeout = setTimeout(async () => {
                            if (cancelled) return;
                            try {
                              await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
                            } catch (e) {
                              console.error(e);
                              // restore on failure
                              setAllUsers(prev => [...prev, deletedUser]);
                              toast.error(tCommon('deleteError'));
                            }
                          }, 6000);

                          toast.success(tCommon('deleteSuccess'), {
                            duration: 6000,
                            action: {
                              label: tCommon('undoButton'),
                              onClick: () => {
                                cancelled = true;
                                clearTimeout(undoTimeout);
                                setAllUsers(prev => [...prev, deletedUser]);
                              }
                            }
                          });
                        }
                      });
                    }}
                  >
                    {tMembers('deleteButton')}
                  </Button>
                </div>
              </div>
            ))}
            {allUsers.length === 0 && (
              <p className="text-center py-12 text-on-surface-variant">{tCommon('noUsers')}</p>
            )}
          </div>
        </div>
      )}

      {/* Push Tab */}
      {activeTab === 'push' && (
        <div className="px-6 py-8">
          <h2 className="font-display font-black text-2xl uppercase mb-6">{tPush('heading')}</h2>
          <div className="max-w-2xl">
            <div className="space-y-4">
              <FormField label={tPush('titleLabel')} required>
                <Input
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  placeholder={tPush('titlePlaceholder')}
                />
              </FormField>
              <FormField label={tPush('messageLabel')} required>
                <Textarea
                  rows={6}
                  value={pushMessage}
                  onChange={(e) => setPushMessage(e.target.value)}
                  placeholder={tPush('messagePlaceholder')}
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
                  toast.success(tPush('sendSuccess'));
                } catch (e) {
                  console.error(e);
                  toast.error(tPush('sendError'));
                }
              }}
            >
              {tPush('sendButton')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
