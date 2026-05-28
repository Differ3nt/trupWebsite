import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { handleApiError } from '@/lib/api-errors';

export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });

    if (adminCount > 0) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: auth.data.userId },
      data: { role: 'ADMIN' },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, '[auth make-admin POST]');
  }
}
