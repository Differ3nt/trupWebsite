import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/session';
import { invalidateStatsCache } from '@/lib/cache';
import { idSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';
import { prisma } from '@/lib/prisma';

const statusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    const body = await request.json();
    const validated = statusSchema.parse(body);

    const updated = await prisma.gpxSubmission.update({
      where: { id },
      data: { status: validated.status },
    });

    invalidateStatsCache();

    return NextResponse.json({ success: true, submission: updated });
  } catch (err) {
    return handleApiError(err, '[gpx status PATCH]');
  }
}
