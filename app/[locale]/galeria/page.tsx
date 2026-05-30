import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { GalleryClient } from './GalleryClient';
import { PageHeader } from '@/components/ui/PageHeader';

async function getAlbums() {
  try {
    const albums = await prisma.album.findMany({
      include: {
        images: {
          take: 8,
          orderBy: { createdAt: 'asc' },
          select: { id: true, thumbnailUrl: true },
        },
        _count: { select: { images: true } },
      },
      orderBy: { date: 'desc' },
    });
    // Flatten the true image count so the client shows correct totals / "+N"
    // even though only 8 thumbnails are loaded for the preview.
    return albums.map((a) => ({ ...a, imageCount: a._count.images }));
  } catch {
    return [];
  }
}

export default async function GalleryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('gallery');
  const session = await getSession();
  const allAlbums = await getAlbums();

  // Guests see only the first album (§14.7); members see all.
  const albums = session ? allAlbums : allAlbums.slice(0, 1);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        category={t('pageCategory')}
      />
      <GalleryClient albums={albums} isAuthenticated={!!session} />
    </div>
  );
}
