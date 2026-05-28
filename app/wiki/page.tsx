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

export default async function WikiPage() {
  const articles = await getArticles();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title="Baza Wiedzy"
        subtitle="ZBIÓR DOŚWIADCZEŃ, PORADNIKÓW I DOKUMENTACJI TECHNICZNEJ GRUPY TRUP."
        category="Wiedza i sprzęt"
      />
      <WikiClient articles={articles} />
    </div>
  );
}
