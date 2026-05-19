import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Upload, Maximize2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Lightbox } from '../components/Lightbox';

export default function GalleryDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAppContext();

  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showFullDesc, setShowFullDesc] = useState(false);

  React.useEffect(() => {
    fetch(`/api/albums/${id}`)
      .then(res => res.json())
      .then(data => {
        setAlbum(data);
      })
      .catch(err => console.error('Błąd pobierania albumu:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="pt-32 pb-24 bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="h-8 w-24 animate-pulse bg-white/5 mb-12" />
        <div className="border-l-4 border-primary pl-6 mb-12 space-y-4">
          <div className="h-3 w-32 animate-pulse bg-white/5" />
          <div className="h-14 w-2/3 animate-pulse bg-white/5" />
          <div className="h-3 w-48 animate-pulse bg-white/5" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse bg-white/5" />
          ))}
        </div>
      </div>
    </div>
  );

  if (!album) {
    return (
      <div className="pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto text-center min-h-screen">
        <h1 className="font-display font-black text-4xl uppercase mb-4">Nie znaleziono albumu</h1>
        <Link to="/galeria" className="btn btn-secondary px-8 py-4">
          Wróć do galerii
        </Link>
      </div>
    );
  }

  const allImages = album.images || [];

  return (
    <div className="pt-32 pb-24 bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Back Button */}
        <Link to="/galeria" className="btn btn-back inline-flex items-center gap-2 px-4 py-2 mb-12">
          <ArrowLeft size={16} />
          Wróć do archiwum
        </Link>

        {/* Header with Stats & Actions */}
        <div className="border-l-4 border-primary pl-6 md:pl-8 mb-12">
          <div className="text-primary font-bold text-sm tracking-widest uppercase mb-2">ARCHIWUM {new Date(album.date).getFullYear()}</div>
          <h1 className="font-display font-black text-5xl md:text-7xl leading-[0.9] text-on-surface uppercase tracking-tighter mb-6">
            {album.title}
          </h1>
          
          <div className="flex flex-wrap gap-6 text-on-surface-variant text-xs tracking-widest uppercase font-bold mb-6">
            <div className="flex items-center gap-2"><MapPin size={16} className="text-primary" /> {album.location}</div>
          </div>
          
          <div className="max-w-2xl text-on-surface-variant font-medium text-sm leading-relaxed mb-6">
            <p className={showFullDesc ? '' : 'line-clamp-2'}>
              {album.description || 'Brak opisu dla tego albumu.'}
            </p>
            {album.description && (
              <button onClick={() => setShowFullDesc(!showFullDesc)} className="text-primary hover:underline mt-2 text-xs font-bold uppercase tracking-widest">
                {showFullDesc ? 'Zwiń' : 'Pokaż więcej'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
             {role !== 'guest' && (
                <button className="btn btn-primary px-6 py-3 text-xs flex items-center gap-2">
                  <Upload size={16} /> Dodaj swoje ujęcia
                </button>
             )}
          </div>
        </div>

        {/* List Controls */}
        <div className="flex justify-between items-center mb-6 pt-6 border-t border-outline-variant/30 text-on-surface-variant">
           <div className="text-xs font-bold uppercase tracking-widest">{allImages.length} Zdjęć</div>
        </div>

        {/* Full Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {allImages.map((img: any, idx: number) => (
            <PhotoTile
              key={img.id}
              img={img}
              idx={idx}
              albumTitle={album.title}
              onClick={() => setLightboxIdx(idx)}
            />
          ))}
        </div>
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          images={allImages.map((img: any, i: number) => ({
            id: img.id,
            thumbnailUrl: img.thumbnailUrl,
            originalUrl: img.originalUrl,
            alt: `${album.title} - photo ${i + 1}`
          }))}
          initialIndex={lightboxIdx}
          albumTitle={album.title}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}

function PhotoTile({ img, idx, albumTitle, onClick }: { img: any; idx: number; albumTitle: string; onClick: () => void }) {
  const [loaded, setLoaded] = React.useState(false);

  return (
    <div
      className="aspect-square overflow-hidden bg-surface-variant relative group cursor-pointer"
      onClick={loaded ? onClick : undefined}
    >
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/5" />}
      <img
        src={img.thumbnailUrl}
        alt={`${albumTitle} - photo ${idx + 1}`}
        className={`w-full h-full object-cover hover:scale-105 transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        loading="lazy"
        draggable={false}
        onContextMenu={e => e.preventDefault()}
      />
      {/* transparent overlay blocks right-click on the image element */}
      {loaded && <div className="absolute inset-0" onContextMenu={e => e.preventDefault()} />}
      {loaded && (
        <div className="absolute inset-0 bg-surface/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 className="text-white" size={32} />
        </div>
      )}
    </div>
  );
}
