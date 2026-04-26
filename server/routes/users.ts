import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Middleware do autoryzacji (uproszczony, docelowo można wydzielić)
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Brak sesji' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Sesja wygasła' });
  }
};

// Pobieranie własnego profilu
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        participations: {
          include: { event: true }
        }
      }
    });
    if (!user) return res.status(404).json({ error: 'Użytkownik nie istnieje' });
    
    // Upewniamy się, że hardware jest tablicą
    const hardware = Array.isArray(user.hardware) ? user.hardware : [];
    
    res.json({ user: { ...user, hardware } });
  } catch (error) {
    console.error('Błąd pobierania profilu:', error);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// Aktualizacja własnego profilu (sprzęt, dane)
router.patch('/me', authenticate, async (req: any, res) => {
  try {
    const { name, hardware, avatarUrl } = req.body;
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name,
        hardware,
        avatarUrl
      }
    });
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Błąd aktualizacji profilu:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować profilu' });
  }
});

export default router;
