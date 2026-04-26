import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Lock } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

export default function Gallery() {
  const { role } = useAppContext();
  const [albums, setAlbums] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    fetch('/api/albums')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAlbums(data);
      })
      .catch(err => console.error('Błąd pobierania galerii:', err))
      .finally(() => setLoading(false));
  }, []);

  const showLoginPrompt = role === 'guest';
  // Bez zalogowania pokazujemy tylko pierwszy album
  const visibleAlbums = showLoginPrompt ? albums.slice(0, 1) : albums;

  if (loading) return <div className="pt-32 text-center text-on-surface font-bold uppercase tracking-widest">Wczytywanie archiwum...</div>;

  return (
    <div className="pt-32 pb-24 bg-surface min-h-screen">
      {/* Header Section */}
      <div className="px-6 md:px-12 max-w-7xl mx-auto mb-12 md:mb-20">
        <div className="border-l-4 border-primary pl-6 md:pl-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-7xl lg:text-[6rem] leading-[0.9] text-on-surface uppercase tracking-tighter mb-6">
              ARCHIWUM WIZUALNE
            </h1>
            <p className="text-on-surface-variant text-xs md:text-base max-w-2xl uppercase tracking-widest leading-relaxed font-bold">
              DOKUMENTACJA WYPRAW, SZKOLEŃ I EKSPEDYCJI GRUPY GÓRSKIEJ. BRUTALNA SZCZEROŚĆ NATURY UCHWYCONA W KADRZE.
            </p>
          </div>
          {showLoginPrompt && (
            <div className="bg-surface-container-highest p-6 max-w-sm border border-outline-variant/30 flex items-start gap-4">
               <Lock className="text-primary mt-1 shrink-0" size={24} />
               <div>
                 <h3 className="text-on-surface font-bold uppercase tracking-widest text-sm mb-2">Prywatna Galeria</h3>
                 <p className="text-on-surface-variant text-xs leading-relaxed">Widzisz tylko ujęcia promocyjne. Pełne archiwa wypraw na własnym serwerze wymagają zalogowania.</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Albums List */}
      <div className="flex flex-col gap-20">
        {visibleAlbums.map((album) => (
          <div key={album.id} className="max-w-7xl mx-auto px-6 md:px-12 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-outline-variant/30 pb-4">
              <div>
                <div className="text-primary font-bold text-xs tracking-widest uppercase mb-1">ARCHIWUM {new Date(album.date).getFullYear()}</div>
                <h2 className="font-display font-black text-3xl md:text-4xl uppercase tracking-tighter text-on-surface">{album.title}</h2>
              </div>
              <div className="text-left md:text-right mt-4 md:mt-0">
                <div className="text-on-surface-variant text-[10px] md:text-xs tracking-widest uppercase font-bold">LOKALIZACJA: {album.location}</div>
                <div className="text-on-surface-variant text-[10px] md:text-xs tracking-widest uppercase font-bold">ZDJĘĆ: {album.images?.length || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(album.images || []).map((img: any, idx: number) => (
                <div key={img.id} className="aspect-square overflow-hidden bg-surface-variant">
                  <img 
                    src={img.thumbnailUrl} 
                    alt={`${album.title} - photo ${idx + 1}`} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
              
              {!showLoginPrompt && (
                <Link 
                  to={`/galeria/${album.id}`} 
                  className="bg-primary flex flex-col items-center justify-center text-surface hover:bg-primary/90 transition-colors aspect-square"
                >
                  <Plus size={32} strokeWidth={2.5} className="mb-2" />
                  <span className="font-bold text-xs tracking-widest uppercase">PEŁNY ALBUM</span>
                </Link>
              )}
            </div>
          </div>
        ))}
        {albums.length === 0 && !loading && (
          <div className="text-center py-24 text-on-surface-variant uppercase tracking-widest text-sm font-bold">Archiwum jest puste.</div>
        )}
      </div>
    </div>
  );
}
