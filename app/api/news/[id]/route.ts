import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { handleApiError } from '@/lib/api-errors';

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    await props.params;

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[news [id] DELETE]');
  }
}
