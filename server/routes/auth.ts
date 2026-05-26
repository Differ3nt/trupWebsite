import { Router, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

const router = Router();

// Inicjalizacja klienta Google OAuth2
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback'
);

/**
 * Generuje token JWT dla danego użytkownika.
 * Token wygasa po 7 dniach.
 */
const generateToken = (userId: string, role: string, status: string) => {
  return jwt.sign({ userId, role, status }, JWT_SECRET, {
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

    // Wymiana kodu na tokeny Google - Ręczna implementacja z powodu błędów gaxios
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
        grant_type: 'authorization_code',
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Manual Token Exchange Failed:', errorText);
      throw new Error(`Google Token Exchange failed: ${errorText}`);
    }

    const tokens = await tokenResponse.json();
    oAuth2Client.setCredentials(tokens);

    // Pobranie szczegółowych danych o użytkowniku z Google - Ręcznie
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!userRes.ok) {
      const errorText = await userRes.text();
      console.error('Manual User Info Fetch Failed:', errorText);
      throw new Error(`Google User Info fetch failed: ${errorText}`);
    }

    const data = await userRes.json();

    if (!data.email) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=no_email`);
    }

    // Synchronizacja danych użytkownika z naszą bazą (Upsert)
    let user;
    try {
      user = await prisma.user.upsert({
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
          status: 'INACTIVE'
        }
      });
    } catch (dbError: any) {
      console.error('CRITICAL DATABASE ERROR DURING AUTH:', dbError);
      throw dbError;
    }

    // Generowanie naszego tokena sesji i zapisanie go w ciasteczku
    const token = generateToken(user.id, user.role, user.status);

    res.cookie('token', token, {
      httpOnly: true, // Zabezpieczenie przed dostępem z JS (XSS)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // Czas życia: 7 dni
    });

    // Powrót do aplikacji frontendowej
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  } catch (error: any) {
    console.error('Błąd autoryzacji Google [SERVER]:', error);
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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Pobranie danych użytkownika z bazy
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        participations: {
          include: { 
            event: {
              include: {
                participants: {
                  where: { attended: true },
                  select: { id: true }
                }
              }
            } 
          }
        },
        gpxSubmissions: true
      }
    });

    if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });

    // Re-issue token if role or status changed since last login
    const decoded = jwt.decode(token) as any;
    if (decoded?.status !== user.status || decoded?.role !== user.role) {
      const newToken = generateToken(user.id, user.role, user.status);
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
    }

    // Fetch GPX submissions where user is in participantIds array (PostgreSQL specific query)
    const participatedTracks = await prisma.gpxSubmission.findMany({
      where: {
        status: 'APPROVED',
        participantIds: {
          has: decoded.userId
        }
      }
    });

    // Merge uploaded and participated tracks for stats
    const allUserGpx = [...user.gpxSubmissions, ...participatedTracks];
    // Filter duplicates (in case user uploaded and is participant)
    const uniqueGpx = Array.from(new Map(allUserGpx.map(g => [g.id, g])).values());
    
    res.json({ user: { ...user, gpxSubmissions: uniqueGpx } });
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

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Pozwalamy na nadanie admina tylko jeśli w systemie nie ma jeszcze żadnego admina
    const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existingAdmin && existingAdmin.id !== decoded.userId) {
      return res.status(403).json({ error: 'Administrator już istnieje w systemie' });
    }

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { role: 'ADMIN', status: 'ACTIVE' }
    });

    // Odświeżamy token, aby zawierał nową rolę
    const newToken = generateToken(user.id, user.role, user.status);
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
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
