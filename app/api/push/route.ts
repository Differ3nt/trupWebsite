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

    const id = crypto.randomUUID();

    await prisma.pushSubscription.upsert({
      where: { endpoint: validated.endpoint },
      update: {
        p256dh: validated.keys.p256dh,
        auth: validated.keys.auth,
      },
      create: {
        id,
        userId: auth.data.userId,
        endpoint: validated.endpoint,
        p256dh: validated.keys.p256dh,
        auth: validated.keys.auth,
      },
    });

    return NextResponse.json({ id, subscribed: true });
  } catch (err) {
    return handleApiError(err, '[push POST]');
  }
}
