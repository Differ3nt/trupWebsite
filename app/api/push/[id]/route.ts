import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { handleApiError } from '@/lib/api-errors';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    // Verify ownership before deleting
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.userId !== auth.data.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err, '[push [id] DELETE]');
  }
}
