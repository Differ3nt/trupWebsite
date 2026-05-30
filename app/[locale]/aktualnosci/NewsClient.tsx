'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { FileText, Trophy, Book, Zap } from '@/components/icons';
import { AuthGate } from '@/components/ui/AuthGate';
import { EmptyState } from '@/components/states/EmptyState';

// Pick the timeline icon by news type (mirrors legacy NewsCard).
function iconForType(type: string) {
  switch (type) {
    case 'EVENT':
      return Trophy;
    case 'ARTICLE':
      return Book;
    case 'ANNOUNCEMENT':
      return Zap;
    default:
      return FileText;
  }
}

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

interface NewsClientProps {
  news: NewsItemData[];
}

export function NewsClient({ news }: NewsClientProps) {
  const t = useTranslations('news');
  return (
    <AuthGate message={t('authMessage')}>
      {news.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title={t('empty')}
          description={t('emptyDesc')}
        />
      ) : (
        <div className="space-y-8">
          {news.map((item, index) => {
            const Icon = iconForType(item.type);
            return (
            <div key={item.id} className="flex gap-4 md:gap-8">
              {/* Timeline connector */}
              <div className="w-10 pt-1 flex flex-col items-center shrink-0">
                <div className="bg-surface-variant border border-outline-variant/30 p-2.5">
                  <Icon size={16} className="text-on-surface-variant" />
                </div>
                {/* Connector line - show on all except last */}
                {index < news.length - 1 && (
                  <div className="w-px flex-1 bg-outline-variant/20 mt-2" style={{ minHeight: '120px' }} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className="bg-surface-container-low border border-outline-variant/30 p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">
                    {item.type || t('defaultType')}
                  </p>
                  <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface mb-3">
                    {item.title}
                  </h3>
                  {item.content && (
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                      {item.content}
                    </p>
                  )}

                  {/* Prefer an internal link to the related event/article; fall
                      back to an external link if one was provided. */}
                  {item.eventId ? (
                    <Link
                      href={`/wydarzenia/${item.eventId}`}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-colors inline-block"
                    >
                      {t('eventDetails')}
                    </Link>
                  ) : item.articleId ? (
                    <Link
                      href={`/wiki/${item.articleId}`}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-colors inline-block"
                    >
                      {t('readArticle')}
                    </Link>
                  ) : item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline transition-colors inline-block"
                    >
                      {t('readMore')}
                    </a>
                  ) : null}

                  <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-widest mt-3">
                    {new Date(item.createdAt).toLocaleDateString('pl-PL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
      <div className="mt-12 text-center">
        <Link
          href="/wydarzenia"
          className="text-xs font-bold uppercase tracking-widest text-primary hover:underline"
        >
          {t('eventsCta')}
        </Link>
      </div>
    </AuthGate>
  );
}
