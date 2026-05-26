import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * Pobiera wszystkie aktualności.
 */
router.get('/', async (req, res) => {
  try {
    const news = await prisma.$queryRaw`
      SELECT n.*, 
             e.title as "eventTitle", e.image as "eventImage", e.type as "eventType", e."dateStart" as "eventDate",
             a.title as "articleTitle", a.category as "articleCategory"
      FROM "NewsItem" n
      LEFT JOIN "Event" e ON n."eventId" = e.id
      LEFT JOIN "WikiArticle" a ON n."articleId" = a.id
      ORDER BY n."priority" DESC, n."createdAt" DESC
    `;
    res.json(news);
  } catch (error) {
    console.error('Błąd pobierania newsów:', error);
    res.status(500).json({ error: 'Błąd pobierania aktualności' });
  }
});

/**
 * Tworzy nową aktualność (Admin).
 */
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { title, content, type, imageUrl, link, eventId, articleId, priority } = req.body;
    const id = `news_${Date.now()}`;
    
    await prisma.$executeRaw`
      INSERT INTO "NewsItem" (id, title, content, type, "imageUrl", link, "eventId", "articleId", priority, "createdAt", "updatedAt")
      VALUES (${id}, ${title}, ${content}, ${type || 'GENERAL'}, ${imageUrl}, ${link}, ${eventId}, ${articleId}, ${priority || 0}, NOW(), NOW())
    `;
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('Błąd tworzenia newsa:', error);
    res.status(500).json({ error: 'Błąd zapisu aktualności' });
  }
});

/**
 * Usuwa aktualność (Admin).
 */
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    await prisma.$executeRaw`DELETE FROM "NewsItem" WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania aktualności' });
  }
});

/**
 * Szybkie promowanie/usuwanie z aktualności dla Eventów/Artykułów.
 */
router.post('/toggle', authenticate, async (req: any, res) => {
  try {
    const { eventId, articleId, title, type } = req.body;
    
    if (eventId) {
      const existing: any = await prisma.$queryRaw`SELECT id FROM "NewsItem" WHERE "eventId" = ${eventId}`;
      if (existing.length > 0) {
        await prisma.$executeRaw`DELETE FROM "NewsItem" WHERE "eventId" = ${eventId}`;
        return res.json({ success: true, removed: true });
      } else {
        const id = `news_${Date.now()}`;
        await prisma.$executeRaw`
          INSERT INTO "NewsItem" (id, title, type, "eventId", "createdAt", "updatedAt")
          VALUES (${id}, ${title}, 'EVENT', ${eventId}, NOW(), NOW())
        `;
        return res.json({ success: true, added: true });
      }
    }
    
    if (articleId) {
      const existing: any = await prisma.$queryRaw`SELECT id FROM "NewsItem" WHERE "articleId" = ${articleId}`;
      if (existing.length > 0) {
        await prisma.$executeRaw`DELETE FROM "NewsItem" WHERE "articleId" = ${articleId}`;
        return res.json({ success: true, removed: true });
      } else {
        const id = `news_${Date.now()}`;
        await prisma.$executeRaw`
          INSERT INTO "NewsItem" (id, title, type, "articleId", "createdAt", "updatedAt")
          VALUES (${id}, ${title}, 'ARTICLE', ${articleId}, NOW(), NOW())
        `;
        return res.json({ success: true, added: true });
      }
    }
    
    res.status(400).json({ error: 'Brak ID obiektu' });
  } catch (error) {
    res.status(500).json({ error: 'Błąd przełączania statusu news' });
  }
});

export default router;
