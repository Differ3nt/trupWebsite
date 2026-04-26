import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Activity, Clock, Upload, Download, Maximize2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { EXPEDITIONS } from './Gallery';
import { useAppContext } from '../contexts/AppContext';

export default function GalleryDetail() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAppContext();
  
  const [album, setAlbum] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
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

  if (loading) return <div className="pt-40 text-center font-bold uppercase tracking-widest text-on-surface">Wczytywanie albumu...</div>;

  if (!album) {
    return (
      <div className="pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto text-center min-h-screen">
        <h1 className="font-display font-black text-4xl uppercase mb-4">Nie znaleziono albumu</h1>
        <Link to="/galeria" className="text-primary hover:underline font-bold tracking-widest uppercase text-sm">
          Wróć do galerii
        </Link>
      </div>
    );
  }

  const allImages = album.images || [];

  const handleDownload = (imageId: string) => {
    window.location.href = `/api/images/${imageId}/download`;
  };

  return (
    <div className="pt-32 pb-24 bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Back Button */}
        <Link to="/galeria" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-12 font-bold text-xs tracking-widest uppercase">
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
                <button className="bg-primary-container text-white px-6 py-3 text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-colors">
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
            <div key={img.id} className="aspect-square overflow-hidden bg-surface-variant relative group cursor-pointer" onClick={() => { setCurrentImageIdx(idx); setLightboxOpen(true); }}>
              <img 
                src={img.thumbnailUrl} 
                alt={`${album.title} - photo ${idx + 1}`} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-surface/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <Maximize2 className="text-white" size={32} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
         <div className="fixed inset-0 z-[100] bg-surface flex flex-col">
            <div className="flex justify-between items-center p-6 text-on-surface">
               <div className="font-bold text-xs tracking-widest uppercase">{album.title} ({currentImageIdx + 1} / {allImages.length})</div>
               <div className="flex items-center gap-6">
                  <button 
                    onClick={() => handleDownload(allImages[currentImageIdx].id)}
                    className="hover:text-primary flex items-center gap-2 font-bold text-xs tracking-widest uppercase transition-colors"
                  >
                     <Download size={18} /> <span className="hidden sm:inline">Pobierz (ZnakTRUP)</span>
                  </button>
                  <button onClick={() => setLightboxOpen(false)} className="hover:text-primary transition-colors p-2"><X size={32} /></button>
               </div>
            </div>
            <div className="flex-1 flex items-center justify-between px-2 md:px-8 pb-8">
               <button 
                  onClick={() => setCurrentImageIdx((prev) => prev > 0 ? prev - 1 : allImages.length - 1)}
                  className="p-2 md:p-4 text-on-surface hover:text-primary transition-colors"
               >
                  <ChevronLeft size={48} strokeWidth={1} />
               </button>
               <div className="h-full flex-1 flex items-center justify-center p-4">
                  <img src={allImages[currentImageIdx].thumbnailUrl} alt="Full view" className="max-h-full max-w-full object-contain drop-shadow-2xl" />
               </div>
               <button 
                  onClick={() => setCurrentImageIdx((prev) => prev < allImages.length - 1 ? prev + 1 : 0)}
                  className="p-2 md:p-4 text-on-surface hover:text-primary transition-colors"
               >
                  <ChevronRight size={48} strokeWidth={1} />
               </button>
            </div>
         </div>
      )}
    </div>
  );
}
