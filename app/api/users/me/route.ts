import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { updateProfileSchema } from '@/lib/validations/user';

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.data.userId },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        avatarUrl: true,
        phoneNumber: true,
        hardware: true,
        role: true,
        status: true,
        createdAt: true,
        participations: {
          include: {
            event: true,
          },
        },
        gpxSubmissions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const stats = await prisma.gpxSubmission.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { userId: auth.data.userId },
          { participantIds: { has: auth.data.userId } },
        ],
      },
      select: {
        distance: true,
        elevationGain: true,
        duration: true,
      },
    });

    const personalStats = stats.reduce(
      (acc, stat) => ({
        distance: acc.distance + (stat.distance || 0),
        elevation: acc.elevation + (stat.elevationGain || 0),
        duration: acc.duration + (stat.duration || 0),
      }),
      { distance: 0, elevation: 0, duration: 0 }
    );

    return NextResponse.json({ ...user, personalStats });
  } catch (err) {
    console.error('[users me GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    console.error('[users me PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
