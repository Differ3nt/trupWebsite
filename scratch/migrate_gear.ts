import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Migrating: Adding gearCritical column...');
    await prisma.$executeRawUnsafe('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "gearCritical" TEXT[] DEFAULT \'{}\'');
    console.log('Migration successful!');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
