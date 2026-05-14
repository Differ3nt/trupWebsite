import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

let cachedStats: any = null;

/**
 * Czyści pamięć podręczną statystyk.
 * Wywoływane przy zatwierdzaniu GPX lub finalizacji wydarzenia.
 */
export function invalidateStatsCache() {
  cachedStats = null;
}

/**
 * Pobiera zagregowane statystyki grupy TRUP.
 */
router.get('/', async (req, res) => {
  try {
    if (cachedStats) {
      return res.json(cachedStats);
    }

    // 1. Liczba zorganizowanych wypraw (tylko GÓRY)
    const mountainExpeditions = await prisma.event.count({
      where: {
        type: 'GÓRY',
        isDraft: false
      }
    });

    // 2. Przebyty dystans i przewyższenia (suma z zatwierdzonych GPX)
    const statsResult = await prisma.gpxSubmission.aggregate({
      where: { status: 'APPROVED' },
      _sum: { distance: true, elevationGain: true, duration: true }
    });
    
    // 3. Aktywni członkowie (wszyscy aktywni użytkownicy w systemie)
    const activeMembers = await prisma.user.count({
      where: { status: 'ACTIVE' }
    });

    cachedStats = {
      expeditions: mountainExpeditions,
      distance: Math.round(statsResult._sum.distance || 0),
      elevation: Math.round(statsResult._sum.elevationGain || 0),
      duration: Math.round(statsResult._sum.duration || 0),
      members: activeMembers
    };

    res.json(cachedStats);
  } catch (error) {
    console.error('Błąd pobierania statystyk:', error);
    res.status(500).json({ error: 'Nie udało się pobrać statystyk' });
  }
});

export default router;
