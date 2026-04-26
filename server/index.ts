import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Importy ruterów (obsługa poszczególnych modułów API)
import authRouter from './routes/auth';
import pushRouter from './routes/push';
import uploadRouter from './routes/upload';
import gpxRouter from './routes/gpx';
import searchRouter from './routes/search';
import eventsRouter from './routes/events';
import albumsRouter from './routes/albums';
import usersRouter from './routes/users';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

/**
 * Automatyczna weryfikacja i migracja struktury bazy danych przy starcie serwera.
 * Funkcja ta ręcznie dodaje brakujące kolumny lub tabele, co ułatwia rozwój aplikacji
 * bez konieczności każdorazowego tworzenia formalnych migracji Prisma w fazie dev.
 */
async function runMigrations() {
  try {
    // Sprawdzamy czy tabele używają wielkich czy małych liter (zależne od środowiska)
    const tableCheck = await prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Event', 'event')`
    );
    const actualTableName = tableCheck.length > 0 ? tableCheck[0].table_name : 'Event';

    const partCheck = await prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('EventParticipation', 'event_participation')`
    );
    const actualPartName = partCheck.length > 0 ? partCheck[0].table_name : 'EventParticipation';

    // Dodawanie nowych kolumn do tabeli Event (jeśli nie istnieją)
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "highlighted" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "isExpedition" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualPartName}" ADD COLUMN IF NOT EXISTS "notifyDaysBefore" INTEGER`);

    // Zmiana typów danych dla trudności i miejsc na liczby (INTEGER)
    const columnsCheck = await prisma.$queryRawUnsafe<any[]>(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${actualTableName}' AND column_name IN ('difficulty', 'spots')`
    );
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

    // Upewnienie się, że albumId w tabeli Image może być puste (np. dla zdjęć profilowych/tymczasowych)
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "Image" ALTER COLUMN "albumId" DROP NOT EXISTS');
    } catch (e) {
      // Ignorujemy jeśli tabela nie istnieje
    }

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

// Testowy punkt końcowy (Healthcheck)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TRUP API is running' });
});

// Udostępnianie folderu z wgranymi plikami (zdjęcia, trasy GPX) jako statycznych zasobów
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rejestracja rutów API
app.use('/api/auth', authRouter);     // Autoryzacja i użytkownicy Google
app.use('/api/push', pushRouter);     // Powiadomienia Web Push
app.use('/api/images', uploadRouter); // Wgrywanie i zarządzanie obrazami
app.use('/api/gpx', gpxRouter);       // Przesyłanie i analiza tras GPX
app.use('/api/search', searchRouter); // Wyszukiwarka globalna
app.use('/api/events', eventsRouter); // Wydarzenia i wyjazdy
app.use('/api/albums', albumsRouter); // Galerie zdjęć
app.use('/api/users', usersRouter);   // Zarządzanie profilami użytkowników

// Uruchomienie serwera
app.listen(PORT, async () => {
  console.log(`Serwer TRUP działa na http://localhost:${PORT}`);
  // Uruchamiamy sprawdzanie bazy danych po starcie
  await runMigrations();
});
