'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FileText } from '@/components/icons';
import { AuthGate } from '@/components/ui/AuthGate';
import { EmptyState } from '@/components/states/EmptyState';
import { Button } from '@/components/ui/Button';

interface NewsItemData {
  id: string;
  title: string;
  content: string | null;
  type: string;
  priority: number | null;
  createdAt: Date;
  updatedAt: Date;
  link?: string | null;
  imageUrl?: string | null;
  eventId?: string | null;
  articleId?: string | null;
}

interface NewsSectionProps {
  items: NewsItemData[];
}

export function NewsSection({ items }: NewsSectionProps) {
  const t = useTranslations('home');
  const [visibleCount, setVisibleCount] = useState(3);

  if (items.length === 0) {
    return (
      <AuthGate message={t('newsAuthMessage')}>
        <EmptyState
          icon={<FileText size={48} />}
          title={t('newsEmpty')}
          description={t('newsEmptyDesc')}
        />
      </AuthGate>
    );
  }

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <AuthGate message={t('newsAuthMessage')}>
      <div className="space-y-6">
        {visibleItems.map((item) => (
          <div key={item.id} className="border-b border-outline-variant/20 pb-6 last:border-b-0 last:pb-0">
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {item.type || t('news.defaultType')}
              </span>
              <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-widest">
                {new Date(item.createdAt).toLocaleDateString('pl-PL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            <h3 className="font-display font-black text-lg uppercase tracking-tight text-on-surface mb-2">
              {item.title}
            </h3>

            {item.content && (
              <p className="text-xs text-on-surface-variant leading-relaxed mb-3 line-clamp-2">
                {item.content}
              </p>
            )}

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-colors inline-block"
              >
                {t('news.readMore')}
              </a>
            )}
          </div>
        ))}

        {hasMore && (
          <div className="pt-6 flex justify-center">
            <Button
              onClick={() => setVisibleCount((prev) => prev + 3)}
              variant="secondary"
              size="sm"
              className="uppercase tracking-widest"
            >
              {t('news.showMore')}
            </Button>
          </div>
        )}

        <div className="pt-6 border-t border-outline-variant/20">
          <Link
            href="/aktualnosci"
            className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors inline-flex items-center gap-2"
          >
            {t('news.allNewsLink')}
          </Link>
        </div>
      </div>
    </AuthGate>
  );
}
