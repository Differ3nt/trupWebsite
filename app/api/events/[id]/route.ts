import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireAdmin } from '@/lib/session';
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

  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
