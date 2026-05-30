import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { serializeEvent } from '@/lib/serializeEvent';
import { EventDetailClient } from './EventDetailClient';

type Props = {
  params: Promise<{ locale: string; id: string }>;
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
  const { locale, id } = await params;
  setRequestLocale(locale);

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

  // Admins may view drafts; everyone else gets a 404 for drafts/missing events.
  const isAdmin = session?.role === 'ADMIN';
  if (!event || (event.isDraft && !isAdmin)) {
    notFound();
  }

  const isParticipant = !!myParticipation;

  // Strip sensitive logistic fields for viewers who aren't entitled (guests,
  // inactive non-participants) — same contract the events API enforces.
  const maskedEvent = serializeEvent(event, {
    authenticated: !!session,
    role: session?.role,
    status: session?.status,
    isParticipant,
  });

  // Participant display rule (§14.4): on finalized events, non-admins see only
  // attendees; admins always see the full list.
  const visibleParticipants =
    event.isFinalized && !isAdmin
      ? event.participants.filter((p) => p.attended)
      : event.participants;

  const eventForClient = { ...maskedEvent, participants: visibleParticipants };

  return (
    <EventDetailClient
      event={eventForClient}
      myParticipation={myParticipation}
      userHardware={userHardware}
      isAuthenticated={!!session}
      isAdmin={isAdmin}
    />
  );
}
