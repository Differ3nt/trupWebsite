import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { env } from '@/lib/env';
import { handleApiError } from '@/lib/api-errors';

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

    // Surface owner identity + the requesting admin's own id so the UI can
    // hide demote/delete on the owner and on self (server still enforces both).
    const ownerEmail = env.OWNER_EMAIL;
    const withFlags = users.map((u) => ({
      ...u,
      isOwner: !!ownerEmail && u.email === ownerEmail,
      isSelf: u.id === auth.data.userId,
    }));

    return NextResponse.json(withFlags);
  } catch (err) {
    return handleApiError(err, '[users GET]');
  }
}
