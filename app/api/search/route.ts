import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { searchSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';
import { requireUser } from '@/lib/session';

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, { name: 'search', limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  // Search is members-only: previously public, which let anyone enumerate every
  // member's email address (security hardening §2).
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const q = request.nextUrl.searchParams.get('q');
    const validated = searchSchema.parse({ q });

    const [users, events, albums] = await Promise.all([
      prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { name: { contains: validated.q, mode: 'insensitive' } },
            { nickname: { contains: validated.q, mode: 'insensitive' } },
            { email: { contains: validated.q, mode: 'insensitive' } },
          ],
        },
        // email is intentionally NOT selected — it must never reach the client.
        select: {
          id: true,
          name: true,
          nickname: true,
          avatarUrl: true,
        },
        take: 10,
      }),
      prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: validated.q, mode: 'insensitive' } },
            { id: { contains: validated.q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          type: true,
          dateStart: true,
          image: true,
        },
        take: 10,
      }),
      prisma.album.findMany({
        where: {
          OR: [
            { title: { contains: validated.q, mode: 'insensitive' } },
            { description: { contains: validated.q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          date: true,
        },
        take: 10,
      }),
    ]);

    const results = [
      ...users.map((user) => ({
        type: 'user',
        id: user.id,
        title: user.name || user.nickname || 'Użytkownik',
        description: user.nickname && user.name ? `@${user.nickname}` : '',
        url: `/profil/${user.id}`,
      })),
      ...events.map((event) => ({
        type: 'event',
        id: event.id,
        title: event.title,
        description: event.type,
        url: `/wydarzenia/${event.id}`,
      })),
      ...albums.map((album) => ({
        type: 'album',
        id: album.id,
        title: album.title,
        description: album.description || '',
        url: `/galeria/${album.id}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (err) {
    return handleApiError(err, '[search GET]');
  }
}
