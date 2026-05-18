import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, getUserIdFromCookie } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Pobiera listę wszystkich artykułów Wiki.
 */
router.get('/', async (req, res) => {
  try {
    const articles = await prisma.wikiArticle.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Check if featured (this is slightly inefficient but safer for now)
    const featuredNews = await prisma.newsItem.findMany({
      where: { articleId: { not: null } },
      select: { articleId: true }
    });
    const featuredIds = new Set(featuredNews.map(n => n.articleId));

    const userId = getUserIdFromCookie(req);
    const result = articles.map(a => ({
      ...a,
      isFeatured: featuredIds.has(a.id),
      // Mask content for guests
      content: userId ? a.content : a.content.substring(0, 100) + '...'
    }));

    res.json(result);
  } catch (error) {
    console.error('Błąd pobierania artykułów Wiki:', error);
    res.status(500).json({ error: 'Nie udało się pobrać bazy wiedzy' });
  }
});

/**
 * Pobiera szczegóły konkretnego artykułu.
 */
router.get('/:id', async (req, res) => {
  try {
    const article = await prisma.wikiArticle.findUnique({
      where: { id: req.params.id }
    });
    if (!article) {
      return res.status(404).json({ error: 'Artykuł nie znaleziony' });
    }
    const userId = getUserIdFromCookie(req);
    if (!userId) {
      return res.json({
        ...article,
        content: article.content.substring(0, 100) + '... (Zaloguj się, aby przeczytać całość)'
      });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

/**
 * Tworzy nowy artykuł (tylko Admin).
 */
router.post('/', authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { title, content, category, tags, authorName } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Brak wymaganych pól' });
    }

    const article = await prisma.wikiArticle.create({
      data: {
        title,
        content,
        category,
        tags: Array.isArray(tags) ? tags : [],
        authorId: req.userId,
        authorName
      }
    });
    res.json(article);
  } catch (error) {
    console.error('BŁĄD TWORZENIA ARTYKUŁU:', error);
    res.status(500).json({ error: 'Nie udało się stworzyć artykułu' });
  }

});

/**
 * Aktualizuje artykuł (tylko Admin).
 */
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, content, category, tags, authorName } = req.body;
    const article = await prisma.wikiArticle.update({
      where: { id: req.params.id },
      data: { 
        title, 
        content, 
        category,
        authorName,
        tags: Array.isArray(tags) ? tags : undefined
      }
    });
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji' });
  }
});

/**
 * Usuwa artykuł (tylko Admin).
 */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.wikiArticle.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania' });
  }
});

export default router;
