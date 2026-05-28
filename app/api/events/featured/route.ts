import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        featured: true,
        isDraft: false,
        dateStart: { gte: new Date() },
      },
      take: 6,
      orderBy: { dateStart: 'asc' },
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
      },
    });

    return NextResponse.json(events);
  } catch (err) {
    console.error('[events featured GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
