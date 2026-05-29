'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download } from '@/components/icons';
import { ProgressBar } from './ProgressBar';

export interface LightboxImage {
  id: string;
  thumbnailUrl: string;
  originalUrl: string;
  alt?: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  albumTitle: string;
  onClose: () => void;
}

/**
 * Full-screen image viewer: thumbnail shown instantly, full-resolution image
 * streamed in with a real download-progress bar (Content-Length driven), prev/
 * next navigation, keyboard control, and download. Ported from the legacy
 * Lightbox and made reusable — any gallery surface mounts this.
 */
export function Lightbox({ images, initialIndex, albumTitle, onClose }: LightboxProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [fullResUrl, setFullResUrl] = useState<string | null>(null);
  const [fullResLoaded, setFullResLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const currentImage = images[currentIdx];

  const loadFullRes = useCallback(async (image: LightboxImage) => {
    if (abortRef.current) abortRef.current.abort();
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

    setFullResUrl(null);
    setFullResLoaded(false);
    setProgress(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(image.originalUrl, { signal: controller.signal });
      const contentLength = response.headers.get('Content-Length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        if (total > 0) setProgress(Math.round((loaded / total) * 100));
      }

      const blob = new Blob(chunks as BlobPart[]);
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      setFullResUrl(objectUrl);
      setProgress(100);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error('Full-res load failed:', e);
    }
  }, []);

  const navigate = useCallback(
    (dir: number) => setCurrentIdx((prev) => (prev + dir + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    loadFullRes(currentImage);
    return () => {
      abortRef.current?.abort();
    };
  }, [currentIdx, currentImage, loadFullRes]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate, onClose]);

  const handleDownload = () => {
    window.location.href = `/api/images/${currentImage.id}/download`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col bg-black" role="dialog" aria-modal="true">
      {progress < 100 && <ProgressBar value={progress} className="absolute top-0 left-0 right-0 z-10" />}

      <div className="flex shrink-0 items-center justify-between p-6 text-white">
        <div className="text-xs font-bold uppercase tracking-widest">
          {albumTitle} ({currentIdx + 1} / {images.length})
          {progress < 100 && <span className="ml-3 text-primary">{progress}%</span>}
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors hover:text-primary"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Pobierz</span>
          </button>
          <button onClick={onClose} aria-label="Zamknij" className="p-2 transition-colors hover:text-primary">
            <X size={32} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-between px-2 pb-8 md:px-8">
        <button
          onClick={() => navigate(-1)}
          aria-label="Poprzednie zdjęcie"
          className="shrink-0 p-2 text-white/60 transition-colors hover:text-primary md:p-4"
        >
          <ChevronLeft size={48} strokeWidth={1} />
        </button>

        <div
          className="relative flex h-full min-w-0 flex-1 items-center justify-center"
          onContextMenu={(e) => e.preventDefault()}
        >
          <img
            src={currentImage.thumbnailUrl}
            alt={currentImage.alt || ''}
            className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
            draggable={false}
          />
          {fullResUrl && (
            <img
              src={fullResUrl}
              alt={currentImage.alt || ''}
              className="absolute inset-0 m-auto max-h-full max-w-full object-contain transition-opacity duration-500"
              style={{ opacity: fullResLoaded ? 1 : 0 }}
              onLoad={() => setFullResLoaded(true)}
              draggable={false}
            />
          )}
          <div className="absolute inset-0" onContextMenu={(e) => e.preventDefault()} />
        </div>

        <button
          onClick={() => navigate(1)}
          aria-label="Następne zdjęcie"
          className="shrink-0 p-2 text-white/60 transition-colors hover:text-primary md:p-4"
        >
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </div>
    </div>,
    document.body
  );
}
