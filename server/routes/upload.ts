import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Konfiguracja multer — limit 5MB dla oszczędności miejsca na serwerze
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit: 5MB
});

// Upewnienie się, że folder uploads istnieje
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * 1. Upload zdjęcia do galerii (albumu).
 * Automatycznie generuje oryginał i zoptymalizowaną miniaturę WebP.
 */
router.post('/image', upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku' });

    const albumId = req.body.albumId;
    if (!albumId) return res.status(400).json({ error: 'Brak ID albumu' });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = `${uniqueSuffix}-orig.jpg`;
    const thumbnailName = `${uniqueSuffix}-thumb.webp`;

    const originalPath = path.join(UPLOADS_DIR, originalName);
    const thumbnailPath = path.join(UPLOADS_DIR, thumbnailName);

    try {
      // Przetwarzanie obrazu przy użyciu Sharp (optymalizacja i resize)
      await sharp(req.file.buffer)
        .jpeg({ quality: 85 })
        .toFile(originalPath);

      await sharp(req.file.buffer)
        .resize({ width: 600, withoutEnlargement: true })
        .webp({ quality: 60 })
        .toFile(thumbnailPath);
    } catch (sharpError) {
      console.warn('[UPLOAD] Sharp zawiódł, zapisuję surowe dane:', sharpError);
      fs.writeFileSync(originalPath, req.file.buffer);
      fs.writeFileSync(thumbnailPath, req.file.buffer);
    }

    // Zapis informacji o zdjęciu w bazie danych
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

/**
 * 2. Pobieranie zdjęcia ze znakiem wodnym "TRUP" generowanym w locie.
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await prisma.image.findUnique({ where: { id } });

    if (!image) return res.status(404).json({ error: 'Zdjęcie nie istnieje' });

    const originalPath = path.join(process.cwd(), image.originalUrl);
    
    // Dynamicznie generowany znak wodny w formacie SVG
    const watermarkSvg = `
      <svg width="800" height="600">
        <text x="50%" y="50%" font-family="Arial" font-size="48" font-weight="bold" fill="rgba(255,255,255,0.5)" text-anchor="middle">
          ZNAK TRUP
        </text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="trup-${id}.jpg"`);

    // Nakładanie warstwy SVG na zdjęcie i wysyłanie strumienia do przeglądarki
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

/**
 * 3. Prosty upload zdjęcia (np. dla tła wydarzenia lub awatara).
 */
router.post('/upload-simple', upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku' });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname) || '.jpg';
    const fileName = `${uniqueSuffix}${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    await sharp(req.file.buffer)
      .jpeg({ quality: 80, force: false })
      .toFile(filePath);

    const url = `/uploads/${fileName}`;

    await prisma.image.create({
      data: {
        originalUrl: url,
        thumbnailUrl: url 
      }
    });

    res.json({ success: true, url });
  } catch (error) {
    console.error('[UPLOAD-SIMPLE] Błąd:', error);
    res.status(500).json({ error: 'Błąd wgrywania pliku' });
  }
});

/**
 * 4. Pobieranie listy wszystkich zdjęć dostępnych w systemie (do wyboru w panelu Admina).
 */
router.get('/all', async (req, res) => {
  try {
    const images = await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      select: { originalUrl: true, thumbnailUrl: true }
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania listy zdjęć' });
  }
});

export default router;
