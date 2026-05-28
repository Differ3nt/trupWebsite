import { prisma } from '@/lib/prisma';
import { NewsClient } from './NewsClient';
import { PageHeader } from '@/components/ui/PageHeader';

async function getNews() {
  try {
    const newsItems = await prisma.newsItem.findMany({
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
    return newsItems;
  } catch {
    return [];
  }
}

export default async function NewsPage() {
  const news = await getNews();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title="Aktualności"
        subtitle="KOMUNIKATY I INFORMACJE GRUPY TRUP."
        category="Komunikaty grupy"
      />
      <NewsClient news={news} />
    </div>
  );
}
