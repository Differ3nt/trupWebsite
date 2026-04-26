import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Zasilanie bazy danych...');

  // 1. Przykładowe Wydarzenie
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
      difficulty: 'Ekspert',
      spots: '12 wolnych miejsc',
      type: 'GÓRY',
      gearRequired: ['Kask', 'Czekan', 'Raki', 'Uprząż'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR5pO5QgFSNLU9L3FbHsULwCRMGO34kqt9OZ-XZxhW0DB_HZsXLqHWcsBQ0aMS0ysZc83MYvmEM1NO9JCPPKhU_MxzI8hIDaIqW8zJ_rrVgjm7oSpOll3ll9RnWZ7dSb8KtwvCAKiaWqxXyDhvkYexfztMYCKBIilPXMd1xilcN8abxVRtf1LTzZoQwUu5Gb-gGxTIl9K6JqR23QrN8JjJ7Ixe8SZWHUSybdNyPrVcZQaj0xjAhytQI3XDHaoZCeD72GRo6Zl_VMA'
    }
  });

  // 2. Przykładowy Album
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

  console.log('Baza zasilona!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
