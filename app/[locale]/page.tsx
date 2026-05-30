import { Link } from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { HomeClient } from './HomeClient';
import { NewsSection } from './NewsSection';

async function getData() {
  try {
    const [newsItems, highlightedEvents, userCount, gpxStats, expeditionCount] = await Promise.all([
      prisma.newsItem.findMany({
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: 9,
      }),
      prisma.event.findMany({
        where: { isDraft: false, highlighted: true },
        orderBy: { dateStart: 'desc' },
        take: 6,
      }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.gpxSubmission.aggregate({
        where: { status: 'APPROVED' },
        _sum: { distance: true, elevationGain: true, duration: true },
      }),
      // Expeditions = published GÓRY events (matches /api/stats, §14.12),
      // not the GPX submission count.
      prisma.event.count({ where: { isDraft: false, type: 'GÓRY' } }),
    ]);

    return {
      newsItems,
      highlightedEvents,
      stats: {
        expeditions: expeditionCount,
        distance: Math.round(gpxStats._sum.distance ?? 0),
        elevation: Math.round(gpxStats._sum.elevationGain ?? 0),
        duration: Math.round(gpxStats._sum.duration ?? 0),
        members: userCount,
      },
    };
  } catch {
    return {
      newsItems: [],
      highlightedEvents: [],
      stats: {
        expeditions: 0,
        distance: 0,
        elevation: 0,
        duration: 0,
        members: 0,
      },
    };
  }
}

export default async function HomePage() {
  const { newsItems, highlightedEvents, stats } = await getData();

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-black -mt-16 md:-mt-20">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero.jpeg"
            alt="Tatry"
            className="w-full h-full object-cover opacity-60 grayscale scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        </div>
        <div className="relative z-10 text-center px-6 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10">
          <img
            src="/logo.png"
            alt="TRUP Logo"
            className="w-24 h-24 md:w-48 md:h-48 invert brightness-0 drop-shadow-2xl"
          />
          <h1 className="font-display font-black text-9xl md:text-[18rem] leading-none text-white uppercase drop-shadow-2xl">
            TRUP
          </h1>
        </div>
        <div className="relative z-10 text-center px-6 mt-8">
          <div className="h-1 w-24 bg-primary mx-auto mb-8" />
          <p className="text-white/90 text-lg md:text-3xl font-display font-bold uppercase tracking-[0.3em] max-w-4xl leading-relaxed">
            Robimy to czego <span className="text-primary italic">innym się nie chce</span>
          </p>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 text-white/40 animate-bounce">
          <span className="text-[10px] font-bold uppercase tracking-widest">Eksploruj</span>
          <div className="w-px h-12 bg-white/20" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-ink py-24 border-y border-white/5">
        <div className="container mx-auto px-6 md:px-12">
          <HomeClient stats={stats} />
        </div>
      </section>

      {/* News Section */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto mt-24 mb-24">
        <div className="border border-outline-variant/30 bg-surface-container-low">
          <div className="flex justify-between items-end px-8 pt-8 pb-6 border-b border-outline-variant/30">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">
                Na Radarze
              </span>
              <h2 className="font-display font-black text-3xl md:text-4xl uppercase text-on-surface">
                Aktualności
              </h2>
            </div>
            <Link
              href="/aktualnosci"
              className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
            >
              Wszystkie wydarzenia →
            </Link>
          </div>
          <div className="p-8">
            <NewsSection items={newsItems} />
          </div>
        </div>
      </section>

      {/* Highlighted Events */}
      {highlightedEvents.length > 0 && (
        <section className="px-6 md:px-12 max-w-7xl mx-auto mb-32">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="font-display font-black text-4xl uppercase">Nasze Osiągnięcia</h2>
            <div className="h-px flex-1 bg-outline-variant/30" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlightedEvents.map((event) => (
              <Link
                key={event.id}
                href={`/wydarzenia/${event.id}`}
                className="group relative aspect-[4/5] overflow-hidden bg-surface-container-low border border-outline-variant/30"
              >
                <img
                  src={event.image || '/placeholder-mountain.jpg'}
                  alt={event.title}
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  style={{
                    objectPosition: `${event.imageFocalX ?? 50}% ${event.imageFocalY ?? 50}%`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
                  <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2">
                    {event.type}
                  </p>
                  <h3 className="text-white font-display font-black text-2xl uppercase leading-none mb-2">
                    {event.title}
                  </h3>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                    {new Date(event.dateStart).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Three Strips (static/decorative) */}
      <div className="relative overflow-hidden">
        <section className="relative py-32 md:py-48 flex items-center bg-primary/95">
          <div className="container mx-auto px-6 md:px-12 relative z-10 flex justify-end">
            <div className="max-w-xl text-right">
              <h2 className="font-display font-black text-5xl md:text-8xl uppercase mb-6 text-surface">
                GÓRY
              </h2>
              <p className="font-medium text-base md:text-xl leading-relaxed text-surface">
                Szczyty to nasza katedra. Poruszamy się po ostrych graniach Tatr Wysokich z precyzją i w
                absolutnej ciszy.
              </p>
            </div>
          </div>
        </section>
        <section className="relative py-32 md:py-48 flex items-center bg-surface border-y border-outline-variant/20">
          <div className="container mx-auto px-6 md:px-12 relative z-10">
            <div className="max-w-xl">
              <h2 className="font-display font-black text-5xl md:text-8xl uppercase mb-6 text-primary">
                PLANSZÓWKI
              </h2>
              <p className="font-medium text-base md:text-xl leading-relaxed text-on-surface">
                Strategia to przedłużenie wspinaczki. Gromadzimy się przy stole, by opanować złożone systemy.
              </p>
            </div>
          </div>
        </section>
        <section className="relative py-32 md:py-48 flex items-center bg-on-surface">
          <div className="container mx-auto px-6 md:px-12 relative z-10 flex justify-end">
            <div className="max-w-xl text-right">
              <h2 className="font-display font-black text-5xl md:text-8xl uppercase mb-6 text-surface">
                LUDZIE
              </h2>
              <p className="font-medium text-base md:text-xl leading-relaxed text-surface">
                Tożsamość wykuwa się we wspólnej wytrzymałości. TRUP to sieć odkrywców połączonych estetyką
                Monolitu.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Contact CTA */}
      <section className="bg-surface py-32 relative">
        <div className="container mx-auto px-6 md:px-8 text-center max-w-3xl">
          <h2 className="font-display font-black text-4xl md:text-6xl text-on-surface uppercase mb-6">
            CHCESZ WYJŚĆ Z NAMI?
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-12">
            Dołącz do ekspedycji. Nasze wyjścia są prywatne, wyselekcjonowane i rygorystyczne.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest bg-black/60 text-on-surface ring-2 ring-inset ring-white/10 hover:bg-white hover:text-surface transition-all"
            >
              INSTAGRAM
            </a>
            <a
              href="#"
              className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-widest bg-black/60 text-on-surface ring-2 ring-inset ring-white/10 hover:bg-white hover:text-surface transition-all"
            >
              FACEBOOK
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
