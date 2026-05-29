'use client';

import { useState, useEffect } from 'react';
import { X } from '@/components/icons';
import { useTranslations } from 'next-intl';

export function PwaBanner() {
  const t = useTranslations('pwa');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari when not already installed
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isInStandaloneMode =
      'standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true;
    const dismissed = localStorage.getItem('pwa-banner-dismissed') === '1';

    if (isIos && !isInStandaloneMode && !dismissed) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container border-t border-outline-variant/30 px-4 py-3 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-on-surface uppercase tracking-widest mb-0.5">
          {t('banner')}
        </p>
        <p className="text-[11px] text-on-surface-variant leading-snug">
          {t('instructions')}
        </p>
      </div>
      <button
        onClick={() => {
          localStorage.setItem('pwa-banner-dismissed', '1');
          setShow(false);
        }}
        aria-label={t('dismiss')}
        className="flex-shrink-0 p-1 text-on-surface-variant hover:text-on-surface transition-colors mt-0.5"
      >
        <X size={16} />
      </button>
    </div>
  );
}
