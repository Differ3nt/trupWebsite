import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { invalidateStatsCache } from './stats';

const router = Router();

/**
 * Middleware autoryzacyjny (uproszczona wersja lokalna).
 * Sprawdza czy użytkownik posiada ważny token sesji.
 */
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Brak aktywnej sesji' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Sesja wygasła lub jest nieprawidłowa' });
  }
};

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
router.get('/', authenticate, async (req: any, res) => {
  try {
    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    if (admin?.role !== 'ADMIN') return res.status(403).json({ error: 'Brak uprawnień' });

    const users = await prisma.user.findMany({
      select: { id: true, name: true, nickname: true, email: true, avatarUrl: true, status: true, role: true, createdAt: true },
      orderBy: [{ status: 'asc' }, { name: 'asc' }]
    });
    const ownerEmail = process.env.OWNER_EMAIL;
    res.json(users.map(u => ({ ...u, isOwner: ownerEmail ? u.email === ownerEmail : false })));
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania użytkowników' });
  }
});

/**
 * Zmienia status użytkownika (Tylko Admin).
 */
router.patch('/:id/status', authenticate, async (req: any, res) => {
  try {
    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    if (admin?.role !== 'ADMIN') return res.status(403).json({ error: 'Brak uprawnień' });

    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status }
    });

    invalidateStatsCache();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji statusu użytkownika' });
  }
});

/**
 * Zmienia rolę użytkownika (Tylko Admin).
 */
router.patch('/:id/role', authenticate, async (req: any, res) => {
  try {
    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    if (admin?.role !== 'ADMIN') return res.status(403).json({ error: 'Brak uprawnień' });
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Nie możesz zmienić własnej roli' });

    const { role } = req.body;
    if (!['ADMIN', 'USER'].includes(role)) return res.status(400).json({ error: 'Nieprawidłowa rola' });

    const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { email: true } });
    if (process.env.OWNER_EMAIL && target?.email === process.env.OWNER_EMAIL) {
      return res.status(403).json({ error: 'Nie można zmienić roli właściciela' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role, status: role === 'ADMIN' ? 'ACTIVE' : undefined }
    });

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji roli użytkownika' });
  }
});

/**
 * Usuwa użytkownika (Tylko Admin).
 */
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const admin = await prisma.user.findUnique({ where: { id: req.userId } });
    if (admin?.role !== 'ADMIN') return res.status(403).json({ error: 'Brak uprawnień' });
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });

    const targetDel = await prisma.user.findUnique({ where: { id: req.params.id }, select: { email: true } });
    if (process.env.OWNER_EMAIL && targetDel?.email === process.env.OWNER_EMAIL) {
      return res.status(403).json({ error: 'Nie można usunąć właściciela' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });

    invalidateStatsCache();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania użytkownika' });
  }
});

export default router;
