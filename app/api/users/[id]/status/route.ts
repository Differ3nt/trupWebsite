import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireOwnerSafe } from '@/lib/session';
import { updateUserStatusSchema } from '@/lib/validations/user';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id: targetId } = await params;
    const body = await request.json();
    const validated = updateUserStatusSchema.parse(body);

    if (auth.data.userId === targetId) {
      return NextResponse.json({ error: 'Cannot change own status' }, { status: 403 });
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { email: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ownerCheck = await requireOwnerSafe(auth.data, targetId, target.email);
    if (!ownerCheck.ok) return ownerCheck.response;

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    console.error('[users [id] status PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
