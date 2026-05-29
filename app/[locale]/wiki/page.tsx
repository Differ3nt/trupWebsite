import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { WikiClient } from './WikiClient';
import { PageHeader } from '@/components/ui/PageHeader';

async function getArticles() {
  try {
    return await prisma.wikiArticle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch {
    return [];
  }
}

export default async function WikiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('wiki');

  const articles = await getArticles();

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
