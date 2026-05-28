import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { updateGpxSchema } from '@/lib/validations/gpx';
import { idSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    const body = await request.json();
    updateGpxSchema.parse(body);

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[gpx PATCH]');
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[gpx DELETE]');
  }
}
