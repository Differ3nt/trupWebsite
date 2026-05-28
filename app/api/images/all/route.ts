import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const images = await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      include: { tags: true },
    });

    return NextResponse.json(images);
  } catch (err) {
    console.error('[images all GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
