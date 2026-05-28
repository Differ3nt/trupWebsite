import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { pushSubscriptionSchema } from '@/lib/validations/push';
import { handleApiError } from '@/lib/api-errors';

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: auth.data.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch (err) {
    return handleApiError(err, '[push GET]');
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validated = pushSubscriptionSchema.parse(body);

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[push POST]');
  }
}
