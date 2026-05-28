import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet } from '@/lib/cache';

type Stats = {
  expeditions: number;
  distance: number;
  elevation: number;
  duration: number;
  members: number;
};

const CACHE_KEY = 'stats';
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    const cached = cacheGet<Stats>(CACHE_KEY);
    if (cached) return NextResponse.json(cached);

    const [eventCount, gpxAgg, memberCount] = await Promise.all([
      prisma.event.count({ where: { isDraft: false, type: 'GÓRY' } }),
      prisma.gpxSubmission.aggregate({
        _sum: { distance: true, elevationGain: true, duration: true },
        where: { status: 'APPROVED' },
      }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
    ]);

    const stats: Stats = {
      expeditions: eventCount,
      distance: Math.round(gpxAgg._sum.distance ?? 0),
      elevation: Math.round(gpxAgg._sum.elevationGain ?? 0),
      duration: Math.round(gpxAgg._sum.duration ?? 0),
      members: memberCount,
    };

    cacheSet(CACHE_KEY, stats, CACHE_TTL);
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
