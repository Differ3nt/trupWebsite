import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProfileClient } from './ProfileClient';

async function fetchUserData(userId: string) {
  try {
    const [user, participations, gpxSubmissions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          nickname: true,
          email: true,
          avatarUrl: true,
          phoneNumber: true,
          hardware: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.eventParticipation.findMany({
        where: { userId },
        include: {
          event: {
            select: {
              id: true,
              title: true,
              dateStart: true,
              type: true,
              location: true,
              isFinalized: true,
              isDraft: true,
              image: true,
              imageFocalX: true,
              imageFocalY: true,
            },
          },
        },
        orderBy: { event: { dateStart: 'desc' } },
      }),
      prisma.gpxSubmission.findMany({
        where: {
          status: 'APPROVED',
          OR: [{ userId }, { participantIds: { has: userId } }],
        },
        select: {
          distance: true,
          elevationGain: true,
          duration: true,
        },
      }),
    ]);

    if (!user) {
      return { user: null, participations: [], personalStats: { distance: 0, elevation: 0, duration: 0 } };
    }

    const personalStats = gpxSubmissions.reduce(
      (acc, s) => ({
        distance: acc.distance + (s.distance || 0),
        elevation: acc.elevation + (s.elevationGain || 0),
        duration: acc.duration + (s.duration || 0),
      }),
      { distance: 0, elevation: 0, duration: 0 }
    );

    return { user, participations, personalStats };
  } catch (error) {
    console.error('[profil page fetch]', error);
    return { user: null, participations: [], personalStats: { distance: 0, elevation: 0, duration: 0 } };
  }
}

export default async function ProfilPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  setRequestLocale(params.locale);

  const session = await getSession();
  if (!session) redirect('/');

  const { user, participations, personalStats } = await fetchUserData(session.userId);

  if (!user) redirect('/');

  return <ProfileClient user={user} personalStats={personalStats} participations={participations} />;
}
