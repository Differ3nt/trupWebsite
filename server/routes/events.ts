import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Pomocnicza funkcja do wyciągania ID użytkownika z ciasteczka tokena.
 * Pozwala sprawdzić status zalogowania w trasach publicznych (gdzie logowanie nie jest wymagane, ale zmienia wynik).
 */
function getUserIdFromCookie(req: any): string | null {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.cookies?.token;
    if (!token) return null;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded.userId ?? null;
  } catch {
    return null;
  }
}

/**
 * Pobiera listę wszystkich wydarzeń.
 * Jeśli upcoming=true, zwraca tylko przyszłe wydarzenia.
 * Dołącza informację o liczbie uczestników i statusie aktualnego użytkownika.
 */
router.get('/', async (req: any, res) => {
  try {
    const { upcoming } = req.query;
    const userId = getUserIdFromCookie(req);
    const uid = userId || null;
    
    // Zapytanie SQL zliczające uczestników i pobierające status zalogowanego (INTERESTED/GOING)
    const query = upcoming === 'true' 
      ? `SELECT e.*, 
          (SELECT COUNT(*)::int FROM "EventParticipation" p WHERE p."eventId" = e.id AND p.status = 'GOING') as "goingCount",
          (SELECT status FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = $1) as "userStatus"
        FROM "Event" e WHERE e."dateStart" >= NOW() ORDER BY e."dateStart" ASC`
      : `SELECT e.*, 
          (SELECT COUNT(*)::int FROM "EventParticipation" p WHERE p."eventId" = e.id AND p.status = 'GOING') as "goingCount",
          (SELECT status FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = $1) as "userStatus"
        FROM "Event" e ORDER BY e."dateStart" ASC`;
    
    const events = await prisma.$queryRawUnsafe(query, uid);
    res.json(events);
  } catch (error: any) {
    console.error('Błąd pobierania wydarzeń:', error);
    res.status(500).json({ error: 'Nie udało się pobrać listy wydarzeń' });
  }
});

/**
 * Pobiera wyróżnione wydarzenia do sekcji "Aktualności" (strona główna).
 */
router.get('/featured', async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const events: any = await prisma.$queryRaw`
      SELECT e.*, 
        (SELECT COUNT(*)::int FROM "EventParticipation" p WHERE p."eventId" = e.id AND p.status = 'GOING') as "goingCount",
        (SELECT status FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = ${userId || null}) as "userStatus"
      FROM "Event" e 
      WHERE e."featured" = true AND e."dateStart" >= NOW() 
      ORDER BY e."dateStart" ASC LIMIT 6
    `;
    res.json(events);
  } catch (error: any) {
    console.error('Błąd pobierania featured:', error);
    res.status(500).json({ error: 'Nie udało się pobrać wyróżnionych wydarzeń' });
  }
});

/**
 * Pobiera osiągnięcia grupy (archiwalne, ważne wyjazdy) na stronę główną.
 */
router.get('/highlighted', async (req, res) => {
  try {
    const userId = getUserIdFromCookie(req);
    const events: any = await prisma.$queryRaw`
      SELECT e.*,
        (SELECT COUNT(*)::int FROM "EventParticipation" p WHERE p."eventId" = e.id AND p.status = 'GOING') as "goingCount",
        (SELECT status FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = ${userId || null}) as "userStatus"
      FROM "Event" e 
      WHERE e."highlighted" = true 
      ORDER BY e."dateStart" DESC LIMIT 6
    `;
    res.json(events);
  } catch (error: any) {
    console.error('Błąd pobierania highlighted:', error);
    res.status(500).json({ error: 'Nie udało się pobrać osiągnięć' });
  }
});

/**
 * Pobiera szczegóły konkretnego wydarzenia wraz z pełną listą uczestników.
 */
