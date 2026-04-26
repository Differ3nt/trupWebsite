import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Inicjalizacja klienta Google OAuth2
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3001/api/auth/google/callback' // Adres zwrotny po zalogowaniu w Google
);

/**
 * Generuje token JWT dla danego użytkownika.
 * Token wygasa po 7 dniach.
 */
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

/**
 * 1. Punkt wejścia logowania przez Google.
 * Przekierowuje użytkownika do formularza logowania Google.
 */
router.get('/google', (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    prompt: 'consent'
  });
  res.redirect(url);
});

/**
 * 2. Callback z Google.
 * Wywoływany przez Google po udanym zalogowaniu użytkownika.
 * Pobiera dane profilu i tworzy/aktualizuje użytkownika w bazie.
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) throw new Error('Brak kodu autoryzacyjnego');

    // Wymiana kodu na tokeny Google
    const { tokens } = await oAuth2Client.getToken(code as string);
    oAuth2Client.setCredentials(tokens);

    // Pobranie szczegółowych danych o użytkowniku z Google
    const userInfo = await oAuth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const data = userInfo.data as any;

    if (!data.email) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=no_email`);
    }

    // Synchronizacja danych użytkownika z naszą bazą (Upsert)
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        googleId: data.sub,
        name: data.name,
        avatarUrl: data.picture,
      },
      create: {
        email: data.email,
        googleId: data.sub,
        name: data.name,
        avatarUrl: data.picture,
        role: 'USER',
        status: 'ACTIVE'
      }
    });

    // Generowanie naszego tokena sesji i zapisanie go w ciasteczku
    const token = generateToken(user.id);
    res.cookie('token', token, {
      httpOnly: true, // Zabezpieczenie przed dostępem z JS (XSS)
      secure: false,  // W środowisku produkcyjnym powinno być true (HTTPS)
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // Czas życia: 7 dni
    });

    // Powrót do aplikacji frontendowej
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  } catch (error) {
    console.error('Błąd autoryzacji Google:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=auth_failed`);
  }
});

/**
 * 3. Pobranie danych aktualnie zalogowanego użytkownika.
 * Wywoływane przez frontend przy starcie aplikacji (App.tsx).
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Nieautoryzowany' });

    // Weryfikacja tokena JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    
    // Pobranie danych użytkownika z bazy za pomocą surowego SQL (queryRaw)
    const users: any = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${decoded.userId}`;

    if (!users || !users.length) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
    
    // Pobranie listy wydarzeń, w których użytkownik bierze udział
    let participations: any = [];
    try {
      participations = await prisma.$queryRaw`
        SELECT p.*, (SELECT row_to_json(e) FROM "Event" e WHERE e.id = p."eventId") as event 
        FROM "EventParticipation" p WHERE p."userId" = ${decoded.userId}
      `;
    } catch (e) {
      console.warn('Błąd pobierania uczestnictwa:', e);
    }

    res.json({ user: { ...users[0], participations: participations || [] } });
  } catch (error: any) {
    console.error('Błąd endpointu /me:', error);
    res.status(500).json({ error: 'Błąd serwera podczas weryfikacji sesji' });
  }
});

/**
 * Funkcja awaryjna: nadaje uprawnienia admina pierwszemu użytkownikowi.
 */
router.post('/make-admin', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Nieautoryzowany' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };

    // Pozwalamy na nadanie admina tylko jeśli w systemie nie ma jeszcze żadnego admina
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin && existingAdmin.id !== decoded.userId) {
      return res.status(403).json({ error: 'Administrator już istnieje w systemie' });
    }

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { role: 'ADMIN' }
    });

    res.json({ success: true, message: `${user.name} jest teraz Administratorem` });
  } catch (error) {
    res.status(500).json({ error: 'Błąd nadawania uprawnień' });
  }
});

/**
 * Wylogowanie użytkownika - czyszczenie ciasteczka sesji.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

export default router;
