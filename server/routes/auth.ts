import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3001/api/auth/google/callback'
);

// Helper do generowania tokena JWT
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

// 1. Inicjacja logowania - przekierowanie do Google
router.get('/google', (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    prompt: 'consent'
  });
  res.redirect(url);
});

// 2. Odbiór kodu z Google i logowanie/rejestracja użytkownika
router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) throw new Error('Brak kodu autoryzacyjnego');

    const { tokens } = await oAuth2Client.getToken(code as string);
    oAuth2Client.setCredentials(tokens);

    // Pobranie danych profilu
    const userInfo = await oAuth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const data = userInfo.data as any;

    if (!data.email) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=no_email`);
    }

    // Szukamy lub tworzymy użytkownika w bazie (Upsert)
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

    // Zapis tokena w HttpOnly Cookie
    const token = generateToken(user.id);
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // W dev używamy HTTP
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dni
    });

    // Powrót na frontend
    res.redirect(process.env.CLIENT_URL || 'http://localhost:5173');
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/?error=auth_failed`);
  }
});

// 3. Weryfikacja tożsamości na froncie (/api/auth/me)
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Nieautoryzowany' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    
    const users: any = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${decoded.userId}`;

    if (!users || !users.length) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
    
    let participations: any = [];
    try {
      participations = await prisma.$queryRaw`
        SELECT p.*, (SELECT row_to_json(e) FROM "Event" e WHERE e.id = p."eventId") as event 
        FROM "EventParticipation" p WHERE p."userId" = ${decoded.userId}
      `;
    } catch (e) {
      console.warn('Participations query failed, returning empty:', e);
    }

    res.json({ user: { ...users[0], participations: participations || [] } });
  } catch (error: any) {
    console.error('Błąd /me:', error);
    res.status(500).json({ error: 'Błąd serwera podczas weryfikacji sesji', details: error.message });
  }
});

// Bootstrap: Ustaw siebie jako Admina (tylko jeśli brak innych Adminów)
router.post('/make-admin', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Nieautoryzowany' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };

    // Sprawdź czy w bazie nie ma już admina
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

// Wylogowanie
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

export default router;
