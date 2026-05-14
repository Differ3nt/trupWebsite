import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncAttendance() {
  console.log('--- Rozpoczynam synchronizację obecności na podstawie tras GPX ---');
  
  try {
    // 1. Pobierz wszystkie zgłoszenia GPX
    const submissions = await prisma.gpxSubmission.findMany({
      include: {
        event: true
      }
    });

    console.log(`Znaleziono ${submissions.length} zgłoszeń GPX.`);
    let updatedCount = 0;
    let createdCount = 0;

    for (const submission of submissions) {
      const participantIds = submission.participantIds as string[];
      if (!participantIds || participantIds.length === 0) continue;

      for (const userId of participantIds) {
        // Sprawdź czy użytkownik ma już rekord uczestnictwa w tym wydarzeniu
        const participation = await prisma.eventParticipation.findUnique({
          where: {
            userId_eventId: {
              userId,
              eventId: submission.eventId
            }
          }
        });

        if (participation) {
          if (!participation.attended) {
            await prisma.eventParticipation.update({
              where: { id: participation.id },
              data: { attended: true, status: 'GOING' }
            });
            updatedCount++;
          }
        } else {
          // Jeśli brak rekordu, stwórz nowy
          await prisma.eventParticipation.create({
            data: {
              userId,
              eventId: submission.eventId,
              status: 'GOING',
              attended: true
            }
          });
          createdCount++;
        }
      }
    }

    console.log(`\nZakończono synchronizację:`);
    console.log(`- Zaktualizowano rekordów: ${updatedCount}`);
    console.log(`- Utworzono nowych rekordów: ${createdCount}`);
    
  } catch (error) {
    console.error('Błąd podczas synchronizacji:', error);
  } finally {
    await prisma.$disconnect();
  }
}

syncAttendance();
