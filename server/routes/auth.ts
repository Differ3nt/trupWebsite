import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'postmessage' // Używamy postmessage dla przepływu bez pełnego przekierowania (lub pełne URL przekierowania)
);

// Helper do generowania tokena JWT
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

// 1. Generowanie URL logowania (jeśli chcemy pełny redirect)
router.get('/google/url', (req, res) => {
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    prompt: 'consent'
  });
  res.json({ url });
});

// 2. Odbiór kodu z Google i logowanie/rejestracja użytkownika
router.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Pobranie danych profilu
    const userInfo = await oAuth2Client.request({
      url: 'https://www.googleapis.com/oauth2/v3/userinfo'
    });

    const data = userInfo.data as any;

    if (!data.email) {
      return res.status(400).json({ error: 'Brak adresu email z Google' });
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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dni
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Błąd uwierzytelniania Google' });
  }
});

// 3. Weryfikacja tożsamości na froncie (/api/auth/me)
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Nieautoryzowany' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Nieprawidłowy token' });
  }
});

// 4. Wylogowanie
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

export default router;