router.get('/:id', async (req: any, res) => {
  try {
    let userId: string | null = getUserIdFromCookie(req);

    const events: any = await prisma.$queryRaw`SELECT * FROM "Event" WHERE id = ${req.params.id}`;

    if (!events.length) return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione' });
    const event = events[0];

    // Pobranie danych uczestników (nazwa, awatar, status obecności)
    const participants: any = await prisma.$queryRaw`
      SELECT p.*, (SELECT json_build_object('id', u.id, 'name', u.name, 'avatarUrl', u."avatarUrl") FROM "User" u WHERE u.id = p."userId") as user
      FROM "EventParticipation" p WHERE p."eventId" = ${req.params.id}
    `;

    // Informacja o statusie RSVP aktualnie zalogowanego użytkownika
    let myRsvp: string | null = null;
    let myNotifyDays: number | null = null;
    if (userId) {
      const participations: any = await prisma.$queryRaw`
        SELECT status, "notifyDaysBefore" FROM "EventParticipation" WHERE "userId" = ${userId} AND "eventId" = ${req.params.id}
      `;
      myRsvp = participations[0]?.status ?? null;
      myNotifyDays = participations[0]?.notifyDaysBefore ?? null;
    }

    res.json({ ...event, participants: participants || [], myRsvp, myNotifyDays });
  } catch (error: any) {
    console.error('Błąd pobierania wydarzenia:', error);
    res.status(500).json({ error: 'Nie udało się pobrać szczegółów wydarzenia' });
  }
});

/**
 * Aktualizuje status faktycznej obecności użytkownika (tylko Admin).
 */
router.patch('/:id/attendance', authenticate, async (req: any, res) => {
  try {
    const { userId, attended } = req.body;
    const eventId = req.params.id;

    await prisma.$executeRaw`
      UPDATE "EventParticipation" SET attended = ${attended === true}
      WHERE "userId" = ${userId} AND "eventId" = ${eventId}
    `;
    res.json({ success: true });
  } catch (error) {
    console.error('Błąd aktualizacji frekwencji:', error);
    res.status(500).json({ error: 'Błąd zapisu frekwencji' });
  }
});

/**
 * Tworzy nowe wydarzenie.
 * Automatycznie generuje ID w formacie: RRRR_NR_KOD (np. 2024_05_WYP).
 */
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { 
      title, description, dateStart, dateEnd, location, mapLink, mapEmbed,
      difficulty, spots, type, gearRequired, gearCritical, 
      image, isExpedition, featured, highlighted 
    } = req.body;

    if (!title || !dateStart || !type) {
      return res.status(400).json({ error: 'Brak wymaganych pól' });
    }

    // Skróty typów dla czytelniejszego ID
    const typeMap: Record<string, string> = {
      'GÓRY': 'WYP',
      'EKSPEDYCJA': 'EKS',
      'INTEGRACJA': 'INT',
      'KULTURA': 'KUL',
      'PIWO': 'PIW'
    };
    const typeCode = typeMap[type] || 'INNE';

    // Generowanie kolejnego numeru wydarzenia w danym roku
    const year = new Date(dateStart).getFullYear();
    const count: any = await prisma.$queryRaw`
      SELECT COUNT(*)::int as total FROM "Event" WHERE EXTRACT(YEAR FROM "dateStart") = ${year}
    `;
    const nextNum = (count[0]?.total || 0) + 1;
    const eventId = `${year}_${String(nextNum).padStart(2, '0')}_${typeCode}`;

    await prisma.$executeRaw`
      INSERT INTO "Event" (
        id, title, description, "dateStart", "dateEnd", location, "mapLink", "mapEmbed",
        difficulty, spots, type, "gearRequired", "gearCritical", image, "isExpedition", 
        featured, highlighted, "createdAt", "updatedAt"
      ) VALUES (
        ${eventId}, ${title}, ${description}, ${new Date(dateStart)}, 
        ${dateEnd ? new Date(dateEnd) : null}, ${location}, ${mapLink}, ${mapEmbed},
        ${difficulty ? Number(difficulty) : null}, ${spots ? Number(spots) : null}, 
        ${type}, ${gearRequired || []}, ${gearCritical || []}, ${image}, 
        ${isExpedition === true}, ${featured === true}, ${highlighted === true}, NOW(), NOW()
      )
    `;

    res.json({ success: true, eventId });
  } catch (error: any) {
    console.error('Błąd tworzenia wydarzenia:', error);
    res.status(500).json({ error: 'Błąd zapisu nowego wydarzenia' });
  }
});

