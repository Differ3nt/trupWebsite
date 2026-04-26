import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

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
          include: { event: true } // Dołączamy dane o wydarzeniach, w których brał udział
        }
      }
    });
    
    if (!user) return res.status(404).json({ error: 'Użytkownik nie został znaleziony w bazie' });
    
    // Zapewnienie, że pole hardware zawsze jest tablicą (nawet jeśli w bazie jest null)
    const hardware = Array.isArray(user.hardware) ? user.hardware : [];
    
    res.json({ user: { ...user, hardware } });
  } catch (error) {
    console.error('Błąd pobierania profilu:', error);
    res.status(500).json({ error: 'Wystąpił błąd serwera podczas pobierania profilu' });
  }
});

/**
 * Aktualizuje dane profilowe użytkownika (imię, posiadany sprzęt, awatar).
 */
router.patch('/me', authenticate, async (req: any, res) => {
  try {
    const { name, hardware, avatarUrl } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name,
        hardware, // Tablica stringów (np. ["Czekan", "Raki"])
        avatarUrl
      }
    });
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Błąd aktualizacji profilu:', error);
    res.status(500).json({ error: 'Nie udało się zapisać zmian w profilu' });
  }
});

export default router;
