import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { newsToggleSchema } from '@/lib/validations/news';
import { handleApiError } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validated = newsToggleSchema.parse(body);

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[news toggle POST]');
  }
}
