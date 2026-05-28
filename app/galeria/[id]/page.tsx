import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { GalleryDetailClient } from './GalleryDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const album = await prisma.album.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        images: { take: 1, select: { thumbnailUrl: true }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!album) return { title: 'Galeria | TRUP' };
    const coverImage = album.images[0]?.thumbnailUrl;
    return {
      title: `${album.title} | Galeria TRUP`,
      description: album.description?.slice(0, 160) ?? 'Album zdjęć Grupy Górskiej TRUP',
      openGraph: {
        title: album.title,
        description: album.description?.slice(0, 160) ?? undefined,
        images: coverImage ? [{ url: coverImage }] : [],
        type: 'article',
      },
    };
  } catch {
    return { title: 'Galeria | TRUP' };
  }
}

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
