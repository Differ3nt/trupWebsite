import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        images: {
          include: {
            tags: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json(album);
  } catch (err) {
    console.error('[albums [id] GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
