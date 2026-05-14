import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, Trophy, Mountain, Route, TrendingUp, Users, Clock } from 'lucide-react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'motion/react';
import NewsCard from '../components/NewsCard';
import { useAppContext } from '../contexts/AppContext';
import { AuthGate } from '../components/ui/AuthGate';

/**
 * Strona główna aplikacji (Landing Page).
 * Prezentuje manifest grupy, wyróżnione nadchodzące wydarzenia oraz kluczowe obszary działalności (Góry, Planszówki, Ludzie).
 */
export default function Home() {
  const { role, loginWithGoogle } = useAppContext();
  const [newsItems, setNewsItems] = React.useState<any[]>([]);
  const [highlightedEvents, setHighlightedEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(3);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/news').then(r => r.ok ? r.json() : []),
      fetch('/api/events/highlighted').then(r => r.ok ? r.json() : [])
    ])
      .then(([news, highlighted]) => {
        setNewsItems(Array.isArray(news) ? news : []);
        setHighlightedEvents(Array.isArray(highlighted) ? highlighted : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* 
          Hero Section 
          Monumentalny wstęp z mottem grupy.
      */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-black -mt-24 md:-mt-32">
        <div className="absolute inset-0 z-0">
          <img 
            src="/uploads/1777215737507-141412676.JPG" 
            alt="Tatry Zimą" 
            className="w-full h-full object-cover opacity-60 grayscale scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60"></div>
        </div>

        <div className="relative z-10 text-center px-6 animate-in fade-in zoom-in duration-1000 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-10">
          <img 
            src="/logo.png" 
            alt="TRUP Logo" 
            className="w-24 h-24 md:w-[13.5rem] md:h-[13.5rem] invert brightness-0 drop-shadow-2xl"
          />
          <h1 className="font-display font-black text-9xl md:text-[18rem] leading-none text-white uppercase drop-shadow-2xl">
            TRUP
          </h1>
        </div>
        <div className="relative z-10 text-center px-6 mt-8">
          <div className="h-1 w-24 bg-primary mx-auto mb-8"></div>
          <p className="text-white/90 text-lg md:text-3xl font-display font-bold uppercase tracking-[0.3em] max-w-4xl leading-relaxed">
            Robimy to czego <span className="text-primary italic">innym się nie chce</span>
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4 text-white/40 animate-bounce">
          <span className="text-[10px] font-bold uppercase tracking-widest">Eksploruj</span>
          <div className="w-px h-12 bg-white/20"></div>
        </div>
      </section>

      {/* STATS SECTION */}
      <StatsSection />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AKTUALNOŚCI — sekcja prezentująca nadchodzące wyprawy        */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto mt-24 mb-24">
        <div className="border border-outline-variant/30 bg-surface-container-low">
          {/* Header sekcji Aktualności */}
          <div className="flex justify-between items-end px-8 pt-8 pb-6 border-b border-outline-variant/30">
            <Link to="/wydarzenia">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1">Na Radarze</span>
              <h2 className="font-display font-black text-3xl md:text-4xl uppercase text-on-surface transition-colors link-underline">Aktualności</h2>
            </Link>
            <Link to="/wydarzenia" className="hidden md:flex btn btn-secondary items-center gap-2 px-6 py-3 text-xs">
              Wszystkie wydarzenia <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-8">
            <AuthGate message="Zaloguj się, aby zobaczyć najnowsze aktualności, szczegóły nadchodzących wypraw i ważne ogłoszenia grupy.">
              {loading ? (
                // Szkielet ładowania (Skeleton UI)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-3 p-6 border border-outline-variant/20">
                      <div className="h-3 w-24 bg-surface-container-highest" />
                      <div className="h-6 w-3/4 bg-surface-container-highest" />
                      <div className="h-3 w-1/2 bg-surface-container-highest" />
                    </div>
                  ))}
                </div>
              ) : newsItems.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 overflow-hidden transition-all duration-500 ease-in-out">
                    {newsItems.slice(0, visibleCount).map((item) => (
                      <NewsCard key={item.id} item={item} />
                    ))}
                  </div>

                  {/* Przycisk rozwijający więcej aktualności */}
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 3)}
                      disabled={visibleCount >= newsItems.length}
                      className={`btn btn-primary px-8 py-4 text-xs ${
                        visibleCount >= newsItems.length ? 'opacity-50 cursor-not-allowed grayscale' : ''
                      }`}
                    >
                      {visibleCount >= newsItems.length ? 'To już wszystko' : 'Pokaż więcej aktualności'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-on-surface-variant italic text-sm mb-4">Brak nowych aktualności.</p>
                  <Link to="/wydarzenia" className="text-xs font-bold uppercase tracking-widest text-primary link-underline">
                    Zobacz wszystkie nadchodzące wydarzenia →
                  </Link>
                </div>
              )}
            </AuthGate>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* NASZE OSIĄGNIĘCIA — sekcja archiwalnych sukcesów              */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {highlightedEvents.length > 0 && (
        <section className="px-6 md:px-12 max-w-7xl mx-auto mb-32">
          <div className="flex items-center gap-4 mb-12">
            <Link to="/wydarzenia" className="flex items-center gap-3 group">
              <Trophy size={24} className="text-primary group-hover:scale-110 transition-transform" />
              <h2 className="font-display font-black text-4xl uppercase group-hover:text-primary transition-colors">Nasze Osiągnięcia</h2>
            </Link>
            <div className="h-px flex-1 bg-outline-variant/30"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlightedEvents.map(event => (
              <Link key={event.id} to={`/wydarzenia/${event.id}`} className="group relative aspect-[4/5] overflow-hidden bg-surface-container-low border border-outline-variant/30">
                <img 
                  src={event.image || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800'} 
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  alt={event.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2">{event.type}</p>
                  <h3 className="text-white font-display font-black text-2xl uppercase leading-none mb-2">{event.title}</h3>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">
                    {new Date(event.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 
          Slanted Strips 
          Kontenery o ściętych krawędziach prezentujące fundamenty grupy.
      */}
      <div className="relative flex flex-col">
        {/* GÓRY */}
        <SlantedStrip
          zIndex={30}
          clipPath="polygon(0 4vw, 100% 0, 100% calc(100% - 4vw), 0 100%)"
          marginTop="0"
          img="https://lh3.googleusercontent.com/aida-public/AB6AXuCR5pO5QgFSNLU9L3FbHsULwCRMGO34kqt9OZ-XZxhW0DB_HZsXLqHWcsBQ0aMS0ysZc83MYvmEM1NO9JCPPKhU_MxzI8hIDaIqW8zJ_rrVgjm7oSpOll3ll9RnWZ7dSb8KtwvCAKiaWqxXyDhvkYexfztMYCKBIilPXMd1xilcN8abxVRtf1LTzZoQwUu5Gb-gGxTIl9K6JqR23QrN8JjJ7Ixe8SZWHUSybdNyPrVcZQaj0xjAhytQI3XDHaoZCeD72GRo6Zl_VMA"
          overlayClass="bg-primary/95"
          title="GÓRY"
          titleClass="text-surface font-black"
          desc="Szczyty to nasza katedra. Poruszamy się po ostrych graniach Tatr Wysokich z precyzją i w absolutnej ciszy. To tutaj Monolit wznosi się najwyżej."
          descClass="text-surface font-black"
          align="right"
        />

        {/* PLANSZÓWKI */}
        <SlantedStrip
          zIndex={20}
          clipPath="polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 4vw))"
          marginTop="-4vw"
          img="https://lh3.googleusercontent.com/aida-public/AB6AXuDQXZh676chPrNLBMu9h1yRGckedwK1JJ-r01WHjoYJda2Sg-hP5XZcR5sAoV6ygpTTRlc55WhnjoBNJ8bFd2w9vU5igPTfhBNlHMuXuvwt3yhQcnDVc7DYauk-Fi2ir1ohATcgP4bv74UrZgSW56DaiTm56z_NEIvcdN-_DP3Lf1JCEhGNtGkOZ7laRJTOjJZo17ZDhIpPVgMMiKOZFFd6-oKLuHx08Bk9N1-wHsp563zHBc3ycVL3ToPJTzyQrgn8huOZK8y4OSs"
          overlayClass="bg-surface/95"
          title="PLANSZÓWKI"
          titleClass="text-primary font-black"
          desc="Strategia to przedłużenie wspinaczki. Gromadzimy się przy stole, by opanować złożone systemy. Głębokie skupienie, chłodna kalkulacja i tekturowa architektura."
          descClass="text-on-surface"
          align="left"
        />

        {/* LUDZIE */}
        <SlantedStrip
          zIndex={10}
          clipPath="polygon(0 0, 100% 0, 100% calc(100% - 4vw), 0 100%)"
          marginTop="-4vw"
          img="https://lh3.googleusercontent.com/aida-public/AB6AXuAa7acOdV7YKgwpJg-268uU718pQAUga5uA3pvdc-dQENa4-BG3jRKjpdq6tLh-kZCasI3uuDBYAp7GTzFXmGOO_JMi1zUWej2Cl94qvyJ4LPKfLTO-laNfpUtzTyEsLR56DnvWWpechHZkiqYV0_VZInpVx6ft1cVFKjaE6qKQw_NCypI4p59JPd5U2EYphSfjvv7Fc3Sr4xm9eKflSjWS7t30PdGbxb8mSdBC59mjpzYrZuCR0hbNZOxdCIVn-4Zl_WesiwMB8zM"
          overlayClass="bg-[#f9f9f8]/95"
          title="LUDZIE"
          titleClass="text-[#37392E] font-black"
          desc="Tożsamość wykuwa się we wspólnej wytrzymałości. TRUP to sieć odkrywców połączonych estetyką Monolitu. Jesteśmy architektami naszych własnych podróży."
          descClass="text-[#37392E]"
          align="right"
        />
      </div>

      {/* 
          Contact Section 
          Sekcja końcowa z linkami do mediów społecznościowych.
      */}
      <section className="bg-surface py-32 relative z-0 -mt-[4vw] pt-[12vw]">
        <div className="container mx-auto px-6 md:px-8 text-center max-w-3xl">
          <h2 className="font-display font-black text-4xl md:text-6xl text-on-surface uppercase mb-6">
            CHCESZ WYJŚĆ Z NAMI?
          </h2>
          <p className="text-on-surface-variant text-lg md:text-xl leading-relaxed mb-12">
            Dołącz do ekspedycji. Nasze wyjścia są prywatne, wyselekcjonowane i rygorystyczne.<br className="hidden sm:block"/>
            Podążaj za sygnałem na naszych platformach społecznościowych.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="btn btn-secondary px-8 py-4 text-sm">
              INSTAGRAM
            </button>
            <button className="btn btn-secondary px-8 py-4 text-sm">
              FACEBOOK
            </button>
            <button className="btn btn-secondary px-8 py-4 text-sm">
              DISCORD
            </button>
            <button className="btn btn-primary px-8 py-4 text-sm">
              NEWSLETTER
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
/**
 * Sekcja statystyk grupy z animowanymi licznikami.
 */
function StatsSection() {
  const [stats, setStats] = React.useState({ expeditions: 0, distance: 0, elevation: 0, duration: 0, members: 0 });
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  React.useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setStats(data);
      });
  }, []);

  return (
    <section ref={ref} className="bg-[#0a0a0a] py-24 border-y border-white/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-12 md:gap-16">
          <StatItem 
            icon={<Mountain size={24} />} 
            value={stats.expeditions} 
            label="Wyprawy Górskie" 
            isInView={isInView} 
          />
          <StatItem 
            icon={<Route size={24} />} 
            value={stats.distance} 
            label="Przebyty Dystans" 
            suffix=" km" 
            isInView={isInView} 
          />
          <StatItem 
            icon={<TrendingUp size={24} />} 
            value={stats.elevation} 
            label="Przewyższenia" 
            suffix=" m" 
            decimals={0}
            isInView={isInView} 
          />
          <StatItem 
            icon={<Clock size={24} />} 
            value={Math.round(stats.duration / 60)} 
            label="Czas w górach" 
            suffix=" h"
            isInView={isInView} 
          />
          <StatItem 
            icon={<Users size={24} />} 
            value={stats.members} 
            label="Aktywni Członkowie" 
            isInView={isInView} 
          />
        </div>
      </div>
    </section>
  );
}

function StatItem({ icon, value, label, suffix = "", decimals = 0, isInView }: any) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (decimals === 0) return Math.floor(latest).toString();
    return latest.toFixed(decimals);
  });

  React.useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2.5,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, value, count]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      <div className="text-primary mb-6 opacity-50">{icon}</div>
      <div className="font-display font-black text-5xl md:text-7xl text-white mb-2 tabular-nums">
        <motion.span>{rounded}</motion.span>{suffix}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant/60">
        {label}
      </div>
    </motion.div>
  );
}

/**
 * Komponent pomocniczy do renderowania charakterystycznych ściętych pasków z tekstem na stronie głównej.
 */
function SlantedStrip({ zIndex, clipPath, marginTop, img, overlayClass, title, titleClass, desc, descClass, align }: any) {
  const isRight = align === 'right';
  return (
    <section 
      className="relative py-32 md:py-48 flex items-center"
      style={{ zIndex, clipPath, marginTop }}
    >
      <div className="absolute inset-0 z-0">
        <img src={img} alt={title} className="w-full h-full object-cover grayscale-[20%]" referrerPolicy="no-referrer" />
        <div className={`absolute inset-0 ${overlayClass}`}></div>
      </div>
      <div className={`container mx-auto px-6 md:px-12 relative z-10 flex ${isRight ? 'justify-end md:text-right' : 'justify-start text-left'}`}>
        <div className={`max-w-xl ${isRight ? 'text-right' : 'text-left'}`}>
          <h2 className={`font-display font-black text-5xl md:text-8xl uppercase mb-6 ${titleClass}`}>
            {title}
          </h2>
          <p className={`font-medium text-base md:text-xl leading-relaxed ${descClass}`}>
            {desc}
          </p>
        </div>
      </div>
    </section>
  );
}
