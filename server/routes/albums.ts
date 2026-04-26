import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Pobieranie wszystkich albumów z okładką (pierwszym zdjęciem)
router.get('/', async (req, res) => {
  try {
    const albums: any = await prisma.$queryRaw`SELECT * FROM "Album" ORDER BY date DESC`;
    
    // Dla każdego albumu pobieramy okładkę (pierwsze zdjęcie)
    const albumsWithImages = await Promise.all(albums.map(async (album: any) => {
      const images: any = await prisma.$queryRaw`
        SELECT * FROM "Image" WHERE "albumId" = ${album.id} LIMIT 1
      `;
      return { ...album, images: images || [] };
    }));

    res.json(albumsWithImages);
  } catch (error) {
    console.error('Błąd pobierania albumów:', error);
    res.status(500).json({ error: 'Nie udało się pobrać albumów' });
  }
});

// Pobieranie pojedynczego albumu ze wszystkimi zdjęciami
router.get('/:id', async (req, res) => {
  try {
    const albums: any = await prisma.$queryRaw`SELECT * FROM "Album" WHERE id = ${req.params.id}`;
    
    if (!albums || !albums.length) return res.status(404).json({ error: 'Album nie znaleziony' });
    const album = albums[0];

    const images: any = await prisma.$queryRaw`
      SELECT * FROM "Image" WHERE "albumId" = ${album.id} ORDER BY "createdAt" ASC
    `;

    res.json({ ...album, images: images || [] });
  } catch (error) {
    console.error('Błąd pobierania albumu:', error);
    res.status(500).json({ error: 'Nie udało się pobrać albumu' });
  }
});

export default router;
