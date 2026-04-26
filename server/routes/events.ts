import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Pomocnicza funkcja sprawdzająca sesję
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

// Pobieranie wszystkich wydarzeń — publiczne (z uwzględnieniem statusu zalogowanego)
router.get('/', async (req: any, res) => {
  try {
    const { upcoming } = req.query;
    const userId = getUserIdFromCookie(req);
    let events: any;
    
    // Używamy NULL jeśli użytkownik nie jest zalogowany, aby uniknąć błędów rzutowania UUID
    const uid = userId || null;
    
    const query = upcoming === 'true' 
      ? `SELECT e.*, 
          (SELECT COUNT(*)::int FROM "EventParticipation" p WHERE p."eventId" = e.id AND p.status = 'GOING') as "goingCount",
          (SELECT status FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = $1) as "userStatus"
        FROM "Event" e WHERE e."dateStart" >= NOW() ORDER BY e."dateStart" ASC`
      : `SELECT e.*, 
          (SELECT COUNT(*)::int FROM "EventParticipation" p WHERE p."eventId" = e.id AND p.status = 'GOING') as "goingCount",
          (SELECT status FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = $1) as "userStatus"
        FROM "Event" e ORDER BY e."dateStart" ASC`;
    
    events = await prisma.$queryRawUnsafe(query, uid);
    res.json(events);
  } catch (error: any) {
    console.error('Błąd pobierania wydarzeń:', error);
    res.status(500).json({ error: 'Nie udało się pobrać wydarzeń' });
  }
});

// Wyróżnione nadchodzące wydarzenia — sekcja "Aktualności" na stronie głównej
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
    res.status(500).json({ error: 'Nie udało się pobrać wyróżnionych' });
  }
});

// Wyróżnione osiągnięcia — sekcja "Nasze Osiągnięcia" na stronie głównej
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

// Pobieranie pojedynczego wydarzenia
router.get('/:id', async (req: any, res) => {
  try {
    let userId: string | null = getUserIdFromCookie(req);

    const events: any = await prisma.$queryRaw`SELECT * FROM "Event" WHERE id = ${req.params.id}`;

    if (!events.length) return res.status(404).json({ error: 'Wydarzenie nie znalezione' });
    const event = events[0];

    // Pobieramy uczestników osobno (z polem attended)
    const participants: any = await prisma.$queryRaw`
      SELECT p.*, (SELECT json_build_object('id', u.id, 'name', u.name, 'avatarUrl', u."avatarUrl") FROM "User" u WHERE u.id = p."userId") as user
      FROM "EventParticipation" p WHERE p."eventId" = ${req.params.id}
    `;

    // Dodajemy aktualny status użytkownika i ustawienia powiadomień
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
    res.status(500).json({ error: 'Nie udało się pobrać wydarzenia' });
  }
});

// Zarządzanie frekwencją (Admin)
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

// Tworzenie wydarzenia
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

    // Mapowanie typów na krótkie kody ID
    const typeMap: Record<string, string> = {
      'GÓRY': 'WYP',
      'EKSPEDYCJA': 'EKS',
      'INTEGRACJA': 'INT',
      'KULTURA': 'KUL',
      'PIWO': 'PIW'
    };
    const typeCode = typeMap[type] || 'INNE';

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
    res.status(500).json({ error: 'Błąd zapisu' });
  }
});

// Edycja wydarzenia
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
    res.status(500).json({ error: 'Błąd aktualizacji' });
  }
});

// RSVP
router.post('/:id/rsvp', authenticate, async (req: any, res) => {
  try {
    const { status, notifyDaysBefore } = req.body;
    const eventId = req.params.id;
    const userId = req.userId;

    if (status === null) {
      await prisma.$executeRaw`DELETE FROM "EventParticipation" WHERE "userId" = ${userId} AND "eventId" = ${eventId}`;
      return res.json({ success: true, status: null });
    }

    if (!['INTERESTED', 'GOING'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const partId = `part_${Date.now()}`;
    await prisma.$executeRaw`
      INSERT INTO "EventParticipation" (id, "userId", "eventId", status, "notifyDaysBefore", "createdAt")
      VALUES (${partId}, ${userId}, ${eventId}, ${status}, ${notifyDaysBefore ?? null}, NOW())
      ON CONFLICT ("userId", "eventId") DO UPDATE SET status = EXCLUDED.status, "notifyDaysBefore" = EXCLUDED."notifyDaysBefore"
    `;

    res.json({ success: true, status });
  } catch (error) {
    console.error('Błąd RSVP:', error);
    res.status(500).json({ error: 'Nie udało się zapisać uczestnictwa' });
  }
});

// Toggle featured / highlighted (Admin)
router.patch('/:id/featured', authenticate, async (req: any, res) => {
  try {
    const data: any = {};
    if (req.body.featured !== undefined) data.featured = Boolean(req.body.featured);
    if (req.body.highlighted !== undefined) data.highlighted = Boolean(req.body.highlighted);
    
    await prisma.$executeRaw`
      UPDATE "Event" SET 
        featured = ${data.featured !== undefined ? data.featured : prisma.event.findUnique({where:{id:req.params.id}}).then((e:any)=>e.featured)},
        highlighted = ${data.highlighted !== undefined ? data.highlighted : prisma.event.findUnique({where:{id:req.params.id}}).then((e:any)=>e.highlighted)}
      WHERE id = ${req.params.id}
    `;
    // Uproszczony powrót (bez ponownego query dla szybkości, admin i tak odświeży listę)
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Nie udało się zaktualizować wydarzenia' });
  }
});

// Usuwanie wydarzenia
router.delete('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    await prisma.$executeRaw`DELETE FROM "EventParticipation" WHERE "eventId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "GpxSubmission" WHERE "eventId" = ${id}`;
    await prisma.$executeRaw`DELETE FROM "Event" WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Błąd usuwania wydarzenia:', error);
    res.status(500).json({ error: 'Nie udało się usunąć wydarzenia' });
  }
});

export default router;
