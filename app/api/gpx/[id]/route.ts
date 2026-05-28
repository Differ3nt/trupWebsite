import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { updateGpxSchema } from '@/lib/validations/gpx';
import { idSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    const body = await request.json();
    const validated = updateGpxSchema.parse(body);

    const updated = await prisma.gpxSubmission.update({
      where: { id },
      data: {
        ...(validated.label !== undefined && { label: validated.label }),
        ...(validated.participantIds !== undefined && { participantIds: validated.participantIds }),
        ...(validated.isOfficial !== undefined && { isOfficial: validated.isOfficial }),
        ...(validated.order !== undefined && { order: validated.order }),
      },
    });

    return NextResponse.json(updated);
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

    await prisma.gpxSubmission.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[gpx DELETE]');
  }
}
