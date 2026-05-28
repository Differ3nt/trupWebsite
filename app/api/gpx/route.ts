import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { gpxUploadSchema } from '@/lib/validations/gpx';
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

    const label = formData.get('label') as string | null;
    const participantIds = formData.getAll('participantIds') as string[];
    const manualDuration = formData.get('manualDuration') as string | null;
    const eventId = formData.get('eventId') as string | null;

    const validated = gpxUploadSchema.parse({
      eventId,
      label,
      participantIds,
      manualDuration: manualDuration ? parseInt(manualDuration, 10) : undefined,
    });

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[gpx POST]');
  }
}
