import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { invalidateStatsCache } from '@/lib/cache';
import { idSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';

const finalizeSchema = z.object({
  attendedUserIds: z.array(z.string().uuid()),
  actualDistance: z.number().positive().optional(),
  actualElevation: z.number().positive().optional(),
  actualDuration: z.number().positive().optional(),
});

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    const body = await request.json();
    const validated = finalizeSchema.parse(body);

    invalidateStatsCache();

    const { attendedUserIds, actualDistance, actualElevation, actualDuration } = validated;

    // Reset all attended to false
    await prisma.eventParticipation.updateMany({ where: { eventId: id }, data: { attended: false } });

    // Set attended=true for each attended user (upsert in case they weren't formally signed up)
    for (const uid of attendedUserIds) {
      await prisma.eventParticipation.upsert({
        where: { userId_eventId: { userId: uid, eventId: id } },
        update: { attended: true, status: 'GOING' },
        create: { userId: uid, eventId: id, status: 'GOING', attended: true },
      });
    }

    // Finalize the event
    await prisma.event.update({
      where: { id },
      data: {
        isFinalized: true,
        ...(actualDistance !== undefined && { actualDistance }),
        ...(actualElevation !== undefined && { actualElevation }),
        ...(actualDuration !== undefined && { actualDuration }),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[events finalize POST]');
  }
}
