import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireAdmin } from '@/lib/session';
import { updateWikiArticleSchema } from '@/lib/validations/wiki';
import { handleApiError } from '@/lib/api-errors';

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const session = await getSession();

    const article = await prisma.wikiArticle.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!session || (session.status !== 'ACTIVE' && session.role !== 'ADMIN')) {
      return NextResponse.json({
        ...article,
        content: article.content.length > 100 ? article.content.substring(0, 100) + '…' : article.content,
      });
    }

    return NextResponse.json(article);
  } catch (err) {
    return handleApiError(err, '[wiki [id] GET]');
  }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    const body = await request.json();
    const validated = updateWikiArticleSchema.parse(body);

    const article = await prisma.wikiArticle.update({
      where: { id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.content !== undefined && { content: validated.content }),
        ...(validated.category !== undefined && { category: validated.category }),
        ...(validated.authorName !== undefined && { authorName: validated.authorName }),
        ...(validated.tags !== undefined && { tags: validated.tags }),
      },
    });
    return NextResponse.json(article);
  } catch (err) {
    return handleApiError(err, '[wiki [id] PUT]');
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await props.params;
    await prisma.wikiArticle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, '[wiki [id] DELETE]');
  }
}
