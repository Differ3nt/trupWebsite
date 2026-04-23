import { Router } from 'express';
import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Konfiguracja Web Push VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@trup.pl',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Middleware uwierzytelniający (prosty do celu autoryzacji tokena)
const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Nieautoryzowany' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};

// 1. Zapis subskrypcji użytkownika
router.post('/subscribe', requireAuth, async (req: any, res) => {
  try {
    const subscription = req.body;

    // Zapisz do bazy
    await prisma.pushSubscription.create({
      data: {
        userId: req.userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Błąd zapisu subskrypcji:', error);
    res.status(500).json({ error: 'Nie udało się zapisać subskrypcji' });
  }
});

// 2. Wysłanie testowego/masowego powiadomienia (Tylko dla Admina - uproszczone dla przykładu)
router.post('/send', requireAuth, async (req: any, res) => {
  try {
    const { message, title, url } = req.body;
    
    // Sprawdzenie czy użytkownik to admin
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Brak uprawnień' });

    // Pobranie wszystkich aktywnych subskrypcji
    const subscriptions = await prisma.pushSubscription.findMany();

    const payload = JSON.stringify({
      title: title || 'Nowa Wyprawa!',
      body: message,
      url: url || '/'
    });

    // Wysyłka powiadomień
    const sendPromises = subscriptions.map(sub => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      return webpush.sendNotification(pushSub, payload).catch(e => {
        console.error('Błąd wysyłki do jednego z odbiorców (możliwe wygaśnięcie):', e);
        // Opcjonalnie: usunięcie wygasłej subskrypcji z bazy
        if (e.statusCode === 410) {
          prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(console.error);
        }
      });
    });

    await Promise.all(sendPromises);

    res.json({ success: true, count: subscriptions.length });
  } catch (error) {
    res.status(500).json({ error: 'Błąd wysyłania powiadomień' });
  }
});

export default router;
