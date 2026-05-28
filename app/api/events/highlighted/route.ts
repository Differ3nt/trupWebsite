import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        highlighted: true,
        isDraft: false,
        dateStart: { lt: new Date() },
      },
      take: 6,
      orderBy: { dateStart: 'desc' },
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
    console.error('[events highlighted GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
