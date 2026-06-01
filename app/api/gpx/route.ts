import { NextRequest, NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/rate-limit';
import { requireUser } from '@/lib/session';
import { gpxUploadSchema } from '@/lib/validations/gpx';
import { handleApiError } from '@/lib/api-errors';
import { prisma } from '@/lib/prisma';
import { saveFile, resolvePath } from '@/lib/storage';
import { analyzeGpxFile } from '@/lib/gpx';
import { validateUpload, MAX_GPX_BYTES, GPX_MIME_TYPES } from '@/lib/uploadValidation';

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { name: 'gpx-upload', limit: 20, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const invalid = validateUpload(file, {
      maxBytes: MAX_GPX_BYTES,
      allowedTypes: GPX_MIME_TYPES,
      allowedExtensions: ['.gpx'],
    });
    if (invalid) return invalid;

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

    // Save the GPX file to storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = `gpx/${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, '_')}`;
    await saveFile(filename, buffer);

    // Analyze the GPX file to extract distance/elevation/duration
    const stats = await analyzeGpxFile(resolvePath(filename));

    const finalDuration = validated.manualDuration ?? stats.duration;

    const submission = await prisma.gpxSubmission.create({
      data: {
        userId: auth.data.userId,
        eventId: validated.eventId,
        filePath: filename,
        distance: stats.distance,
        elevationGain: stats.elevationGain,
        duration: finalDuration,
        participantIds: validated.participantIds ?? [],
        label: validated.label ?? 'Trasa',
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (err) {
    return handleApiError(err, '[gpx POST]');
  }
}
