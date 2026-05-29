'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { FormField } from '@/components/ui/FormField';
import { Checkbox } from '@/components/ui/Checkbox';
import { Calendar, MapPin, Zap, Mountain, LogOut } from '@/components/icons';
import { cn } from '@/lib/utils';

// Hardware options are now loaded from translations

interface User {
  id: string;
  name: string | null;
  nickname: string | null;
  email: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  hardware: string[];
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'FLAGGED';
  createdAt: Date;
}

interface EventParticipation {
  event: {
    id: string;
    title: string;
    dateStart: Date;
    type: string;
    location: string | null;
  };
}

interface PersonalStats {
  distance: number;
  elevation: number;
  duration: number;
}

interface ProfileClientProps {
  user: User;
  personalStats: PersonalStats;
  participations: EventParticipation[];
}

export function ProfileClient({ user, personalStats, participations }: ProfileClientProps) {
  const session = useSession();
  const t = useTranslations('profile');
  const [tab, setTab] = useState<'overview' | 'settings'>('overview');

  const HARDWARE_OPTIONS = [
    t('hardware.backpack'),
    t('hardware.harness'),
    t('hardware.hikingBoots'),
    t('hardware.climbingBoots'),
    t('hardware.helmet'),
    t('hardware.crampons'),
    t('hardware.icePick'),
    t('hardware.rope'),
    t('hardware.carabiners'),
    t('hardware.tent'),
    t('hardware.stove'),
    t('hardware.gps'),
  ];

  // Settings form state
  const [name, setName] = useState(user.name || '');
  const [nickname, setNickname] = useState(user.nickname || '');
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [hardware, setHardware] = useState<string[]>(user.hardware || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleHardwareChange = (item: string) => {
    setHardware((prev) =>
      prev.includes(item) ? prev.filter((h) => h !== item) : [...prev, item]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          nickname: nickname || null,
          phoneNumber: phoneNumber || null,
          hardware,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      setSaveMessage({ type: 'success', text: t('settings.saveSuccess') });
    } catch (error) {
      setSaveMessage({ type: 'error', text: t('settings.saveError') });
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' });
  };

  const attendedCount = participations.filter((p) => p.event.dateStart < new Date()).length;
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pl-PL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.round(minutes / 60);
    return hours;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader title={t('pageTitle')} category={t('pageCategory')} />

      {/* Tab Navigation */}
      <div className="flex gap-8 mb-12 border-b border-outline-variant/30">
        <button
          onClick={() => setTab('overview')}
          className={cn(
            'inline-flex items-center gap-2 pb-4 font-bold uppercase tracking-widest text-sm transition-colors',
            tab === 'overview'
              ? 'text-primary border-b-2 border-primary -mb-1'
              : 'text-on-surface-variant border-b-2 border-transparent hover:text-on-surface'
          )}
        >
          {t('tabOverview')}
        </button>
        <button
          onClick={() => setTab('settings')}
          className={cn(
            'inline-flex items-center gap-2 pb-4 font-bold uppercase tracking-widest text-sm transition-colors',
            tab === 'settings'
              ? 'text-primary border-b-2 border-primary -mb-1'
              : 'text-on-surface-variant border-b-2 border-transparent hover:text-on-surface'
          )}
        >
          {t('tabSettings')}
        </button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-12">
          {/* User Info Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || 'Avatar'}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-surface-variant flex items-center justify-center">
                      <span className="text-2xl font-bold text-on-surface-variant">
                        {getInitials(user.name)}
                      </span>
                    </div>
                  )}
                </div>

                {/* User Details */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="font-display font-black text-3xl text-on-surface mb-1">
                      {user.name || t('defaultUserLabel')}
                    </h2>
                    {user.nickname && (
                      <p className="text-sm text-on-surface-variant">"{user.nickname}"</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={user.role === 'ADMIN' ? 'primary' : 'secondary'}>
                      {user.role === 'ADMIN' ? t('roleAdmin') : t('roleUser')}
                    </Badge>
                    <Badge variant={user.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {user.status === 'ACTIVE'
                        ? t('statusActive')
                        : user.status === 'INACTIVE'
                          ? t('statusInactive')
                          : t('statusFlagged')}
                    </Badge>
                  </div>

                  <div className="text-sm text-on-surface-variant space-y-1">
                    <p>
                      <strong>{t('emailLabel')}:</strong> {user.email}
                    </p>
                    {user.phoneNumber && (
                      <p>
                        <strong>{t('phoneLabel')}:</strong> {user.phoneNumber}
                      </p>
                    )}
                    <p>
                      <strong>{t('joinedLabel')}:</strong>{' '}
                      {new Date(user.createdAt).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Stats */}
          <div>
            <h3 className="font-display font-black text-2xl uppercase tracking-tighter text-on-surface mb-6">
              {t('stats.heading')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="overflow-hidden">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <Mountain className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    {t('stats.distance')}
                  </p>
                  <p className="font-display font-black text-2xl text-on-surface">
                    {personalStats.distance.toFixed(1)} <span className="text-sm">{t('stats.kmUnit')}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    {t('stats.elevation')}
                  </p>
                  <p className="font-display font-black text-2xl text-on-surface">
                    {Math.round(personalStats.elevation)} <span className="text-sm">{t('stats.mUnit')}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    {t('stats.time')}
                  </p>
                  <p className="font-display font-black text-2xl text-on-surface">
                    {formatDuration(personalStats.duration)} <span className="text-sm">{t('stats.hUnit')}</span>
                  </p>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    {t('stats.expeditions')}
                  </p>
                  <p className="font-display font-black text-2xl text-on-surface">
                    {attendedCount}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Events Attended */}
          <div>
            <h3 className="font-display font-black text-2xl uppercase tracking-tighter text-on-surface mb-6">
              {t('events.heading')}
            </h3>

            {participations.length === 0 ? (
              <Card className="overflow-hidden">
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                  <p className="text-on-surface-variant">{t('events.emptyState')}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {participations.map((participation) => (
                  <Link
                    key={participation.event.id}
                    href={`/wydarzenia/${participation.event.id}`}
                  >
                    <Card className="overflow-hidden hover:border-primary transition-colors cursor-pointer">
                      <CardContent className="p-6 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                              {formatDate(participation.event.dateStart)}
                            </span>
                            <Badge variant="outline">{participation.event.type}</Badge>
                          </div>
                          <h4 className="font-bold text-on-surface mb-1">
                            {participation.event.title}
                          </h4>
                          {participation.event.location && (
                            <p className="text-xs text-on-surface-variant flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {participation.event.location}
                            </p>
                          )}
                        </div>
                        <span className="text-primary font-bold text-xs ml-4">→</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Personal Info */}
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-black text-2xl uppercase tracking-tighter text-on-surface mb-6">
                  {t('settings.personalInfo')}
                </h3>

                <FormField label={t('settings.nameLabel')} required>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('settings.namePlaceholder')}
                  />
                </FormField>

                <FormField label={t('settings.nicknameLabel')} className="mt-4">
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={t('settings.nicknamePlaceholder')}
                  />
                </FormField>

                <FormField label={t('settings.phoneLabel')} className="mt-4">
                  <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('settings.phonePlaceholder')}
                    type="tel"
                  />
                </FormField>

                <FormField label={t('settings.emailLabel')} className="mt-4">
                  <Input value={user.email} disabled />
                </FormField>
              </div>
            </div>

            {/* Right Column: Hardware */}
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-black text-2xl uppercase tracking-tighter text-on-surface mb-6">
                  {t('settings.hardware')}
                </h3>

                <div className="space-y-3">
                  {HARDWARE_OPTIONS.map((item) => (
                    <label key={item} className="flex items-start gap-3 cursor-pointer group">
                      <Checkbox
                        checked={hardware.includes(item)}
                        onChange={() => handleHardwareChange(item)}
                        id={`hardware-${item}`}
                      />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors select-none mt-0.5">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save Messages */}
          {saveMessage && (
            <div
              className={cn(
                'p-4 rounded text-sm font-bold uppercase tracking-widest',
                saveMessage.type === 'success'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-error/10 text-error'
              )}
            >
              {saveMessage.text}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              disabled={isSaving}
              size="lg"
              className="flex-1 sm:flex-initial"
            >
              {t('settings.saveButton')}
            </Button>
            <Button
              onClick={handleSignOut}
              variant="danger"
              size="lg"
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              {t('settings.signOutButton')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
