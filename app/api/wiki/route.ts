import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, requireAdmin } from '@/lib/session';
import { createWikiArticleSchema } from '@/lib/validations/wiki';
import { handleApiError } from '@/lib/api-errors';

export async function GET() {
  try {
    const session = await getSession();

    const articles = await prisma.wikiArticle.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (!session || (session.status !== 'ACTIVE' && session.role !== 'ADMIN')) {
      return NextResponse.json(
        articles.map((article) => ({
          ...article,
          content: article.content.length > 100 ? article.content.substring(0, 100) + '…' : article.content,
        }))
      );
    }

    return NextResponse.json(articles);
  } catch (err) {
    return handleApiError(err, '[wiki GET]');
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validated = createWikiArticleSchema.parse(body);

    return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
  } catch (err) {
    return handleApiError(err, '[wiki POST]');
  }
}
