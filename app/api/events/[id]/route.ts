import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireAdmin } from '@/lib/session';
import { updateEventSchema } from '@/lib/validations/event';
import { handleApiError } from '@/lib/api-errors';

const SENSITIVE_FIELDS = [
  'mapLink',
  'mapEmbed',
  'gearRequired',
  'gearCritical',
  'transport',
  'meetingPointLink',
  'meetingPointEmbed',
];

function stripSensitiveFields(event: any) {
  const copy = { ...event };
  SENSITIVE_FIELDS.forEach((field) => {
    delete copy[field];
  });
  return copy;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const event = await prisma.event.findUnique({
      where: { id },
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
        organizer: true,
        weatherInfo: true,
        plannedDistance: true,
        plannedElevation: true,
        plannedDuration: true,
        actualDistance: true,
        actualElevation: true,
        actualDuration: true,
        meetingPointName: true,
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
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!session || (session.role === 'USER' && session.status !== 'ACTIVE')) {
      return NextResponse.json(stripSensitiveFields(event));
    }

    return NextResponse.json(event);
  } catch (err) {
    return handleApiError(err, '[events [id] GET]');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updateEventSchema.parse(body);

    const plannedDurationMin = validated.plannedDuration ? validated.plannedDuration * 60 : undefined;

    await prisma.event.update({
      where: { id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.type !== undefined && { type: validated.type }),
        ...(validated.dateStart !== undefined && { dateStart: validated.dateStart }),
        ...(validated.dateEnd !== undefined && { dateEnd: validated.dateEnd }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.location !== undefined && { location: validated.location }),
        ...(validated.image !== undefined && { image: validated.image }),
        ...(validated.spots !== undefined && { spots: validated.spots }),
        ...(validated.isDraft !== undefined && { isDraft: validated.isDraft }),
        ...(validated.difficulty !== undefined && { difficulty: validated.difficulty }),
        ...(validated.organizer !== undefined && { organizer: validated.organizer }),
        ...(validated.transport !== undefined && { transport: validated.transport }),
        ...(validated.weatherInfo !== undefined && { weatherInfo: validated.weatherInfo }),
        ...(validated.mapLink !== undefined && { mapLink: validated.mapLink }),
        ...(validated.mapEmbed !== undefined && { mapEmbed: validated.mapEmbed }),
        ...(validated.meetingPointName !== undefined && { meetingPointName: validated.meetingPointName }),
        ...(validated.meetingPointLink !== undefined && { meetingPointLink: validated.meetingPointLink }),
        ...(validated.meetingPointEmbed !== undefined && { meetingPointEmbed: validated.meetingPointEmbed }),
        ...(validated.plannedDistance !== undefined && { plannedDistance: validated.plannedDistance }),
        ...(validated.plannedElevation !== undefined && { plannedElevation: validated.plannedElevation }),
        ...(plannedDurationMin !== undefined && { plannedDuration: plannedDurationMin }),
        ...(validated.imageFocalX !== undefined && { imageFocalX: validated.imageFocalX }),
        ...(validated.imageFocalY !== undefined && { imageFocalY: validated.imageFocalY }),
        ...(validated.gearRequired !== undefined && { gearRequired: validated.gearRequired }),
        ...(validated.gearCritical !== undefined && { gearCritical: validated.gearCritical }),
        ...(validated.featured !== undefined && { featured: validated.featured }),
        ...(validated.highlighted !== undefined && { highlighted: validated.highlighted }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[events [id] PUT]');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[events [id] DELETE]');
  }
}
