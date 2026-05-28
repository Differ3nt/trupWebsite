import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { updateProfileSchema } from '@/lib/validations/user';
import { handleApiError } from '@/lib/api-errors';

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
    return handleApiError(err, '[users me GET]');
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: auth.data.userId },
      data: {
        name: validated.name,
        nickname: validated.nickname ?? undefined,
        phoneNumber: validated.phoneNumber ?? undefined,
        hardware: validated.hardware || [],
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        avatarUrl: true,
        phoneNumber: true,
        hardware: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(err, '[users me PATCH]');
  }
}
