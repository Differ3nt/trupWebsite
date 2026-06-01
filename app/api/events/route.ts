import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireAdmin } from '@/lib/session';
import { createEventSchema } from '@/lib/validations/event';
import { handleApiError } from '@/lib/api-errors';
import { SENSITIVE_EVENT_FIELDS } from '@/lib/serializeEvent';
import { sanitizeEmbed } from '@/lib/sanitizeEmbed';

function stripSensitiveFields(event: any) {
  const copy = { ...event };
  SENSITIVE_EVENT_FIELDS.forEach((field) => {
    delete copy[field];
  });
  return copy;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const searchParams = request.nextUrl.searchParams;
    const typeFilter = searchParams.get('type');
    const upcomingFilter = searchParams.get('upcoming');

    const now = new Date();
    const whereConditions: any = {};

    if (!session?.role || session.role === 'USER') {
      if (session?.status === 'INACTIVE') {
        const inactiveUserEvents = await prisma.eventParticipation.findMany({
          where: { userId: session.userId },
          select: { eventId: true },
        });
        const eventIds = inactiveUserEvents.map((p) => p.eventId);
        whereConditions.OR = [
          { isDraft: false },
          { id: { in: eventIds } },
        ];
      } else {
        whereConditions.isDraft = false;
      }
    }

    if (typeFilter) {
      whereConditions.type = typeFilter;
    }

    if (upcomingFilter === 'true') {
      whereConditions.dateStart = { gte: now };
    } else if (upcomingFilter === 'false') {
      whereConditions.dateStart = { lt: now };
    }

    const events = await prisma.event.findMany({
      where: whereConditions,
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
        featured: true,
        highlighted: true,
        isDraft: true,
        difficulty: true,
        spots: true,
        isFinalized: true,
        description: true,
        ...(session?.role === 'ADMIN' || (session && session.status === 'ACTIVE')
          ? {
              mapLink: true,
              mapEmbed: true,
              gearRequired: true,
              gearCritical: true,
              transport: true,
              meetingPointLink: true,
              meetingPointEmbed: true,
            }
          : {}),
      },
      orderBy: { dateStart: 'asc' },
    });

    const filtered = events.map((event) => {
      if (!session || (session.role === 'USER' && session.status !== 'ACTIVE')) {
        return stripSensitiveFields(event);
      }
      return event;
    });

    return NextResponse.json(filtered);
  } catch (err) {
    return handleApiError(err, '[events GET]');
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validated = createEventSchema.parse(body);

    const typeMap: Record<string, string> = {
      'GÓRY': 'WYP',
      'INTEGRACJA': 'INT',
      'KULTURA': 'KUL',
    };
    const typeCode = typeMap[validated.type] ?? 'EVT';
    const year = validated.dateStart.getFullYear();
    const count = await prisma.event.count({
      where: { dateStart: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
    });
    const eventId = `${year}_${String(count + 1).padStart(2, '0')}_${typeCode}`;

    // plannedDuration from frontend is in hours — store as minutes
    const plannedDurationMin = validated.plannedDuration ? validated.plannedDuration * 60 : undefined;

    const event = await prisma.event.create({
      data: {
        id: eventId,
        title: validated.title,
        type: validated.type,
        dateStart: validated.dateStart,
        dateEnd: validated.dateEnd,
        description: validated.description,
        location: validated.location,
        image: validated.image,
        spots: validated.spots,
        isDraft: validated.isDraft,
        difficulty: validated.difficulty,
        organizer: validated.organizer,
        transport: validated.transport,
        weatherInfo: validated.weatherInfo,
        mapLink: validated.mapLink,
        mapEmbed: sanitizeEmbed(validated.mapEmbed),
        meetingPointName: validated.meetingPointName,
        meetingPointLink: validated.meetingPointLink,
        meetingPointEmbed: sanitizeEmbed(validated.meetingPointEmbed),
        plannedDistance: validated.plannedDistance,
        plannedElevation: validated.plannedElevation,
        plannedDuration: plannedDurationMin,
        imageFocalX: validated.imageFocalX,
        imageFocalY: validated.imageFocalY,
        gearRequired: validated.gearRequired,
        gearCritical: validated.gearCritical,
      },
    });
    return NextResponse.json({ success: true, eventId: event.id }, { status: 201 });
  } catch (err) {
    return handleApiError(err, '[events POST]');
  }
}
