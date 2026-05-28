import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { idSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';

const attendanceSchema = z.object({
  userId: z.string().uuid(),
  attended: z.boolean(),
});

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    const body = await request.json();
    const validated = attendanceSchema.parse(body);

    const { userId, attended } = validated;
    await prisma.eventParticipation.updateMany({
      where: { userId, eventId: id },
      data: { attended },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[events attendance PATCH]');
  }
}
