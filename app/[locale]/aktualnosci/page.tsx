import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { NewsClient } from './NewsClient';
import { PageHeader } from '@/components/ui/PageHeader';

async function getNews() {
  try {
    const newsItems = await prisma.newsItem.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
    return newsItems;
  } catch {
    return [];
  }
}

export default async function NewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('news');

  const news = await getNews();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        category={t('pageCategory')}
      />
      <NewsClient news={news} />
    </div>
  );
}
