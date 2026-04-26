import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function migrate() {
  console.log('Running manual migration...');
  
  try {
    // Dodaj kolumnę featured do Event (jeśli nie istnieje)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Event" 
      ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('✓ Added featured column to Event');
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('  (featured column already exists)');
    } else {
      console.error('Error adding featured:', e.message);
    }
  }

  try {
    // Dodaj kolumnę notifyDaysBefore do EventParticipation (jeśli nie istnieje)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "EventParticipation" 
      ADD COLUMN IF NOT EXISTS "notifyDaysBefore" INTEGER
    `);
    console.log('✓ Added notifyDaysBefore column to EventParticipation');
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log('  (notifyDaysBefore column already exists)');
    } else {
      console.error('Error adding notifyDaysBefore:', e.message);
    }
  }

  console.log('Migration done!');
  await prisma.$disconnect();
}

migrate().catch(console.error);
