import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { newsToggleSchema } from '@/lib/validations/news';
import { handleApiError } from '@/lib/api-errors';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validated = newsToggleSchema.parse(body);

    const now = new Date();
    if (validated.eventId) {
      const existing = await prisma.newsItem.findFirst({ where: { eventId: validated.eventId } });
      if (existing) {
        await prisma.newsItem.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, removed: true });
      } else {
        const event = await prisma.event.findUnique({ where: { id: validated.eventId }, select: { title: true } });
        const id = `news_${Date.now()}`;
        await prisma.newsItem.create({ data: { id, title: event?.title ?? '', type: 'EVENT', eventId: validated.eventId, priority: 0, updatedAt: now } });
        return NextResponse.json({ success: true, added: true });
      }
    }
    if (validated.articleId) {
      const existing = await prisma.newsItem.findFirst({ where: { articleId: validated.articleId } });
      if (existing) {
        await prisma.newsItem.delete({ where: { id: existing.id } });
        return NextResponse.json({ success: true, removed: true });
      } else {
        const article = await prisma.wikiArticle.findUnique({ where: { id: validated.articleId }, select: { title: true } });
        const id = `news_${Date.now()}`;
        await prisma.newsItem.create({ data: { id, title: article?.title ?? '', type: 'ARTICLE', articleId: validated.articleId, priority: 0, updatedAt: now } });
        return NextResponse.json({ success: true, added: true });
      }
    }
    return NextResponse.json({ error: 'Must provide eventId or articleId' }, { status: 400 });
  } catch (err) {
    return handleApiError(err, '[news toggle POST]');
  }
}
