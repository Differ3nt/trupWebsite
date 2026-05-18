import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Pobiera pełny profil zalogowanego użytkownika wraz z historią wydarzeń.
 */
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        participations: {
          include: { 
            event: {
              include: {
                participants: {
                  include: { user: true }
                }
              }
            }
          }
        },
        gpxSubmissions: true
      }
    });
    
    if (!user) return res.status(404).json({ error: 'Użytkownik nie został znaleziony w bazie' });
    
    // Obliczanie statystyk osobistych (trasy zatwierdzone, gdzie użytkownik był uczestnikiem)
    const personalStats = await prisma.gpxSubmission.aggregate({
      where: {
        status: 'APPROVED',
        OR: [
          { userId: req.userId },
          { participantIds: { has: req.userId } }
        ]
      },
      _sum: { distance: true, elevationGain: true }
    });

    // Zapewnienie, że pole hardware zawsze jest tablicą (nawet jeśli w bazie jest null)
    const hardware = Array.isArray(user.hardware) ? user.hardware : [];
    
    res.json({ 
      user: { ...user, hardware },
      stats: {
        distance: parseFloat((personalStats._sum.distance || 0).toFixed(1)),
        elevation: personalStats._sum.elevationGain || 0
      }
    });
  } catch (error) {
    console.error('Błąd pobierania profilu:', error);
    res.status(500).json({ error: 'Wystąpił błąd serwera podczas pobierania profilu' });
  }
});

/**
 * Aktualizuje dane profilowe użytkownika (imię, posiadany sprzęt, awatar, nr telefonu).
 */
router.patch('/me', authenticate, async (req: any, res) => {
  try {
    const { name, nickname, hardware, avatarUrl, phoneNumber } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name,
        nickname,
        hardware, // Tablica stringów (np. ["Czekan", "Raki"])
        avatarUrl,
        phoneNumber
      }
    });
    
    res.json({ success: true, user });
  } catch (error: any) {
    console.error('Błąd aktualizacji profilu [SERVER]:', error);
    // Log details of the error if it's a Prisma error
    if (error.code) {
      console.error('Prisma Error Code:', error.code);
      console.error('Prisma Error Meta:', error.meta);
    }
    res.status(500).json({ 
      error: 'Nie udało się zapisać zmian w profilu',
      details: error.message 
    });
  }
});

/**
 * Pobiera listę wszystkich użytkowników (Tylko Admin).
 */
router.get('/', authenticate, requireAdmin, async (req: any, res) => {
  try {

    const users = await prisma.user.findMany({
      select: { id: true, name: true, nickname: true, status: true },
      orderBy: { name: 'asc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania użytkowników' });
  }
});

export default router;
