import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { pushBroadcastSchema } from '@/lib/validations/push';
import { handleApiError } from '@/lib/api-errors';
import { pushEnabled, env } from '@/lib/env';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { name: 'push-broadcast', limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validated = pushBroadcastSchema.parse(body);

    // Check if push notifications are configured
    if (!pushEnabled) {
      return NextResponse.json(
        {
          error: 'Push notifications not configured',
          details:
            'VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT environment variables are required',
        },
        { status: 503 },
      );
    }

    // Dynamically import web-push (optional dependency)
    let webpush: any;
    try {
      // Use function to avoid static type checking
      const importModule = new Function('return import("web-push")');
      webpush = await importModule();
    } catch {
      return NextResponse.json(
        {
          error: 'web-push package not installed',
          details: 'Install web-push to enable push notifications: npm install web-push',
        },
        { status: 503 },
      );
    }

    // Configure VAPID keys
    webpush.setVapidDetails(
      env.VAPID_SUBJECT,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY,
    );

    // Get all push subscriptions
    const subscriptions = await prisma.pushSubscription.findMany();

    if (subscriptions.length === 0) {
      return NextResponse.json({
        sent: 0,
        message: 'No active push subscriptions',
      });
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: auth.data.userId, // Track who sent it
        title: validated.title,
        message: validated.message,
        url: validated.url,
        type: 'BROADCAST',
      },
    });

    const payload = JSON.stringify({
      title: validated.title,
      body: validated.message,
      url: validated.url,
      notificationId: notification.id,
    });

    // Send to each subscription, auto-clean 410 Gone
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            payload,
          );
          sent++;
        } catch (err: unknown) {
          const error = err as any;
          if (error?.statusCode === 410) {
            // Subscription is gone, delete it
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          } else {
            failed++;
            errors.push(`${sub.endpoint.slice(0, 50)}: ${error?.message ?? 'Unknown error'}`);
          }
        }
      }),
    );

    return NextResponse.json({
      sent,
      failed,
      notificationId: notification.id,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return handleApiError(err, '[push send POST]');
  }
}
