import { PrismaClient } from '@prisma/client';

/**
 * Skrypt do zasilania bazy danych (seeding).
 * Uruchamiany zazwyczaj przy pierwszej instalacji lub w celach testowych.
 * Komenda: npx prisma db seed
 */

const prisma = new PrismaClient();

async function main() {
  console.log('Zasilanie bazy danych przykładowymi danymi...');

  // 1. Przykładowe Wydarzenie (Event)
  // Używamy upsert, aby uniknąć błędów przy wielokrotnym uruchamianiu skryptu
  const event = await prisma.event.upsert({
    where: { id: 'seed-event-1' },
    update: {},
    create: {
      id: 'seed-event-1',
      title: 'Zimowe Tatry: Orla Perć',
      description: 'Wymagająca zimowa przeprawa przez najtrudniejszy szlak w Tatrach. Wymagane doświadczenie w posługiwaniu się czekanem i rakami.',
      dateStart: new Date('2024-12-15'),
      dateEnd: new Date('2024-12-18'),
      location: 'Tatry Wysokie',
      difficulty: 5, // Trudność jako liczba 1-5 (zgodnie ze schema)
      spots: 12,     // Liczba miejsc jako liczba
      type: 'GÓRY',
      gearRequired: ['Kask', 'Czekan', 'Raki', 'Uprząż'],
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b' // Przykładowe zdjęcie
    }
  });

  // 2. Przykładowy Album ze zdjęciami
  const album = await prisma.album.upsert({
    where: { id: 'seed-album-1' },
    update: {},
    create: {
      id: 'seed-album-1',
      title: 'Bieszczady Jesień',
      description: 'Złota polska jesień na Połoninach.',
      date: new Date('2023-10-15'),
      location: 'Bieszczady'
    }
  });

  console.log('Baza została pomyślnie zasilona!');
}

main()
  .catch((e) => {
    console.error('Błąd podczas zasilania bazy:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Rozłączenie z bazą danych po zakończeniu operacji
    await prisma.$disconnect();
  });
