import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/session';
import { invalidateStatsCache } from '@/lib/cache';
import { idSchema } from '@/lib/validations/common';

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
    finalizeSchema.parse(body);

    invalidateStatsCache();

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    console.error('[events finalize POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
