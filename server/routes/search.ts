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

    // Równoległe wyszukiwanie po tabelach (uproszczone z użyciem contains)
    // W produkcji, na większych bazach lepiej użyć Full Text Search z Prisma (np. search: searchTerm)
    const [users, events, albums] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } }
          ],
          status: 'ACTIVE' // Ukrywamy oznaczonych/nieaktywnych w publicznej szukarce
        },
        select: { id: true, name: true, avatarUrl: true }
      }),
      prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { id: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: { id: true, title: true, type: true, dateStart: true }
      }),
      prisma.album.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        select: { id: true, title: true, date: true }
      })
    ]);

    res.json({ users, events, albums });
  } catch (error) {
    console.error('Błąd wyszukiwarki:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas wyszukiwania' });
  }
});

export default router;
