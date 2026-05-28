import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { GalleryDetailClient } from './GalleryDetailClient';

export default async function GalleryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let album;
  try {
    album = await prisma.album.findUnique({
      where: { id },
      include: { images: { orderBy: { createdAt: 'asc' } } },
    });
  } catch {
    album = null;
  }

  if (!album) {
    notFound();
  }

  return <GalleryDetailClient album={album} />;
}
