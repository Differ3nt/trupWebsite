import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            participations: true,
            gpxSubmissions: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error('[users GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
