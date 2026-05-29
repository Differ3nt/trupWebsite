import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { EventsClient } from './EventsClient';
import { PageHeader } from '@/components/ui/PageHeader';

async function getEvents() {
  try {
    return await prisma.event.findMany({
      where: { isDraft: false },
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
        _count: { select: { participants: { where: { status: 'GOING' } } } },
      },
      orderBy: { dateStart: 'desc' },
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
  const eventsData = await getEvents();

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
