import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { searchSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const q = request.nextUrl.searchParams.get('q');

    const validated = searchSchema.parse({ q });

    const images = await prisma.image.findMany({
      where: {
        OR: [
          { name: { contains: validated.q, mode: 'insensitive' } },
          { tags: { some: { name: { contains: validated.q, mode: 'insensitive' } } } },
        ],
      },
      include: { tags: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(images);
  } catch (err) {
    return handleApiError(err, '[images search GET]');
  }
}
