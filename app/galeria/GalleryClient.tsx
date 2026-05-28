'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, MapPin, Calendar } from '@/components/icons';
import { EmptyState } from '@/components/states/EmptyState';

interface AlbumImage {
  id: string;
  thumbnailUrl: string | null;
}

interface AlbumData {
  id: string;
  title: string;
  date: Date;
  distance?: number | null;
  duration?: number | null;
  locationMap?: string | null;
  description?: string | null;
  location?: string | null;
  images: AlbumImage[];
}

interface GalleryClientProps {
  albums: AlbumData[];
}

export function GalleryClient({ albums }: GalleryClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated by looking for session
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me');
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (albums.length === 0) {
    return (
      <EmptyState
        icon={<Lock size={48} />}
        title="Brak albumów"
        description="Nie ma jeszcze żadnych albumów ze zdjęciami."
      />
    );
  }

  return (
    <div className="space-y-12">
      {albums.map((album) => {
        const displayImages = isAuthenticated ? album.images : album.images.slice(0, 1);

        return (
          <div key={album.id}>
            {/* Album Header */}
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-outline-variant/30">
              <div>
                <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface mb-2">
                  {album.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-primary" />
                    {new Date(album.date).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' })}
                  </div>
                  {album.location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-primary" />
                      {album.location}
                    </div>
                  )}
                  <div className="text-on-surface-variant/60">
                    {album.images.length} zdjęć
                  </div>
                </div>
              </div>
            </div>

            {/* Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
              {displayImages.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square bg-surface-container-low overflow-hidden border border-outline-variant/30"
                >
                  {image.thumbnailUrl ? (
                    <img
                      src={image.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container-highest" />
                  )}
                </div>
              ))}

              {/* Full Album Button - only for authenticated users */}
              {isAuthenticated && album.images.length > displayImages.length && (
                <Link
                  href={`/galeria/${album.id}`}
                  className="aspect-square bg-primary hover:bg-primary/80 transition-colors flex flex-col items-center justify-center text-surface font-bold uppercase tracking-widest text-center p-4 cursor-pointer group border border-outline-variant/30"
                >
                  <div className="text-center">
                    <div className="text-3xl font-black mb-2">+{album.images.length - displayImages.length}</div>
                    <div className="text-[9px]">Pełny Album</div>
                  </div>
                </Link>
              )}

              {/* Login prompt - only show if not authenticated and there are more images */}
              {!isAuthenticated && album.images.length > 1 && (
                <div className="aspect-square bg-surface-container-low border border-outline-variant/30 flex flex-col items-center justify-center text-center p-4">
                  <Lock size={24} className="text-on-surface-variant/40 mb-2" />
                  <p className="text-[9px] text-on-surface-variant/60 font-bold uppercase tracking-widest">
                    Zaloguj się, aby zobaczyć więcej
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {!isAuthenticated && (
        <div className="p-8 bg-surface-container-low border border-outline-variant/30 text-center rounded">
          <Lock size={32} className="mx-auto mb-4 text-on-surface-variant/40" />
          <p className="text-sm text-on-surface-variant mb-4">
            Albomy dostępne są wyłącznie dla zalogowanych członków grupy TRUP.
          </p>
          <a href="/api/auth/signin" className="text-primary font-bold uppercase tracking-widest hover:underline">
            Zaloguj się
          </a>
        </div>
      )}
    </div>
  );
}
