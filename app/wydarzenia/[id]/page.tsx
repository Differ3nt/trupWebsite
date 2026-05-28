import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { EventDetailClient } from './EventDetailClient';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { title: true, description: true, image: true, dateStart: true, location: true },
    });
    if (!event) return { title: 'Wydarzenie | TRUP' };
    return {
      title: `${event.title} | TRUP`,
      description: event.description?.slice(0, 160) ?? 'Wyprawa Grupy Górskiej TRUP',
      openGraph: {
        title: event.title,
        description: event.description?.slice(0, 160) ?? undefined,
        images: event.image ? [{ url: event.image }] : [],
        type: 'article',
      },
    };
  } catch {
    return { title: 'Wydarzenie | TRUP' };
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  let event = null;
  let myParticipation = null;
  let userHardware: string[] = [];

  try {
    event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        gpxSubmissions: {
          where: { status: 'APPROVED' },
          orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (event && session) {
      myParticipation =
        event.participants.find((p) => p.userId === session.userId) ?? null;
      const u = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { hardware: true },
      });
      userHardware = u?.hardware ?? [];
    }
  } catch (e) {
    console.error('Error fetching event:', e);
    event = null;
  }

  if (!event || event.isDraft) {
    notFound();
  }

  return (
    <EventDetailClient
      event={event}
      myParticipation={myParticipation}
      userHardware={userHardware}
      isAuthenticated={!!session}
      isAdmin={session?.role === 'ADMIN'}
    />
  );
}
