import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { WikiClient } from './WikiClient';
import { PageHeader } from '@/components/ui/PageHeader';

const GUEST_PREVIEW_CHARS = 100;

async function getArticles(isAuthenticated: boolean) {
  try {
    const articles = await prisma.wikiArticle.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Guests get only the first 100 chars of each article body (§14.8); the
    // full content never leaves the server for unauthenticated viewers.
    if (isAuthenticated) return articles;
    return articles.map((a) => ({
      ...a,
      content: a.content ? a.content.slice(0, GUEST_PREVIEW_CHARS) : a.content,
      truncated: !!a.content && a.content.length > GUEST_PREVIEW_CHARS,
    }));
  } catch {
    return [];
  }
}

export default async function WikiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('wiki');

  const session = await getSession();
  const articles = await getArticles(!!session);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        category={t('pageCategory')}
      />
      <WikiClient articles={articles} />
    </div>
  );
}
