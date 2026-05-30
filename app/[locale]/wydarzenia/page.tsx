import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { EventsClient } from './EventsClient';
import { PageHeader } from '@/components/ui/PageHeader';

type EventsViewer = { userId: string; role: 'USER' | 'ADMIN'; status: string } | null;

async function getEvents(viewer: EventsViewer) {
  // Role-based visibility (§14.3): admins see drafts too; inactive members see
  // published events plus any (incl. draft) they participate in; everyone else
  // sees only published events.
  let where: Record<string, unknown> = { isDraft: false };

  if (viewer?.role === 'ADMIN') {
    where = {};
  } else if (viewer && viewer.status !== 'ACTIVE') {
    const joined = await prisma.eventParticipation.findMany({
      where: { userId: viewer.userId },
      select: { eventId: true },
    });
    where = { OR: [{ isDraft: false }, { id: { in: joined.map((p) => p.eventId) } }] };
  }

  try {
    return await prisma.event.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        dateStart: true,
        dateEnd: true,
        location: true,
        image: true,
        imageFocalX: true,
        imageFocalY: true,
        spots: true,
        difficulty: true,
        description: true,
        isExpedition: true,
        isDraft: true,
        _count: { select: { participants: { where: { status: 'GOING' } } } },
      },
      orderBy: { dateStart: 'asc' },
    });
  } catch {
    return [];
  }
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EventsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('events');
  const session = await getSession();
  const eventsData = await getEvents(session);

  // Transform the data to match EventItem interface
  const events = eventsData.map((event) => ({
    ...event,
    _count: { participations: event._count.participants },
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title={t('pageTitle')}
        subtitle={t('pageSubtitle')}
        category={t('pageCategory')}
      />
      <EventsClient events={events} />
    </div>
  );
}
