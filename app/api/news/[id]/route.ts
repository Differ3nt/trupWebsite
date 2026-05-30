import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { updateNewsSchema } from '@/lib/validations/news';
import { handleApiError } from '@/lib/api-errors';

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    const body = await request.json();
    const validated = updateNewsSchema.parse(body);

    await prisma.newsItem.update({
      where: { id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.content !== undefined && { content: validated.content }),
        ...(validated.type !== undefined && { type: validated.type }),
        ...(validated.imageUrl !== undefined && { imageUrl: validated.imageUrl }),
        ...(validated.link !== undefined && { link: validated.link }),
        ...(validated.priority !== undefined && { priority: validated.priority }),
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[news [id] PUT]');
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    await prisma.newsItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[news [id] DELETE]');
  }
}
