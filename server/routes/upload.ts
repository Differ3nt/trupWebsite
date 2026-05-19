import { Router } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { invalidateWatermarkCache } from '../middleware/watermark';

const router = Router();
const prisma = new PrismaClient();

// Konfiguracja multer — zwiększony limit do 20MB dla obrazów wysokiej jakości
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // Limit: 20MB
});

// Upewnienie się, że folder uploads istnieje
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Helper: Przetwarzanie i zapisywanie tagów
 */
async function processTags(tagNames: string[] | string) {
  if (!tagNames) return [];
  const names = Array.isArray(tagNames) ? tagNames : tagNames.split(',').map(t => t.trim()).filter(Boolean);
  
  const tagObjects = await Promise.all(
    names.map(async (name) => {
      return prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name }
      });
    })
  );
  
  return tagObjects.map(tag => ({ id: tag.id }));
}

/**
 * 1. Upload zdjęcia do galerii (albumu).
 */
router.post('/image', upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku' });

    const albumId = req.body.albumId;
    if (!albumId) return res.status(400).json({ error: 'Brak ID albumu' });

    const tags = req.body.tags;
    const name = req.body.name || req.file.originalname;

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const originalName = `${uniqueSuffix}-orig.jpg`;
    const thumbnailName = `${uniqueSuffix}-thumb.webp`;

    const originalPath = path.join(UPLOADS_DIR, originalName);
    const thumbnailPath = path.join(UPLOADS_DIR, thumbnailName);

    let metadata: any = {};
    try {
      metadata = await sharp(req.file.buffer).metadata();

      await sharp(req.file.buffer)
        .jpeg({ quality: 90 })
        .toFile(originalPath);

      await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(thumbnailPath);
    } catch (sharpError) {
      console.warn('[UPLOAD] Sharp zawiódł, zapisuję surowe dane:', sharpError);
      fs.writeFileSync(originalPath, req.file.buffer);
      fs.writeFileSync(thumbnailPath, req.file.buffer);
    }

    const tagIds = await processTags(tags);

    const image = await prisma.image.create({
      data: {
        name,
        albumId,
        originalUrl: `/uploads/${originalName}`,
        thumbnailUrl: `/uploads/${thumbnailName}`,
        width: metadata.width,
        height: metadata.height,
        size: req.file.size,
        tags: {
          connect: tagIds
        }
      },
      include: {
        tags: true
      }
    });

    res.json({ success: true, image });
  } catch (error) {
    console.error('Błąd wgrywania zdjęcia:', error);
    res.status(500).json({ error: 'Nie udało się wgrać zdjęcia' });
  }
});

/**
 * 2. Pobieranie zdjęcia ze znakiem wodnym "TRUP".
 */
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await prisma.image.findUnique({ where: { id } });

    if (!image) return res.status(404).json({ error: 'Zdjęcie nie istnieje' });

    const originalPath = path.join(process.cwd(), image.originalUrl);
    
    const watermarkSvg = `
      <svg width="800" height="600">
        <text x="50%" y="50%" font-family="Arial" font-size="48" font-weight="bold" fill="rgba(255,255,255,0.3)" text-anchor="middle">
          TRUP.PL
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

/**
 * 3. Zaawansowany upload zdjęcia (jako asset strony).
 */
router.post('/upload-asset', upload.single('image'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku' });

    const tags = req.body.tags;
    const name = req.body.name || req.file.originalname;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(req.file.originalname) || '.jpg';
    const fileName = `${uniqueSuffix}${ext}`;
    const thumbName = `${uniqueSuffix}-thumb.webp`;
    
    const filePath = path.join(UPLOADS_DIR, fileName);
    const thumbPath = path.join(UPLOADS_DIR, thumbName);

    let metadata: any = {};
    try {
      metadata = await sharp(req.file.buffer).metadata();
      
      await sharp(req.file.buffer)
        .jpeg({ quality: 95, force: false })
        .toFile(filePath);

      await sharp(req.file.buffer)
        .resize({ width: 600, height: 600, fit: 'cover' })
        .webp({ quality: 80 })
        .toFile(thumbPath);
    } catch (e) {
      fs.writeFileSync(filePath, req.file.buffer);
      fs.writeFileSync(thumbPath, req.file.buffer);
    }

    const tagIds = await processTags(tags);

    const image = await prisma.image.create({
      data: {
        name,
        originalUrl: `/uploads/${fileName}`,
        thumbnailUrl: `/uploads/${thumbName}`,
        width: metadata.width,
        height: metadata.height,
        size: req.file.size,
        tags: {
          connect: tagIds
        }
      },
      include: {
        tags: true
      }
    });

    res.json({ success: true, image });
  } catch (error) {
    console.error('[UPLOAD-ASSET] Błąd:', error);
    res.status(500).json({ error: 'Błąd wgrywania pliku' });
  }
});

/**
 * 4. Wyszukiwanie zdjęcia.
 */
router.get('/search', async (req, res) => {
  try {
    const { query, tag } = req.query;
    
    const where: any = {};
    
    if (tag) {
      where.tags = {
        some: {
          name: {
            contains: tag as string,
            mode: 'insensitive'
          }
        }
      };
    } else if (query) {
      where.OR = [
        {
          tags: {
            some: {
              name: {
                contains: query as string,
                mode: 'insensitive'
              }
            }
          }
        },
        {
          name: {
            contains: query as string,
            mode: 'insensitive'
          }
        },
        {
          originalUrl: {
            contains: query as string,
            mode: 'insensitive'
          }
        }
      ];
    }

    const images = await prisma.image.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        tags: true
      }
    });
    
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Błąd wyszukiwania zdjęć' });
  }
});

/**
 * 5. Pobieranie wszystkich zdjęć.
 */
router.get('/all', async (req, res) => {
  try {
    const images = await prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tags: true
      }
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania listy zdjęć' });
  }
});

/**
 * 6. Aktualizacja zdjęcia (nazwa i tagi).
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, name } = req.body;

    const data: any = {};
    if (name) data.name = name;
    
    if (tags) {
      const tagIds = await processTags(tags);
      data.tags = {
        set: [], 
        connect: tagIds
      };
    }

    const image = await prisma.image.update({
      where: { id },
      data,
      include: {
        tags: true
      }
    });

    res.json(image);
  } catch (error) {
    res.status(500).json({ error: 'Błąd aktualizacji zdjęcia' });
  }
});

/**
 * 7. Usuwanie zdjęcia.
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const image = await prisma.image.findUnique({ where: { id } });
    
    if (!image) return res.status(404).json({ error: 'Zdjęcie nie istnieje' });

    const fullOriginalPath = path.join(process.cwd(), image.originalUrl);
    const fullThumbPath = image.thumbnailUrl ? path.join(process.cwd(), image.thumbnailUrl) : null;

    if (fs.existsSync(fullOriginalPath)) fs.unlinkSync(fullOriginalPath);
    if (fullThumbPath && fs.existsSync(fullThumbPath)) fs.unlinkSync(fullThumbPath);

    invalidateWatermarkCache(image.originalUrl);
    if (image.thumbnailUrl) invalidateWatermarkCache(image.thumbnailUrl);

    await prisma.image.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania zdjęcia' });
  }
});

export default router;
