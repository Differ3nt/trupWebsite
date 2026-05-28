import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/session';
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
    attendanceSchema.parse(body);

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[events attendance PATCH]');
  }
}
