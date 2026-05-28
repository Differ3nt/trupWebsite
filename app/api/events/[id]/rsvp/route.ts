import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { rsvpSchema } from '@/lib/validations/rsvp';
import { idSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    const body = await request.json();
    const validated = rsvpSchema.parse(body);

    const session = auth.data;
    const { status, notifyDaysBefore } = validated;

    // Reject if event is in the past
    const event = await prisma.event.findUnique({ where: { id }, select: { dateStart: true, dateEnd: true, spots: true } });
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const eventDate = event.dateEnd ?? event.dateStart;
    if (eventDate < today) return NextResponse.json({ error: 'Cannot RSVP to a past event' }, { status: 400 });

    // null status = remove participation
    if (status === null) {
      await prisma.eventParticipation.deleteMany({ where: { userId: session.userId, eventId: id } });
      return NextResponse.json({ success: true, status: null });
    }

    // Check spots limit for GOING
    if (status === 'GOING' && event.spots !== null) {
      const goingCount = await prisma.eventParticipation.count({ where: { eventId: id, status: 'GOING' } });
      const existing = await prisma.eventParticipation.findUnique({ where: { userId_eventId: { userId: session.userId, eventId: id } } });
      if (goingCount >= event.spots && existing?.status !== 'GOING') {
        return NextResponse.json({ error: 'No spots available' }, { status: 400 });
      }
    }

    await prisma.eventParticipation.upsert({
      where: { userId_eventId: { userId: session.userId, eventId: id } },
      update: { status, notifyDaysBefore: notifyDaysBefore ?? null },
      create: { userId: session.userId, eventId: id, status, notifyDaysBefore: notifyDaysBefore ?? null },
    });
    return NextResponse.json({ success: true, status });
  } catch (err) {
    return handleApiError(err, '[events rsvp POST]');
  }
}
