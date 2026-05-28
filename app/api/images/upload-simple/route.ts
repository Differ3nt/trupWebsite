import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { handleApiError } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[images upload-simple POST]');
  }
}
