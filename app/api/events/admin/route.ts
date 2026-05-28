import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // Return all events including drafts for admin view
    const events = await prisma.event.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        dateStart: true,
        dateEnd: true,
        location: true,
        mapLink: true,
        mapEmbed: true,
        difficulty: true,
        spots: true,
        type: true,
        gearRequired: true,
        gearCritical: true,
        image: true,
        imageFocalX: true,
        imageFocalY: true,
        isExpedition: true,
        highlighted: true,
        featured: true,
        isDraft: true,
        isFinalized: true,
        organizer: true,
        meetingPointName: true,
        meetingPointLink: true,
        meetingPointEmbed: true,
        transport: true,
        weatherInfo: true,
        plannedDistance: true,
        plannedElevation: true,
        plannedDuration: true,
        actualDistance: true,
        actualElevation: true,
        actualDuration: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { dateStart: 'desc' },
    });

    return NextResponse.json(events);
  } catch (err) {
    console.error('[events admin GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
