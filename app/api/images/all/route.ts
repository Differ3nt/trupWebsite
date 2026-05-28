import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { handleApiError } from '@/lib/api-errors';

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
    return handleApiError(err, '[images all GET]');
  }
}
