import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/session';
import { idSchema } from '@/lib/validations/common';
import { handleApiError } from '@/lib/api-errors';
import { deleteFile } from '@/lib/storage';
import { prisma } from '@/lib/prisma';

const updateImageSchema = z.object({
  name: z.string().max(255).optional(),
  tags: z.array(z.string()).optional(),
});

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    const body = await request.json();
    const validated = updateImageSchema.parse(body);

    const data: any = {};
    if (validated.name !== undefined) data.name = validated.name;
    if (validated.tags !== undefined) {
      const tagIds = await Promise.all(
        validated.tags.map((n: string) => prisma.tag.upsert({ where: { name: n }, update: {}, create: { name: n } }))
      );
      data.tags = { set: [], connect: tagIds.map((t: any) => ({ id: t.id })) };
    }

    const image = await prisma.image.update({
      where: { id },
      data,
      include: { tags: true },
    });
    return NextResponse.json(image);
  } catch (err) {
    return handleApiError(err, '[images PUT]');
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    idSchema.parse(id);

    const image = await prisma.image.findUnique({ where: { id }, select: { originalUrl: true, thumbnailUrl: true } });
    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    // Delete files from storage (strip leading /uploads/)
    await deleteFile(image.originalUrl.replace(/^\/uploads\//, ''));
    if (image.thumbnailUrl) await deleteFile(image.thumbnailUrl.replace(/^\/uploads\//, ''));

    await prisma.image.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[images DELETE]');
  }
}
