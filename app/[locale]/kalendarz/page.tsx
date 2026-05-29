import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { CalendarClient } from './CalendarClient';
import { PageHeader } from '@/components/ui/PageHeader';

async function getEvents() {
  try {
    return await prisma.event.findMany({
      where: { isDraft: false },
      select: {
        id: true,
        title: true,
        dateStart: true,
        dateEnd: true,
        type: true,
        location: true,
      },
      orderBy: { dateStart: 'asc' },
    });
  } catch {
    return [];
  }
}

export default async function KalendarzPage() {
  const events = await getEvents();

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title="Kalendarz Wypraw"
        subtitle="HARMONOGRAM DZIAŁAŃ GRUPY TRUP W TERENIE."
        category="Plany operacyjne"
      />
      {/* CalendarClient reads useSearchParams — needs a Suspense boundary to prerender. */}
      <Suspense>
        <CalendarClient events={events} />
      </Suspense>
    </div>
  );
}
