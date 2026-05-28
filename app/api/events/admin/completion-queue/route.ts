import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { handleApiError } from '@/lib/api-errors';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const events = await prisma.event.findMany({
      where: {
        dateStart: { lt: new Date() },
        isFinalized: false,
        isDraft: false,
      },
      orderBy: { dateStart: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, nickname: true, avatarUrl: true },
            },
          },
        },
        gpxSubmissions: {
          include: {
            user: {
              select: { id: true, name: true, nickname: true },
            },
          },
        },
      },
    });

    return NextResponse.json(events);
  } catch (err) {
    return handleApiError(err, '[events completion-queue GET]');
  }
}
