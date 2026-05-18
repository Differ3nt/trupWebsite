import { Router } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { analyzeGpxFile } from '../lib/gpxUtils';
import { invalidateStatsCache } from './stats';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

// Konfiguracja multer do zapisu plików GPX na dysku
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/gpx';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

/**
 * 1. Przesyłanie i analiza pliku GPX.
 */
router.post('/upload', authenticate, upload.single('gpx'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku GPX' });
    const { eventId, participantIds, label, duration: manualDuration } = req.body;
    if (!eventId) return res.status(400).json({ error: 'Brak powiązania z wydarzeniem' });

    // Analiza pliku za pomocą nowej biblioteki
    const stats = await analyzeGpxFile(req.file.path);
    
    // Jeśli podano czas ręcznie, używamy go. W przeciwnym razie używamy tego z GPX.
    const finalDuration = manualDuration ? parseInt(manualDuration) : stats.duration;

    // Zapisanie zgłoszenia do bazy
    const submission = await prisma.gpxSubmission.create({
      data: {
        userId: req.userId,
        eventId: eventId,
        filePath: req.file.path,
        distance: stats.distance,
        elevationGain: stats.elevationGain,
        duration: finalDuration,
        participantIds: Array.isArray(participantIds) ? participantIds : JSON.parse(participantIds || '[]'),
        label: label || 'Trasa',
        status: 'PENDING'
      }
    });

    res.json({ success: true, submission });

  } catch (error: any) {
    console.error('Błąd parsowania GPX:', error);
    res.status(500).json({ error: error.message || 'Wystąpił błąd podczas analizy pliku GPX' });
  }
});

/**
 * 2. Pobieranie kolejki tras oczekujących na zatwierdzenie (Tylko Admin).
 */
router.get('/queue', authenticate, requireAdmin, async (req: any, res) => {

  const queue = await prisma.gpxSubmission.findMany({
    where: { status: 'PENDING' },
    include: { user: true, event: true }
  });
  
  res.json({ queue });
});

/**
 * 3. Zmiana statusu trasy (Akceptacja/Odrzucenie) przez Admina.
 */
router.patch('/:id/status', authenticate, requireAdmin, async (req: any, res) => {
  const { status } = req.body; // APPROVED lub REJECTED
  
  const updated = await prisma.gpxSubmission.update({
    where: { id: req.params.id },
    data: { status }
  });
  
  invalidateStatsCache();

  res.json({ success: true, submission: updated });
});

export default router;
