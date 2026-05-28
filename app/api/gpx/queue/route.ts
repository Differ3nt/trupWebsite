import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const submissions = await prisma.gpxSubmission.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
        event: {
          select: { id: true, title: true, type: true, dateStart: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(submissions);
  } catch (err) {
    console.error('[gpx queue GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