/**
 * Edytuje istniejące wydarzenie.
 */
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, dateStart, dateEnd, location, mapLink, mapEmbed,
      difficulty, spots, type, gearRequired, gearCritical, 
      image, isExpedition, featured, highlighted 
    } = req.body;

    await prisma.$executeRaw`
      UPDATE "Event" SET 
        title = ${title}, 
        description = ${description}, 
        "dateStart" = ${new Date(dateStart)}, 
        "dateEnd" = ${dateEnd ? new Date(dateEnd) : null}, 
        location = ${location}, 
        "mapLink" = ${mapLink}, 
        "mapEmbed" = ${mapEmbed},
        difficulty = ${difficulty ? Number(difficulty) : null}, 
        spots = ${spots ? Number(spots) : null}, 
        type = ${type}, 
        "gearRequired" = ${gearRequired || []}, 
        "gearCritical" = ${gearCritical || []},
        image = ${image}, 
        "isExpedition" = ${isExpedition === true}, 
        featured = ${featured === true}, 
        highlighted = ${highlighted === true}, 
        "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    res.json({ success: true });
  } catch (error: any) {
    console.error('Błąd edycji wydarzenia:', error);
    res.status(500).json({ error: 'Błąd podczas aktualizacji danych' });
  }
});

/**
 * Obsługuje deklarację udziału (RSVP) przez użytkownika.
 * status: 'GOING' (jadę), 'INTERESTED' (zainteresowany) lub null (usuń rsvp).
 */
router.post('/:id/rsvp', authenticate, async (req: any, res) => {
  try {
    const { status, notifyDaysBefore } = req.body;
    const eventId = req.params.id;
    const userId = req.userId;

    // Jeśli status jest null, usuwamy użytkownika z listy uczestników
    if (status === null) {
      await prisma.$executeRaw`DELETE FROM "EventParticipation" WHERE "userId" = ${userId} AND "eventId" = ${eventId}`;
      return res.json({ success: true, status: null });
    }

    if (!['INTERESTED', 'GOING'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status uczestnictwa' });
    }

    const partId = `part_${Date.now()}`;
    // Upsert — jeśli rekord już istnieje, aktualizujemy go, jeśli nie — tworzymy nowy
    await prisma.$executeRaw`
      INSERT INTO "EventParticipation" (id, "userId", "eventId", status, "notifyDaysBefore", "createdAt")
      VALUES (${partId}, ${userId}, ${eventId}, ${status}, ${notifyDaysBefore ?? null}, NOW())
      ON CONFLICT ("userId", "eventId") DO UPDATE SET status = EXCLUDED.status, "notifyDaysBefore" = EXCLUDED."notifyDaysBefore"
    `;

    res.json({ success: true, status });
  } catch (error) {
    console.error('Błąd RSVP:', error);
    res.status(500).json({ error: 'Nie udało się zapisać Twojej deklaracji' });
  }
});

/**
 * Szybkie przełączanie statusów 'featured' i 'highlighted' (tylko Admin).
 */
router.patch('/:id/featured', authenticate, async (req: any, res) => {
  try {
    const { featured, highlighted } = req.body;
    
    // Pobieramy aktualne dane, jeśli nie zostały przesłane w body
    const event: any = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Wydarzenie nie istnieje' });

    await prisma.$executeRaw`
      UPDATE "Event" SET 
        featured = ${featured !== undefined ? Boolean(featured) : event.featured},
        highlighted = ${highlighted !== undefined ? Boolean(highlighted) : event.highlighted}
      WHERE id = ${req.params.id}
    `;

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Nie udało się zaktualizować statusu' });
  }
});

/**
 * Usuwa wydarzenie wraz z powiązanymi danymi (uczestnictwo, zgłoszenia GPX).
 */
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    // Ważne: najpierw usuwamy rekordy z tabel zależnych (Klucze obce)
    await prisma.$executeRaw`DELETE FROM "EventParticipation" WHERE "eventId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "GpxSubmission" WHERE "eventId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "Event" WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Błąd usuwania wydarzenia:', error);
    res.status(500).json({ error: 'Nie udało się usunąć wydarzenia z bazy' });
  }
});

export default router;
