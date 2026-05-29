'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { Bell, X } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  url: string | null;
  isRead: boolean;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function NotificationDropdown() {
  const t = useTranslations('nav');
  const tN = useTranslations('notifications');
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data: notifications = [], mutate } = useSWR<Notification[]>('/api/push', fetcher, {
    refreshInterval: 60_000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on ESC
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/push/${id}/read`, { method: 'PATCH' });
    mutate();
  }

  async function dismiss(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await fetch(`/api/push/${id}`, { method: 'DELETE' });
    mutate();
  }

  function handleNotificationClick(n: Notification) {
    if (!n.isRead) markRead(n.id);
    if (n.url) window.location.href = n.url;
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((o) => !o)}
        aria-label={t('notifications')}
        className="relative p-2 text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-primary text-surface text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={tN('title')}
          className="absolute right-0 top-full mt-2 w-80 bg-surface-container border border-outline-variant/30 shadow-xl z-50 max-h-96 overflow-y-auto"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {tN('title')}
            </span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold text-primary">
                {unreadCount} {tN('unreadSuffix')}
              </span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-on-surface-variant text-sm">
              {tN('empty')}
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'group flex items-start gap-3 px-4 py-3 border-b border-outline-variant/10 last:border-0 cursor-pointer transition-colors',
                    n.isRead
                      ? 'hover:bg-surface-variant/20'
                      : 'bg-primary/5 hover:bg-primary/10'
                  )}
                >
                  {!n.isRead && (
                    <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                  <div className={cn('flex-1 min-w-0', n.isRead && 'pl-4')}>
                    <p className="text-xs font-bold text-on-surface truncate">{n.title}</p>
                    <p className="text-[11px] text-on-surface-variant leading-snug mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-on-surface-variant/60 mt-1">
                      {new Date(n.createdAt).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => dismiss(e, n.id)}
                    aria-label={tN('dismiss')}
                    className="flex-shrink-0 p-1 text-on-surface-variant/40 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
