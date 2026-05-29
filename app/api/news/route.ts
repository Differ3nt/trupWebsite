import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { createNewsSchema } from '@/lib/validations/news';
import { handleApiError } from '@/lib/api-errors';

export async function GET() {
  try {
    const newsItems = await prisma.newsItem.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const eventIds = newsItems
      .map((item) => item.eventId)
      .filter((id) => id !== null && id !== undefined) as string[];
    const articleIds = newsItems
      .map((item) => item.articleId)
      .filter((id) => id !== null && id !== undefined) as string[];

    const [events, articles] = await Promise.all([
      eventIds.length > 0
        ? prisma.event.findMany({
            where: { id: { in: eventIds } },
            select: { id: true, title: true, type: true, dateStart: true, image: true },
          })
        : Promise.resolve([]),
      articleIds.length > 0
        ? prisma.wikiArticle.findMany({
            where: { id: { in: articleIds } },
            select: { id: true, title: true, category: true },
          })
        : Promise.resolve([]),
    ]);

    const eventMap = new Map(events.map((e) => [e.id, e]));
    const articleMap = new Map(articles.map((a) => [a.id, a]));

    const result = newsItems.map((item) => ({
      ...item,
      event: item.eventId ? eventMap.get(item.eventId) : null,
      article: item.articleId ? articleMap.get(item.articleId) : null,
    }));

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(err, '[news GET]');
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const validated = createNewsSchema.parse(body);

    const id = `news_${Date.now()}`;
    const now = new Date();
    const newsItem = await prisma.newsItem.create({
      data: {
        id,
        title: validated.title,
        content: validated.content,
        type: validated.type,
        imageUrl: validated.imageUrl,
        link: validated.link,
        eventId: validated.eventId,
        articleId: validated.articleId,
        priority: validated.priority ?? 0,
        updatedAt: now,
      },
    });
    return NextResponse.json(newsItem, { status: 201 });
  } catch (err) {
    return handleApiError(err, '[news POST]');
  }
}
