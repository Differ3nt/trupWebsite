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

export default async function GalleryPage() {
  const albums = await getAlbums();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title="Archiwum Wizualne"
        subtitle="DOKUMENTACJA WYPRAW, SZKOLEŃ I EKSPEDYCJI GRUPY GÓRSKIEJ."
        category="Multimedia i wspomnienia"
      />
      <GalleryClient albums={albums} />
    </div>
  );
}
