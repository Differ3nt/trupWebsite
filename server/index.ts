import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { prisma } from './lib/prisma';

// Importy ruterów (obsługa poszczególnych modułów API)
import authRouter from './routes/auth';
import pushRouter from './routes/push';
import uploadRouter from './routes/upload';
import gpxRouter from './routes/gpx';
import searchRouter from './routes/search';
import eventsRouter from './routes/events';
import albumsRouter from './routes/albums';
import usersRouter from './routes/users';
import wikiRouter from './routes/wiki';
import newsRouter from './routes/news';
import statsRouter from './routes/stats';
import { watermarkMiddleware } from './middleware/watermark';




const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Automatyczna weryfikacja i migracja struktury bazy danych przy starcie serwera.
 * Funkcja ta ręcznie dodaje brakujące kolumny lub tabele, co ułatwia rozwój aplikacji
 * bez konieczności każdorazowego tworzenia formalnych migracji Prisma w fazie dev.
 */
async function runMigrations() {
  try {
    // Sprawdzamy czy tabele używają wielkich czy małych liter (zależne od środowiska)
    const tableCheck = await prisma.$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Event', 'event')`
    ) as any[];
    const actualTableName = tableCheck.length > 0 ? tableCheck[0].table_name : 'Event';

    const partCheck = await prisma.$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('EventParticipation', 'event_participation')`
    ) as any[];
    const actualPartName = partCheck.length > 0 ? partCheck[0].table_name : 'EventParticipation';

    // Dodawanie nowych kolumn do tabeli Event (jeśli nie istnieją)
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "highlighted" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "isExpedition" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualPartName}" ADD COLUMN IF NOT EXISTS "notifyDaysBefore" INTEGER`);

    // Zmiana typów danych dla trudności i miejsc na liczby (INTEGER)
    const columnsCheck = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${actualTableName}' AND column_name IN ('difficulty', 'spots')`
    ) as any[];
    for (const col of columnsCheck) {
      if (col.data_type !== 'integer') {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" DROP COLUMN "${col.column_name}"`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN "${col.column_name}" INTEGER`);
      }
    }

    // Dodanie mapEmbed do Event
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "mapEmbed" TEXT');
    } catch (e) {
      console.log('mapEmbed column might already exist');
    }

    // Dodanie sprzętu obowiązkowego (gearCritical)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "gearCritical" TEXT[] DEFAULT '{}';
    `);

    // Ręczne tworzenie tabeli Notification, jeśli Prisma jej jeszcze nie wygenerowała
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'SYSTEM',
        "url" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    
    // Dodanie kolumny attended (obecność)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "EventParticipation" ADD COLUMN IF NOT EXISTS "attended" BOOLEAN DEFAULT false;
    `);

    // Dodanie kolumny transport (dojazd) do tabeli Event
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "transport" TEXT;
    `);

    // Dodanie nowych pól: organizator, miejsce zbiórki, pogoda
    await prisma.$executeRawUnsafe(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "organizer" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "meetingPointName" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "meetingPointLink" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "meetingPointEmbed" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "weatherInfo" TEXT`);


    // Upewnienie się, że albumId w tabeli Image może być puste (np. dla zdjęć profilowych/tymczasowych)
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "Image" ALTER COLUMN "albumId" DROP NOT EXISTS');
    } catch (e) {}

    // Tworzenie tabeli WikiArticle
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WikiArticle" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "authorId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);

    // Tworzenie tabeli NewsItem
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "NewsItem" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "content" TEXT,
        "type" TEXT NOT NULL DEFAULT 'GENERAL',
        "imageUrl" TEXT,
        "link" TEXT,
        "eventId" TEXT,
        "articleId" TEXT,
        "priority" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )
    `);

    // --- NOWE KOLUMNY DLA ROZLICZEŃ ---
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "isFinalized" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "actualDistance" DOUBLE PRECISION`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "actualElevation" DOUBLE PRECISION`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "imageFocalX" DOUBLE PRECISION DEFAULT 50`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "imageFocalY" DOUBLE PRECISION DEFAULT 50`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "plannedDistance" DOUBLE PRECISION`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "plannedElevation" DOUBLE PRECISION`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "plannedDuration" DOUBLE PRECISION`);

    // Sprawdzenie nazwy tabeli GpxSubmission
    const gpxCheck = await prisma.$queryRawUnsafe(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('GpxSubmission', 'gpx_submission')`
    ) as any[];
    const actualGpxName = gpxCheck.length > 0 ? gpxCheck[0].table_name : 'GpxSubmission';

    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualGpxName}" ADD COLUMN IF NOT EXISTS "elevationGain" DOUBLE PRECISION`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualGpxName}" ADD COLUMN IF NOT EXISTS "participantIds" TEXT[] DEFAULT '{}'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualGpxName}" ADD COLUMN IF NOT EXISTS "isOfficial" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualGpxName}" ADD COLUMN IF NOT EXISTS "label" TEXT`);

    console.log('[DB] Struktura bazy danych zweryfikowana pomyślnie');
  } catch (e: any) {
    console.warn('[DB] Uwaga podczas migracji:', e.message?.slice(0, 120));
  }
}

// Konfiguracja Middleware
app.use(cors({
  // Zezwalamy na połączenia z frontendu (domyślnie localhost:5173 dla Vite)
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Pozwala na przesyłanie ciasteczek (autoryzacja)
}));
app.use(express.json()); // Parsowanie body w formacie JSON
app.use(cookieParser()); // Parsowanie ciasteczek
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://lh3.googleusercontent.com', 'https://*.googleusercontent.com', 'https://*.tile.openstreetmap.org'],
      connectSrc: ["'self'"],
      frameSrc: ["'self'", 'https://*.mapy.cz', 'https://frame.mapy.cz'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
    }
  }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

// Testowy punkt końcowy (Healthcheck)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TRUP API is running' });
});

// Images served via watermarkMiddleware (caches watermarked copies, originals untouched)
// Non-image files (GPX etc.) fall through to static
app.use('/uploads', watermarkMiddleware, express.static(path.join(process.cwd(), 'uploads')));

// Rejestracja rutów API
app.use('/api/auth', authLimiter, authRouter);     // Autoryzacja i użytkownicy Google
app.use('/api/push', pushRouter);     // Powiadomienia Web Push
app.use('/api/images', uploadLimiter, uploadRouter); // Wgrywanie i zarządzanie obrazami
app.use('/api/gpx', gpxRouter);       // Przesyłanie i analiza tras GPX
app.use('/api/search', searchRouter); // Wyszukiwarka globalna
app.use('/api/events', eventsRouter); // Wydarzenia i wyjazdy
app.use('/api/albums', albumsRouter); // Galerie zdjęć
app.use('/api/users', usersRouter);   // Zarządzanie profilami użytkowników
app.use('/api/wiki', wikiRouter);     // Baza wiedzy Wiki
app.use('/api/news', newsRouter);     // System aktualności
app.use('/api/stats', statsRouter);   // Statystyki grupy


// Serve built frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Uruchomienie serwera
app.listen(PORT, async () => {
  console.log(`Serwer TRUP działa na http://localhost:${PORT}`);
  // Uruchamiamy sprawdzanie bazy danych po starcie
  await runMigrations();
});
 
