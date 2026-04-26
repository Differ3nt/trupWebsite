import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

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

// Automatyczna migracja przy starcie serwera
async function runMigrations() {
  try {
    const tableCheck = await prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('Event', 'event')`
    );
    const actualTableName = tableCheck.length > 0 ? tableCheck[0].table_name : 'Event';

    const partCheck = await prisma.$queryRawUnsafe<any[]>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('EventParticipation', 'event_participation')`
    );
    const actualPartName = partCheck.length > 0 ? partCheck[0].table_name : 'EventParticipation';

    // Automatyczna migracja nowych kolumn
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "highlighted" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN IF NOT EXISTS "isExpedition" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "${actualPartName}" ADD COLUMN IF NOT EXISTS "notifyDaysBefore" INTEGER`);

    // Zmiana typów: difficulty i spots na INTEGER
    const columnsCheck = await prisma.$queryRawUnsafe<any[]>(
      `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${actualTableName}' AND column_name IN ('difficulty', 'spots')`
    );
    for (const col of columnsCheck) {
      if (col.data_type !== 'integer') {
        await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" DROP COLUMN "${col.column_name}"`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "${actualTableName}" ADD COLUMN "${col.column_name}" INTEGER`);
      }
    }

    // Migracja: Dodanie mapEmbed do Event
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "mapEmbed" TEXT');
    } catch (e) {
      console.log('mapEmbed column might already exist');
    }

    // Dodajemy kolumnę gearCritical jeśli nie istnieje
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "gearCritical" TEXT[] DEFAULT '{}';
    `);

    // 2. Notification (Historia powiadomień)
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
    
    // Dodajemy kolumnę attended jeśli nie istnieje
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "EventParticipation" ADD COLUMN IF NOT EXISTS "attended" BOOLEAN DEFAULT false;
    `);

    // Migracja: Image.albumId na nullable
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "Image" ALTER COLUMN "albumId" DROP NOT EXISTS');
      console.log('[DB] Image.albumId is now nullable');
    } catch (e) {
      console.log('Image table might not exist yet or column already nullable');
    }

    console.log('[DB] Struktura bazy danych zweryfikowana pomyślnie');
  } catch (e: any) {
    console.warn('[DB] Uwaga podczas migracji:', e.message?.slice(0, 120));
  }
}


// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Basic healthcheck route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TRUP API is running' });
});

// Serve static uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/push', pushRouter);
app.use('/api/images', uploadRouter);
app.use('/api/gpx', gpxRouter);
app.use('/api/search', searchRouter);
app.use('/api/events', eventsRouter);
app.use('/api/albums', albumsRouter);
app.use('/api/users', usersRouter);

// Start Server + run migrations
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await runMigrations();
});
// trigger restart Fri Apr 24 22:07:43 CEST 2026
// trigger restart Sat Apr 25 10:18:36 CEST 2026
