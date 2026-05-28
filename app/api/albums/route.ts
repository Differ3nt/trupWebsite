import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    const query = {
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
        locationMap: true,
        distance: true,
        duration: true,
        description: true,
        _count: {
          select: {
            images: true,
          },
        },
      },
      orderBy: { date: 'desc' as const },
    };

    if (!session) {
      const albums = await prisma.album.findMany({
        ...query,
        take: 1,
      });
      return NextResponse.json(albums);
    }

    const albums = await prisma.album.findMany(query);
    return NextResponse.json(albums);
  } catch (err) {
    console.error('[albums GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
