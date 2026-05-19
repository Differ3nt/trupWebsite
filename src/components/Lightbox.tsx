import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface LightboxImage {
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

export function Lightbox({ images, initialIndex, albumTitle, onClose }: LightboxProps) {
  const [currentIdx, setCurrentIdx] = useState(initialIndex);
  const [progress, setProgress] = useState(0); // 0-100
  const [fullResUrl, setFullResUrl] = useState<string | null>(null);
  const [fullResLoaded, setFullResLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const currentImage = images[currentIdx];

  const loadFullRes = useCallback(async (image: LightboxImage) => {
    // Cancel any in-flight fetch
    if (abortRef.current) abortRef.current.abort();
    // Revoke previous object URL
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

      const blob = new Blob(chunks);
      const objectUrl = URL.createObjectURL(blob);
      objectUrlRef.current = objectUrl;
      setFullResUrl(objectUrl);
      setProgress(100);
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error('Full-res load failed:', e);
    }
  }, []);

  useEffect(() => {
    loadFullRes(currentImage);
    return () => { abortRef.current?.abort(); };
  }, [currentIdx, loadFullRes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentIdx, onClose]);

  const navigate = (dir: number) => {
    setCurrentIdx(prev => (prev + dir + images.length) % images.length);
  };

  const handleDownload = () => {
    window.location.href = `/api/images/${currentImage.id}/download`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Progress bar — thin line at top, hidden when at 100% and full-res shown */}
      {progress < 100 && (
        <div className="absolute top-0 left-0 right-0 h-0.5 z-10 bg-white/10">
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center p-6 text-white shrink-0">
        <div className="font-bold text-xs tracking-widest uppercase">
          {albumTitle} ({currentIdx + 1} / {images.length})
          {progress < 100 && <span className="ml-3 text-primary">{progress}%</span>}
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={handleDownload}
            className="hover:text-primary flex items-center gap-2 font-bold text-xs tracking-widest uppercase transition-colors"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Pobierz</span>
          </button>
          <button onClick={onClose} className="hover:text-primary transition-colors p-2">
            <X size={32} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 flex items-center justify-between px-2 md:px-8 pb-8 min-h-0">
        <button onClick={() => navigate(-1)} className="p-2 md:p-4 text-white/60 hover:text-primary transition-colors shrink-0">
          <ChevronLeft size={48} strokeWidth={1} />
        </button>

        <div className="flex-1 h-full flex items-center justify-center relative min-w-0">
          {/* Thumbnail (always visible as backdrop until full-res ready) */}
          <img
            src={currentImage.thumbnailUrl}
            alt={currentImage.alt || ''}
            className="max-h-full max-w-full object-contain absolute inset-0 m-auto"
            style={{ filter: fullResLoaded ? 'none' : 'blur(0px)' }}
          />
          {/* Full-res (fades in on top when ready) */}
          {fullResUrl && (
            <img
              src={fullResUrl}
              alt={currentImage.alt || ''}
              className="max-h-full max-w-full object-contain absolute inset-0 m-auto transition-opacity duration-500"
              style={{ opacity: fullResLoaded ? 1 : 0 }}
              onLoad={() => setFullResLoaded(true)}
            />
          )}
        </div>

        <button onClick={() => navigate(1)} className="p-2 md:p-4 text-white/60 hover:text-primary transition-colors shrink-0">
          <ChevronRight size={48} strokeWidth={1} />
        </button>
      </div>
    </div>,
    document.body
  );
}
