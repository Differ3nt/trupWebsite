import { Router, Request, Response } from 'express';
import { authenticate, requireMember, getUserIdFromCookie, getUserFromCookie } from '../middleware/auth';
import { invalidateStatsCache } from './stats';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * Pobiera listę wszystkich wydarzeń.
 * Jeśli upcoming=true, zwraca tylko przyszłe wydarzenia.
 * Dołącza informację o liczbie uczestników i statusie aktualnego użytkownika.
 */
router.get('/', async (req: any, res) => {
  try {
    const { upcoming } = req.query;
    const userSession = getUserFromCookie(req);
    const uid = userSession?.userId || null;
    const isAdmin = userSession?.role === 'ADMIN';
    const isMember = !!(uid && (isAdmin || userSession?.status === 'ACTIVE'));

    const draftFilter = isAdmin ? '' : 'AND e."isDraft" = false';
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    // isParticipant lets inactive users see events they've been added to or attended
    const query = upcoming === 'true'
      ? `SELECT e.*,
          (SELECT COUNT(*)::int FROM "EventParticipation" p WHERE p."eventId" = e.id AND p.status = 'GOING') as "goingCount",
          (SELECT status FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = $1) as "userStatus",
          EXISTS(SELECT 1 FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = $1) as "isParticipant",
          EXISTS(SELECT 1 FROM "NewsItem" n WHERE n."eventId" = e.id) as "featured"
        FROM "Event" e WHERE (e."dateEnd" >= $2 OR (e."dateEnd" IS NULL AND e."dateStart" >= $2)) ${draftFilter} ORDER BY e."dateStart" ASC`
      : `SELECT e.*,
          (SELECT COUNT(*)::int FROM "EventParticipation" p WHERE p."eventId" = e.id AND p.status = 'GOING') as "goingCount",
          (SELECT status FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = $1) as "userStatus",
          EXISTS(SELECT 1 FROM "EventParticipation" p WHERE p."eventId" = e.id AND p."userId" = $1) as "isParticipant",
          EXISTS(SELECT 1 FROM "NewsItem" n WHERE n."eventId" = e.id) as "featured"
        FROM "Event" e WHERE 1=1 ${draftFilter} ORDER BY e."dateStart" ASC`;

    const events = (await prisma.$queryRawUnsafe(query, uid, startOfToday)) as any[];

    const maskedEvents = events.map((event: any) => {
      // Active members see everything; inactive users see full detail for their own events
      if (!isMember && !event.isParticipant) {
        const { mapLink, mapEmbed, gearRequired, gearCritical, transport, ...publicData } = event;
        return { ...publicData, isMasked: true };
      }
      return event;
    });

    res.json(maskedEvents);
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
    const userSession = getUserFromCookie(req);
    const userId = userSession?.userId ?? null;
    const isMember = !!(userId && (userSession?.role === 'ADMIN' || userSession?.status === 'ACTIVE'));

    // Inactive logged-in users can see full detail for events they're part of
    let inactiveCanSee = false;
    if (userId && !isMember) {
      const participation = await prisma.eventParticipation.findUnique({
        where: { userId_eventId: { userId, eventId: req.params.id } },
        select: { id: true }
      });
      inactiveCanSee = participation !== null;
    }

    const events: any = await prisma.$queryRaw`SELECT * FROM "Event" WHERE id = ${req.params.id}`;

    if (!events.length) return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione' });
    const event = events[0];

    // Check draft access
    if (event.isDraft) {
      if (!userId) return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione' });
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (dbUser?.role !== 'ADMIN') {
        return res.status(404).json({ error: 'Wydarzenie nie zostało znalezione' });
      }
    }

    // Jeśli admin lub event nie jest sfinalizowany, pobieramy wszystkich uczestników
    // Jeśli sfinalizowany (dla gościa), pobieramy tylko tych, co byli (attended)
    const isAdminRequest = userSession?.role === 'ADMIN';
    const attendedFilter = (event.isFinalized && !isAdminRequest) ? 'AND p.attended = true' : '';
    const participants: any = await prisma.$queryRawUnsafe(
      `SELECT p.*, (SELECT json_build_object('id', u.id, 'name', u.name, 'avatarUrl', u."avatarUrl") FROM "User" u WHERE u.id = p."userId") as user
      FROM "EventParticipation" p WHERE p."eventId" = $1 ${attendedFilter}`,
      req.params.id
    );

    // Pobranie wszystkich tras GPX dla wydarzenia (jeśli sfinalizowane lub admin)
    // Pobieramy trasy GPX przypisane do wydarzenia
    // Jeśli wydarzenie nie jest jeszcze sfinalizowane, zwracamy wszystkie trasy (propozycje)
    // Jeśli jest sfinalizowane, zwracamy tylko zatwierdzone (APPROVED)
    const gpxRoutes = await prisma.gpxSubmission.findMany({
      where: { 
        eventId: req.params.id,
        ...(event.isFinalized ? { status: 'APPROVED' } : {})
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { order: 'asc' }
    });

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

    if (!isMember && !inactiveCanSee) {
      const { mapLink, mapEmbed, gearRequired, gearCritical, transport, ...publicEvent } = event;
      return res.json({
        ...publicEvent,
        participants: [],
        gpxSubmissions: gpxRoutes || [],
        myRsvp: null,
        myNotifyDays: null,
        isMasked: true
      });
    }

    res.json({ 
      ...event, 
      participants: participants || [], 
      gpxSubmissions: gpxRoutes || [],
      myRsvp, 
      myNotifyDays 
    });
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
      title, description, transport, dateStart, dateEnd, location, mapLink, mapEmbed,
      difficulty, spots, type, gearRequired, gearCritical,
      image, isExpedition, featured, highlighted, isDraft,
      organizer, meetingPointName, meetingPointLink, meetingPointEmbed, weatherInfo,
      imageFocalX, imageFocalY,
      plannedDistance, plannedElevation, plannedDuration
    } = req.body;

    if (!isDraft && (!title || !dateStart || !type)) {
      return res.status(400).json({ error: 'Brak wymaganych pól (tytuł, data startu, typ)' });
    }

    // plannedDuration comes in as hours from the frontend — convert to minutes
    const plannedDurationMin = plannedDuration ? parseFloat(plannedDuration) * 60 : null;

    // Default values for drafts
    const finalTitle = title || `Szkic ${new Date().toLocaleDateString()}`;
    const finalDateStart = dateStart ? new Date(dateStart) : new Date();
    const finalType = type || 'GÓRY';

    // Skróty typów dla czytelniejszego ID
    const typeMap: Record<string, string> = {
      'GÓRY': 'WYP',
      'EKSPEDYCJA': 'EKS',
      'INTEGRACJA': 'INT',
      'KULTURA': 'KUL',
      'PIWO': 'PIW'
    };
    const typeCode = typeMap[finalType] || 'INNE';

    // Generowanie kolejnego numeru wydarzenia w danym roku
    const year = finalDateStart.getFullYear();
    const count: any = await prisma.$queryRaw`
      SELECT COUNT(*)::int as total FROM "Event" WHERE EXTRACT(YEAR FROM "dateStart") = ${year}
    `;
    const nextNum = (count[0]?.total || 0) + 1;
    const eventId = `${year}_${String(nextNum).padStart(2, '0')}_${typeCode}`;

    await prisma.$executeRaw`
      INSERT INTO "Event" (
        id, title, description, transport, "dateStart", "dateEnd", location, "mapLink", "mapEmbed",
        difficulty, spots, type, "gearRequired", "gearCritical", image, "isExpedition",
        featured, highlighted, "isDraft", organizer, "meetingPointName", "meetingPointLink", "meetingPointEmbed", "weatherInfo",
        "imageFocalX", "imageFocalY", "plannedDistance", "plannedElevation", "plannedDuration", "createdAt", "updatedAt"
      ) VALUES (
        ${eventId}, ${finalTitle}, ${description}, ${transport}, ${finalDateStart},
        ${dateEnd ? new Date(dateEnd) : null}, ${location}, ${mapLink}, ${mapEmbed},
        ${difficulty ? Number(difficulty) : null}, ${spots ? Number(spots) : null},
        ${finalType}, ${gearRequired || []}, ${gearCritical || []}, ${image},
        ${isExpedition === true}, ${featured === true}, ${highlighted === true},
        ${isDraft === true}, ${organizer || null}, ${meetingPointName || null}, ${meetingPointLink || null}, ${meetingPointEmbed || null}, ${weatherInfo || null},
        ${imageFocalX != null ? Number(imageFocalX) : 50}, ${imageFocalY != null ? Number(imageFocalY) : 50},
        ${plannedDistance ? Number(plannedDistance) : null}, ${plannedElevation ? Number(plannedElevation) : null}, ${plannedDurationMin}, NOW(), NOW()
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
      title, description, transport, dateStart, dateEnd, location, mapLink, mapEmbed,
      difficulty, spots, type, gearRequired, gearCritical,
      image, isExpedition, featured, highlighted, isDraft,
      organizer, meetingPointName, meetingPointLink, meetingPointEmbed, weatherInfo,
      imageFocalX, imageFocalY,
      plannedDistance, plannedElevation, plannedDuration
    } = req.body;

    if (!isDraft && (!title || !dateStart || !type)) {
      return res.status(400).json({ error: 'Brak wymaganych pól (tytuł, data startu, typ)' });
    }

    const plannedDurationMin = plannedDuration ? parseFloat(plannedDuration) * 60 : null;

    await prisma.$executeRaw`
      UPDATE "Event" SET
        title = ${title || 'Szkic bez tytułu'},
        description = ${description},
        transport = ${transport},
        "dateStart" = ${dateStart ? new Date(dateStart) : new Date()},
        "dateEnd" = ${dateEnd ? new Date(dateEnd) : null},
        location = ${location},
        "mapLink" = ${mapLink},
        "mapEmbed" = ${mapEmbed},
        difficulty = ${difficulty ? Number(difficulty) : null},
        spots = ${spots ? Number(spots) : null},
        type = ${type || 'GÓRY'},
        "gearRequired" = ${gearRequired || []},
        "gearCritical" = ${gearCritical || []},
        image = ${image},
        "isExpedition" = ${isExpedition === true},
        featured = ${featured === true},
        highlighted = ${highlighted === true},
        "isDraft" = ${isDraft === true},
        organizer = ${organizer || null},
        "meetingPointName" = ${meetingPointName || null},
        "meetingPointLink" = ${meetingPointLink || null},
        "meetingPointEmbed" = ${meetingPointEmbed || null},
        "weatherInfo" = ${weatherInfo || null},
        "imageFocalX" = ${imageFocalX != null ? Number(imageFocalX) : 50},
        "imageFocalY" = ${imageFocalY != null ? Number(imageFocalY) : 50},
        "plannedDistance" = ${plannedDistance ? Number(plannedDistance) : null},
        "plannedElevation" = ${plannedElevation ? Number(plannedElevation) : null},
        "plannedDuration" = ${plannedDurationMin},
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
router.post('/:id/rsvp', authenticate, requireMember, async (req: any, res) => {
  try {
    const { status, notifyDaysBefore } = req.body;
    const eventId = req.params.id;
    const userId = req.userId;

    const eventCheck: any = await prisma.$queryRaw`SELECT "dateStart", "dateEnd" FROM "Event" WHERE id = ${eventId}`;
    if (!eventCheck || eventCheck.length === 0) {
      return res.status(404).json({ error: 'Wydarzenie nie istnieje' });
    }

    const ev = eventCheck[0];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const eventDate = ev.dateEnd ? new Date(ev.dateEnd) : new Date(ev.dateStart);
    if (eventDate < startOfToday) {
      return res.status(400).json({ error: 'Nie można zapisać się ani zmienić statusu w wydarzeniu archiwalnym' });
    }

    // Jeśli status jest null, usuwamy użytkownika z listy uczestników
    if (status === null) {
      await prisma.$executeRaw`DELETE FROM "EventParticipation" WHERE "userId" = ${userId} AND "eventId" = ${eventId}`;
      return res.json({ success: true, status: null });
    }

    if (!['INTERESTED', 'GOING'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status uczestnictwa' });
    }

    // Sprawdzanie limitu miejsc dla statusu 'GOING'
    if (status === 'GOING') {
      const event: any = await prisma.$queryRaw`
        SELECT spots, 
        (SELECT COUNT(*)::int FROM "EventParticipation" p WHERE p."eventId" = ${eventId} AND p.status = 'GOING') as "goingCount",
        (SELECT status FROM "EventParticipation" p WHERE p."eventId" = ${eventId} AND p."userId" = ${userId}) as "currentStatus"
        FROM "Event" WHERE id = ${eventId}
      `;

      if (!event.length) return res.status(404).json({ error: 'Wydarzenie nie istnieje' });
      
      const { spots, goingCount, currentStatus } = event[0];
      
      // Jeśli jest limit i został osiągnięty, a użytkownik jeszcze nie jest zapisany jako GOING
      if (spots !== null && goingCount >= spots && currentStatus !== 'GOING') {
        return res.status(400).json({ error: 'Brak wolnych miejsc na tę wyprawę' });
      }
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

/**
 * 4. Pobieranie kolejki rozliczeń dla admina (wydarzenia zakończone, niesfinalizowane).
 */
router.get('/admin/completion-queue', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Brak uprawnień' });

    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);

    const queue = await prisma.event.findMany({
      where: {
        dateStart: { lt: startOfToday },
        isFinalized: false,
        isDraft: false
      },
      include: {
        participants: {
          where: {
            status: { in: ['GOING', 'INTERESTED'] }
          },
          include: { user: true }
        },
        gpxSubmissions: {
          select: {
            id: true,
            userId: true,
            eventId: true,
            filePath: true,
            distance: true,
            duration: true,
            elevationGain: true,
            participantIds: true,
            isOfficial: true,
            label: true,
            mapLink: true,
            mapEmbed: true,
            status: true,
            order: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        }
      },
      orderBy: { dateStart: 'desc' }
    });

    // Normalize file paths for web (backslashes to forward slashes)
    const normalizedQueue = queue.map((ev: any) => ({
      ...ev,
      gpxSubmissions: ev.gpxSubmissions.map((g: any) => ({
        ...g,
        filePath: g.filePath ? g.filePath.replace(/\\/g, '/') : g.filePath
      }))
    }));

    res.json(normalizedQueue);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania kolejki rozliczeń' });
  }
});

/**
 * 5. Finalizacja rozliczenia wydarzenia przez admina.
 */
router.post('/:id/finalize', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Brak uprawnień' });

    const { attendedUserIds, routesData } = req.body;
    // routesData: { id: string, participantIds: string[], isOfficial: boolean, label: string }[]

    // 1. Reset all to not attended
    await prisma.eventParticipation.updateMany({
      where: { eventId: req.params.id },
      data: { attended: false }
    });
    
    // 2. Ensure each attended user has a record and set attended=true
    if (attendedUserIds && attendedUserIds.length > 0) {
      for (const uid of attendedUserIds) {
        await prisma.eventParticipation.upsert({
          where: {
            userId_eventId: {
              userId: uid,
              eventId: req.params.id
            }
          },
          update: { attended: true, status: 'GOING' },
          create: {
            userId: uid,
            eventId: req.params.id,
            status: 'GOING',
            attended: true
          }
        });
      }
    }

    // 2. Aktualizacja tras GPX (jeśli istnieją)
    let officialDistance = 0;
    let officialElevation = 0;
    let officialDuration = 0;

    if (routesData && routesData.length > 0) {
      for (const route of routesData) {
        const updatedRoute = await prisma.gpxSubmission.update({
          where: { id: route.id },
          data: {
            isOfficial: route.isOfficial,
            participantIds: route.participantIds,
            label: route.label,
            order: route.order || 0,
            status: 'APPROVED',
            duration: route.duration || 0
          }
        });

        if (route.isOfficial) {
          officialDistance = updatedRoute.distance;
          officialElevation = updatedRoute.elevationGain || 0;
          officialDuration = updatedRoute.duration || 0;
        }
      }
    }

    // 3. Finalizacja wydarzenia
    await prisma.event.update({
      where: { id: req.params.id },
      data: {
        isFinalized: true,
        actualDistance: officialDistance,
        actualElevation: officialElevation,
        actualDuration: officialDuration
      }
    });
    
    invalidateStatsCache();

    res.json({ success: true });
  } catch (error) {
    console.error('Błąd finalizacji:', error);
    res.status(500).json({ error: 'Błąd podczas finalizacji wydarzenia' });
  }
});

export default router;
