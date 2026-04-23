import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Konfiguracja multer - zapis tymczasowy w pamięci dla szybszego przetworzenia
const storage = multer.memoryStorage();
const upload = multer({ storage });

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// 1. Upload zdjęcia do galerii i generowanie miniatury WebP
router.post('/image', upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku' });

    const albumId = req.body.albumId; // Musi być podany w formdata
    if (!albumId) return res.status(400).json({ error: 'Brak ID albumu' });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = `${uniqueSuffix}-orig.jpg`;
    const thumbnailName = `${uniqueSuffix}-thumb.webp`;

    const originalPath = path.join(UPLOADS_DIR, originalName);
    const thumbnailPath = path.join(UPLOADS_DIR, thumbnailName);

    // Zapis oryginału
    await sharp(req.file.buffer)
      .jpeg({ quality: 85 })
      .toFile(originalPath);

    // Zapis lekkiej miniatury
    await sharp(req.file.buffer)
      .resize({ width: 600, withoutEnlargement: true })
      .webp({ quality: 60 })
      .toFile(thumbnailPath);

    // Zapis do bazy
    const image = await prisma.image.create({
      data: {
        albumId,
        originalUrl: `/uploads/${originalName}`,
        thumbnailUrl: `/uploads/${thumbnailName}`
      }
    });

    res.json({ success: true, image });
  } catch (error) {
    console.error('Błąd wgrywania zdjęcia:', error);
    res.status(500).json({ error: 'Nie udało się wgrać zdjęcia' });
  }
});

// 2. Pobieranie zdjęcia ze znakiem wodnym w locie
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await prisma.image.findUnique({ where: { id } });

    if (!image) return res.status(404).json({ error: 'Zdjęcie nie istnieje' });

    const originalPath = path.join(process.cwd(), image.originalUrl);
    
    // Uproszczone: Nakładanie znaku wodnego z tekstem na środek (docelowo logo.png kompozytowane)
    const watermarkSvg = `
      <svg width="800" height="600">
        <text x="50%" y="50%" font-family="Arial" font-size="48" font-weight="bold" fill="rgba(255,255,255,0.5)" text-anchor="middle">
          TRUP
        </text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="trup-${id}.jpg"`);

    await sharp(originalPath)
      .composite([{
        input: Buffer.from(watermarkSvg),
        gravity: 'center'
      }])
      .jpeg({ quality: 90 })
      .pipe(res);

  } catch (error) {
    console.error('Błąd pobierania zdjęcia:', error);
    res.status(500).json({ error: 'Nie udało się przetworzyć obrazu' });
  }
});

export default router;
