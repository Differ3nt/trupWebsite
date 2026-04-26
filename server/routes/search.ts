import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// 1. Globalna wyszukiwarka
router.get('/', async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim().length < 3) {
      return res.json({ users: [], events: [], albums: [] });
    }

    const searchTerm = query.trim();

    const [users, events, albums]: [any, any, any] = await Promise.all([
      prisma.$queryRaw`
        SELECT id, name, "avatarUrl" FROM "User" WHERE ("name" ILIKE ${`%${searchTerm}%`} OR "email" ILIKE ${`%${searchTerm}%`}) AND status = 'ACTIVE' LIMIT 10
      `,
      prisma.$queryRaw`
        SELECT id, title, type, "dateStart" FROM "Event" WHERE "title" ILIKE ${`%${searchTerm}%`} OR id ILIKE ${`%${searchTerm}%`} LIMIT 10
      `,
      prisma.$queryRaw`
        SELECT id, title, date FROM "Album" WHERE "title" ILIKE ${`%${searchTerm}%`} OR "description" ILIKE ${`%${searchTerm}%`} LIMIT 10
      `
    ]);

    // Formatowanie wyników pod ujednolicony format frontendu (używany w Layout.tsx)
    const results = [
      ...users.map((u: any) => ({ title: u.name, type: 'Użytkownik', url: `/profil/${u.id}`, description: 'Członek grupy' })),
      ...events.map((e: any) => ({ title: e.title, type: e.type, url: `/wydarzenia/${e.id}`, description: new Date(e.dateStart).toLocaleDateString() })),
      ...albums.map((a: any) => ({ title: a.title, type: 'Album', url: `/galeria/${a.id}`, description: new Date(a.date).toLocaleDateString() }))
    ];

    res.json({ results });
  } catch (error) {
    console.error('Błąd wyszukiwarki:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas wyszukiwania' });
  }
});

export default router;
