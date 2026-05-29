import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { GalleryClient } from './GalleryClient';
import { PageHeader } from '@/components/ui/PageHeader';

async function getAlbums() {
  try {
    return await prisma.album.findMany({
      include: {
        images: {
          take: 8,
          orderBy: { createdAt: 'asc' },
          select: { id: true, thumbnailUrl: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  } catch {
    return [];
  }
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gallery');
  const albums = await getAlbums();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        category={t('pageCategory')}
      />
      <GalleryClient albums={albums} />
    </div>
  );
}
