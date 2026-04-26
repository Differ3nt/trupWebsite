import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, Trophy } from 'lucide-react';

export default function Home() {
  const [featuredEvents, setFeaturedEvents] = React.useState<any[]>([]);
  const [highlightedEvents, setHighlightedEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [visibleCount, setVisibleCount] = React.useState(3);

  React.useEffect(() => {
    Promise.all([
      fetch('/api/events/featured').then(r => r.ok ? r.json() : []),
      fetch('/api/events/highlighted').then(r => r.ok ? r.json() : [])
    ])
      .then(([featured, highlighted]) => {
        setFeaturedEvents(Array.isArray(featured) ? featured : []);
        setHighlightedEvents(Array.isArray(highlighted) ? highlighted : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="pt-8 pb-16 md:pt-24 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto">
        <h1 className="font-display font-black text-5xl sm:text-6xl md:text-[8rem] leading-[0.9] tracking-tighter text-on-surface uppercase mb-8">
          SUROWA <span className="text-primary">GÓRSKA</span><br />
          POTĘGA.
        </h1>
        <p className="text-on-surface-variant text-base md:text-xl max-w-2xl leading-relaxed mb-10 font-medium">
          Jesteśmy kolektywem wyrzeźbionym z granitu i iglastych lasów.<br className="hidden md:block"/>
          TRUP to więcej niż grupa; to monolit eksploracji.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* AKTUALNOŚCI — nadchodzące featured wydarzenia               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto mb-24">
        <div className="border border-outline-variant/30 bg-surface-container-low">
          {/* Header */}
          <div className="flex justify-between items-end px-8 pt-8 pb-6 border-b border-outline-variant/30">
            <Link to="/wydarzenia" className="group">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary block mb-1 group-hover:translate-x-1 transition-transform">Na Radarze</span>
              <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tighter text-on-surface group-hover:text-primary transition-colors">Aktualności</h2>
            </Link>
            <Link to="/wydarzenia" className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
              Wszystkie wydarzenia <ArrowRight size={14} />
            </Link>
          </div>

          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3 p-6 border border-outline-variant/20">
                    <div className="h-3 w-24 bg-surface-container-highest" />
                    <div className="h-6 w-3/4 bg-surface-container-highest" />
                    <div className="h-3 w-1/2 bg-surface-container-highest" />
                  </div>
                ))}
              </div>
            ) : featuredEvents.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 overflow-hidden transition-all duration-500 ease-in-out">
                  {featuredEvents.slice(0, visibleCount).map((event, i) => (
                    <Link
                      key={event.id}
                      to={`/wydarzenia/${event.id}`}
                      className="group relative block border border-outline-variant/20 hover:border-primary transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden"
                    >
                      {/* Background Image Overlay */}
                      {event.image && (
                        <div className="absolute inset-0 z-0">
                          <img 
                            src={event.image} 
                            alt="" 
                            className="w-full h-full object-cover opacity-[0.07] grayscale group-hover:scale-105 transition-transform duration-700" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-transparent to-surface-container-low opacity-60"></div>
                        </div>
                      )}

                      <div className="relative z-10 flex flex-col md:flex-row bg-surface-container-low/40 backdrop-blur-[2px]">
                        {/* Image */}
                        {event.image && (
                          <div className="overflow-hidden md:w-1/3 lg:w-1/4 h-48 md:h-auto shrink-0 border-r border-outline-variant/10 relative">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                            />
                            {event.userStatus && new Date(event.dateStart) >= new Date() && (
                              <div className="absolute top-0 left-0 bg-primary text-surface px-2 py-1 text-[8px] font-black uppercase tracking-widest shadow-lg">
                                {event.userStatus === 'GOING' ? 'Zapisano' : 'Zainteresowany'}
                              </div>
                            )}
                          </div>
                        )}
                        {/* Content */}
                        <div className="p-6 md:p-8 flex flex-col justify-center flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5">{event.type}</span>
                            {event.isExpedition && event.difficulty > 0 && (
                              <span className="text-primary text-xs tracking-widest font-black">
                                {'★'.repeat(event.difficulty)}{'☆'.repeat(5 - event.difficulty)}
                              </span>
                            )}
                          </div>
                          <h3 className="font-display font-black text-xl md:text-2xl uppercase tracking-tight mb-3 group-hover:text-primary transition-colors text-on-surface">
                            {event.title}
                          </h3>
                          <div className="space-y-1.5 text-on-surface-variant text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-primary shrink-0" />
                              <span>{new Date(event.dateStart).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-primary shrink-0" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          {event.spots !== null && event.spots > 0 && (
                            <div className="mt-4 pt-3 border-t border-outline-variant/20">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${Math.max(0, event.spots - (event.goingCount || 0)) === 0 ? 'text-red-500' : 'text-on-surface-variant'}`}>
                                {Math.max(0, event.spots - (event.goingCount || 0)) === 0 ? 'Brak wolnych miejsc' : `${Math.max(0, event.spots - (event.goingCount || 0))} wolnych miejsc`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Show more button */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => setVisibleCount(prev => prev + 3)}
                    disabled={visibleCount >= featuredEvents.length}
                    className={`px-8 py-4 font-display font-black text-xs uppercase tracking-widest border transition-all duration-300 ${
                      visibleCount >= featuredEvents.length
                        ? 'border-outline-variant/30 text-on-surface-variant/30 cursor-not-allowed opacity-50'
                        : 'border-primary text-primary hover:bg-primary hover:text-surface active:scale-95'
                    }`}
                  >
                    {visibleCount >= featuredEvents.length ? 'To już wszystko' : 'Pokaż więcej wydarzeń'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-on-surface-variant italic text-sm mb-4">Brak zaplanowanych wyróżnionych wydarzeń.</p>
                <Link to="/wydarzenia" className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">
                  Zobacz wszystkie nadchodzące wydarzenia →
                </Link>
              </div>
            )}
          </div>

          {/* Mobile footer link */}
          <div className="md:hidden border-t border-outline-variant/30 px-8 py-4">
            <Link to="/wydarzenia" className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
              Wszystkie wydarzenia <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* NASZE OSIĄGNIĘCIA — highlighted wyprawy                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {highlightedEvents.length > 0 && (
        <section className="px-6 md:px-12 max-w-7xl mx-auto mb-32">
          <div className="flex items-center gap-4 mb-12">
            <Link to="/wydarzenia" className="flex items-center gap-3 group">
              <Trophy size={24} className="text-primary group-hover:scale-110 transition-transform" />
              <h2 className="font-display font-black text-4xl uppercase tracking-tighter group-hover:text-primary transition-colors">Nasze Osiągnięcia</h2>
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
                {event.userStatus && new Date(event.dateStart) >= new Date() && (
                  <div className="absolute top-4 right-4 bg-primary text-surface px-2 py-1 text-[8px] font-black uppercase tracking-widest shadow-lg z-20">
                    {event.userStatus === 'GOING' ? 'Zapisano' : 'Zainteresowany'}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2">{event.type}</p>
                  <h3 className="text-white font-display font-black text-2xl uppercase leading-none mb-2 tracking-tighter">{event.title}</h3>
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

      {/* Strips Container */}
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

      {/* Contact Section */}
      <section className="bg-surface py-32 relative z-0 -mt-[4vw] pt-[12vw]">
        <div className="container mx-auto px-6 md:px-8 text-center max-w-3xl">
          <h2 className="font-display font-black text-4xl md:text-6xl text-on-surface uppercase tracking-tighter mb-6">
            CHCESZ WYJŚĆ Z NAMI?
          </h2>
          <p className="text-on-surface-variant text-lg md:text-xl leading-relaxed mb-12">
            Dołącz do ekspedycji. Nasze wyjścia są prywatne, wyselekcjonowane i rygorystyczne.<br className="hidden sm:block"/>
            Podążaj za sygnałem na naszych platformach społecznościowych.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-8 py-4 border-2 border-on-surface text-on-surface font-display font-bold uppercase tracking-widest text-sm hover:bg-on-surface hover:text-surface transition-colors">
              INSTAGRAM
            </button>
            <button className="px-8 py-4 border-2 border-on-surface text-on-surface font-display font-bold uppercase tracking-widest text-sm hover:bg-on-surface hover:text-surface transition-colors">
              FACEBOOK
            </button>
            <button className="px-8 py-4 border-2 border-on-surface text-on-surface font-display font-bold uppercase tracking-widest text-sm hover:bg-on-surface hover:text-surface transition-colors">
              DISCORD
            </button>
            <button className="px-8 py-4 bg-[#c23b6d] text-white font-display font-bold uppercase tracking-widest text-sm hover:bg-[#a3315b] transition-colors">
              NEWSLETTER
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function SlantedStrip({ zIndex, clipPath, marginTop, img, overlayClass, label, labelClass = "text-white/80", title, titleClass, desc, descClass, align }: any) {
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
          <h2 className={`font-display font-black text-5xl md:text-8xl uppercase tracking-tighter mb-6 ${titleClass}`}>
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
