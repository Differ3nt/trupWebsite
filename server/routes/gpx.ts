import { Router } from 'express';
import multer from 'multer';
import { DOMParser } from '@xmldom/xmldom';
import { gpx } from '@tmcw/togeojson';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Konfiguracja multer do przyjmowania plików GPX w pamięci (bez zapisu na dysk serwera w tym module)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Middleware autoryzacyjny dla modułu GPX.
 */
const requireAuth = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Nieautoryzowany' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Nieprawidłowy token' });
  }
};

/**
 * Oblicza dystans pomiędzy dwoma punktami geograficznymi (szerokość/długość) w km.
 * Używa wzoru Haversine'a.
 */
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  var R = 6371; // Średni promień Ziemi w km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; 
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}

/**
 * 1. Przesyłanie i analiza pliku GPX.
 * Wyciąga dystans i czas trwania trasy z XMLa.
 */
router.post('/upload', requireAuth, upload.single('gpx'), async (req: any, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Brak pliku GPX' });
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: 'Brak powiązania z wydarzeniem' });

    const gpxString = req.file.buffer.toString('utf-8');
    const parser = new DOMParser();
    const gpxDoc = parser.parseFromString(gpxString, 'text/xml');
    
    // Konwersja GPX na GeoJSON dla łatwiejszego przetwarzania w JS
    const geoJSON = gpx(gpxDoc);

    if (geoJSON.features.length === 0) {
      return res.status(400).json({ error: 'Plik GPX nie zawiera poprawnych śladów (tracks)' });
    }

    let totalDistanceKm = 0;
    let startTime: Date | null = null;
    let endTime: Date | null = null;

    // Analiza ścieżek (LineString) w celu wyliczenia statystyk
    geoJSON.features.forEach(feature => {
      if (feature.geometry.type === 'LineString') {
        const coords = feature.geometry.coordinates;
        const times = feature.properties?.coordTimes; // Czasy poszczególnych punktów
        
        if (times && times.length > 0) {
          if (!startTime) startTime = new Date(times[0]);
          const currentEndTime = new Date(times[times.length - 1]);
          if (!endTime || currentEndTime > endTime) endTime = currentEndTime;
        }

        // Sumowanie dystansu między wszystkimi punktami śladu
        for (let i = 0; i < coords.length - 1; i++) {
          const lon1 = coords[i][0];
          const lat1 = coords[i][1];
          const lon2 = coords[i+1][0];
          const lat2 = coords[i+1][1];
          totalDistanceKm += getDistanceFromLatLonInKm(lat1, lon1, lat2, lat2);
        }
      }
    });

    let durationHours = 0;
    if (startTime && endTime) {
      const diffMs = endTime.getTime() - startTime.getTime();
      durationHours = diffMs / (1000 * 60 * 60);
    }

    // Zapisanie zgłoszenia do weryfikacji przez Admina
    const submission = await prisma.gpxSubmission.create({
      data: {
        userId: req.userId,
        eventId: eventId,
        filePath: 'path_to_disk_placeholder', // Docelowo można tu zapisać plik fizycznie
        distance: totalDistanceKm,
        duration: durationHours,
        status: 'PENDING'
      }
    });

    res.json({ success: true, submission, parsedData: { distance: totalDistanceKm, duration: durationHours } });

  } catch (error) {
    console.error('Błąd parsowania GPX:', error);
    res.status(500).json({ error: 'Wystąpił błąd podczas analizy pliku GPX' });
  }
});

/**
 * 2. Pobieranie kolejki tras oczekujących na zatwierdzenie (Tylko Admin).
 */
router.get('/queue', requireAuth, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Brak uprawnień' });

  const queue = await prisma.gpxSubmission.findMany({
    where: { status: 'PENDING' },
    include: { user: true, event: true }
  });
  
  res.json({ queue });
});

/**
 * 3. Zmiana statusu trasy (Akceptacja/Odrzucenie) przez Admina.
 */
router.patch('/:id/status', requireAuth, async (req: any, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Brak uprawnień' });

  const { status } = req.body; // APPROVED lub REJECTED
  
  const updated = await prisma.gpxSubmission.update({
    where: { id: req.params.id },
    data: { status }
  });

  res.json({ success: true, submission: updated });
});

export default router;
