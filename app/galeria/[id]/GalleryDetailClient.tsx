'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

interface AlbumImage {
  id: string;
  thumbnailUrl: string | null;
  originalUrl: string;
}

interface AlbumData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  images: AlbumImage[];
}

interface GalleryDetailClientProps {
  album: AlbumData;
}

export function GalleryDetailClient({ album }: GalleryDetailClientProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIdx(null);
      } else if (e.key === 'ArrowLeft') {
        setLightboxIdx((prev) => (prev === 0 ? album.images.length - 1 : (prev ?? 0) - 1));
      } else if (e.key === 'ArrowRight') {
        setLightboxIdx((prev) => (prev === album.images.length - 1 ? 0 : (prev ?? 0) + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIdx, album.images.length]);

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxIdx === null) return;
    if (direction === 'prev') {
      setLightboxIdx((prev) => (prev === 0 ? album.images.length - 1 : (prev ?? 0) - 1));
    } else {
      setLightboxIdx((prev) => (prev === album.images.length - 1 ? 0 : (prev ?? 0) + 1));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      {/* Back Link */}
      <Link
        href="/galeria"
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-12"
      >
        <ArrowLeft size={14} /> Powrót do galerii
      </Link>

      {/* Header */}
      <header className="mb-12">
        <h1 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tighter text-on-surface leading-[0.9] mb-4">
          {album.title}
        </h1>
        {album.location && (
          <p className="text-on-surface-variant text-sm uppercase tracking-widest mb-4">{album.location}</p>
        )}
        {album.description && (
          <div className="max-w-3xl">
            <p
              className={`text-sm text-on-surface-variant leading-relaxed transition-all ${
                isExpanded ? '' : 'line-clamp-2'
              }`}
            >
              {album.description}
            </p>
            {album.description.length > 150 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline mt-2"
              >
                {isExpanded ? 'Zwiń' : 'Czytaj więcej'}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-12">
        {album.images.map((image, idx) => (
          <button
            key={image.id}
            onClick={() => setLightboxIdx(idx)}
            className="group relative aspect-square overflow-hidden bg-surface-container-low border border-outline-variant/30 hover:border-primary transition-colors cursor-pointer"
          >
            <img
              src={image.thumbnailUrl || image.originalUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Main Image */}
          <div className="relative w-full h-full flex items-center justify-center max-w-5xl max-h-[90vh]">
            <img
              src={album.images[lightboxIdx].originalUrl}
              alt=""
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Close Button */}
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white p-3 transition-colors rounded-full"
            >
              <X size={24} />
            </button>

            {/* Navigation Arrows */}
            {album.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('prev');
                  }}
                  className="absolute left-4 bg-black/60 hover:bg-black text-white p-3 transition-colors rounded-full"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateLightbox('next');
                  }}
                  className="absolute right-4 bg-black/60 hover:bg-black text-white p-3 transition-colors rounded-full"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 text-sm font-bold rounded-full">
              {lightboxIdx + 1} / {album.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
