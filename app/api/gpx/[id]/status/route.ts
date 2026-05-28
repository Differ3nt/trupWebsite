import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/session';
import { invalidateStatsCache } from '@/lib/cache';
import { idSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';

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
    statusSchema.parse(body);

    invalidateStatsCache();

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[gpx status PATCH]');
  }
}
