import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * Pobieranie listy wszystkich albumów wraz z okładką (pierwszym zdjęciem).
 */
router.get('/', async (req, res) => {
  try {
    const albums: any = await prisma.$queryRaw`SELECT * FROM "Album" ORDER BY date DESC`;
    
    // Dla każdego albumu pobieramy okładkę, aby wyświetlić ją na liście galerii
    const albumsWithImages = await Promise.all(albums.map(async (album: any) => {
      const images: any = await prisma.$queryRaw`
        SELECT * FROM "Image" WHERE "albumId" = ${album.id} LIMIT 1
      `;
      return { ...album, images: images || [] };
    }));

    res.json(albumsWithImages);
  } catch (error) {
    console.error('Błąd pobierania albumów:', error);
    res.status(500).json({ error: 'Nie udało się pobrać listy albumów' });
  }
});

/**
 * Pobieranie szczegółów pojedynczego albumu wraz ze wszystkimi zdjęciami.
 */
router.get('/:id', async (req, res) => {
  try {
    const albums: any = await prisma.$queryRaw`SELECT * FROM "Album" WHERE id = ${req.params.id}`;
    
    if (!albums || !albums.length) return res.status(404).json({ error: 'Album nie został znaleziony' });
    const album = albums[0];

    const images: any = await prisma.$queryRaw`
      SELECT * FROM "Image" WHERE "albumId" = ${album.id} ORDER BY "createdAt" ASC
    `;

    res.json({ ...album, images: images || [] });
  } catch (error) {
    console.error('Błąd pobierania albumu:', error);
    res.status(500).json({ error: 'Nie udało się pobrać zawartości albumu' });
  }
});

export default router;
