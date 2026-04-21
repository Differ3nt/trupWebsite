import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

export default function Home() {
  const { role } = useAppContext();

  return (
    <>
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pt-56 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto">
        <h1 className="font-display font-black text-5xl sm:text-6xl md:text-[8rem] leading-[0.9] tracking-tighter text-on-surface uppercase mb-8">
          SUROWA <span className="text-primary">GÓRSKA</span><br />
          POTĘGA.
        </h1>
        <p className="text-on-surface-variant text-base md:text-xl max-w-2xl leading-relaxed mb-10 font-medium">
          Jesteśmy kolektywem wyrzeźbionym z granitu i iglastych lasów.<br className="hidden md:block"/>
          TRUP to więcej niż grupa; to monolit eksploracji.
        </p>
      </section>

      {/* Aktualności (Only for logged in) */}
      {role !== 'guest' && (
        <section className="px-6 md:px-12 max-w-7xl mx-auto mb-24">
          <div className="border border-outline-variant/30 bg-surface-container-low p-8">
             <div className="flex justify-between items-end mb-8 border-b border-outline-variant/30 pb-4">
               <Link to="/aktualnosci" className="font-display font-black text-3xl uppercase tracking-tighter text-primary hover:text-primary/80 transition-colors">Aktualności</Link>
               <Link to="/aktualnosci" className="hidden md:block text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary">Zobacz wszystkie uaktualnienia</Link>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Najbliższe Wydarzenie</span>
                  <h3 className="font-display font-bold text-2xl uppercase mb-2">Zimowe Tatry: Orla Perć</h3>
                  <p className="text-sm text-on-surface-variant mb-4">15-18 Grudnia 2024</p>
                  <Link to="/wydarzenia/2024_01" className="text-sm font-bold uppercase tracking-widest text-primary hover:underline">Szczegóły logistyczne</Link>
               </div>
               <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Nowa Galeria</span>
                  <h3 className="font-display font-bold text-2xl uppercase mb-2">Beskidy Jesienią</h3>
                  <p className="text-sm text-on-surface-variant mb-4">Dodano 42 nowe ujęcia z ostatniej wyprawy.</p>
                  <Link to="/galeria/bieszczady-jesien" className="text-sm font-bold uppercase tracking-widest text-primary hover:underline">Otwórz Lightbox</Link>
               </div>
             </div>
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

