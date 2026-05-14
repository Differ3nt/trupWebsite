import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('--- TEST DB ---');
    
    // 1. Sprawdź tabele
    const tables: any = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tabele w bazie:', tables.map((t: any) => t.table_name));

    // 2. Spróbuj pobrać użytkownika (pobieramy pierwszego lepszego)
    const users: any = await prisma.$queryRawUnsafe('SELECT * FROM "User" LIMIT 1');
    console.log('Użytkownik znaleziony:', users.length > 0 ? users[0].email : 'BRAK');

    if (users.length > 0) {
      const userId = users[0].id;
      console.log('Testuję participations dla ID:', userId);
      const participations: any = await prisma.$queryRawUnsafe(
        'SELECT p.*, (SELECT row_to_json(e) FROM "Event" e WHERE e.id = p."eventId") as event FROM "EventParticipation" p WHERE p."userId" = $1',
        userId
      );
      console.log('Participations count:', participations.length);
    }

  } catch (e) {
    console.error('BŁĄD TESTU:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
