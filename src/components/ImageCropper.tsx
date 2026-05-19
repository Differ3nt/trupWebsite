import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, RotateCcw, ZoomIn } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  aspect?: number;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, aspect = 16 / 9, onCropComplete, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.05);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOrigin = useRef({ x: 0, y: 0 });
  const areaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNatural({ w: 0, h: 0 });
  }, [image]);

  const handleLoad = () => {
    const img = imgRef.current;
    if (!img) return;

    const nat = { w: img.naturalWidth, h: img.naturalHeight };
    setNatural(nat);

    // Defer measurement until after the flex layout has painted
    requestAnimationFrame(() => {
      const area = areaRef.current;
      if (!area || area.offsetWidth === 0) return;
      const cropW = area.offsetWidth * 0.8;
      const cropH = cropW / aspect;
      const fill = Math.max(cropW / nat.w, cropH / nat.h);
      if (fill > 0 && isFinite(fill)) {
        setMinZoom(fill);
        setZoom(fill);
      }
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragOrigin.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragOrigin.current.x, y: e.clientY - dragOrigin.current.y });
  };

  const onPointerUp = () => setIsDragging(false);

  const handleConfirm = useCallback(() => {
    const area = areaRef.current;
    const img = imgRef.current;
    if (!area || !img || natural.w === 0) return;

    const areaW = area.offsetWidth;
    const areaH = area.offsetHeight;

    // Crop box in area coords
    const cropW = areaW * 0.8;
    const cropH = cropW / aspect;
    const cropLeft = (areaW - cropW) / 2;
    const cropTop = (areaH - cropH) / 2;

    // Rendered image size in area coords
    const rendW = natural.w * zoom;
    const rendH = natural.h * zoom;

    // Image top-left in area coords
    const imgLeft = (areaW - rendW) / 2 + offset.x;
    const imgTop = (areaH - rendH) / 2 + offset.y;

    // Map crop box back to natural image pixel coords
    const srcX = ((cropLeft - imgLeft) / rendW) * natural.w;
    const srcY = ((cropTop - imgTop) / rendH) * natural.h;
    const srcW = (cropW / rendW) * natural.w;
    const srcH = (cropH / rendH) * natural.h;

    const OUT_W = 1600;
    const OUT_H = Math.round(OUT_W / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUT_W, OUT_H);
    canvas.toBlob((blob) => { if (blob) onCropComplete(blob); }, 'image/jpeg', 0.92);
  }, [natural, zoom, offset, aspect, onCropComplete]);

  const dispW = natural.w * zoom;
  const dispH = natural.h * zoom;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div
        className="bg-black border border-white/10 w-full max-w-2xl flex flex-col shadow-2xl"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <button onClick={onCancel} className="p-2 text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
          <div className="text-center">
            <h2 className="font-display font-black text-lg uppercase tracking-tighter text-white">Kadrowanie</h2>
            <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">Przesuń i dopasuj</p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={natural.w === 0}
            className="bg-primary text-surface px-5 py-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={16} /> Zatwierdź
          </button>
        </div>

        {/* Crop area */}
        <div
          ref={areaRef}
          className="relative bg-[#111] overflow-hidden cursor-move touch-none select-none"
          style={{ aspectRatio: String(aspect * 1.35), minHeight: 180 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Image */}
          {natural.w === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs font-bold uppercase tracking-widest">
              Ładowanie…
            </div>
          )}
          <img
            ref={imgRef}
            src={image}
            alt=""
            onLoad={handleLoad}
            draggable={false}
            className="absolute pointer-events-none select-none"
            style={{
              width: natural.w > 0 ? dispW : undefined,
              height: natural.h > 0 ? dispH : undefined,
              maxWidth: 'none',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />

          {/* Crop frame */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute border-2 border-primary"
              style={{
                width: '80%',
                aspectRatio: String(aspect),
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              }}
            >
              <div className="absolute -top-0.5 -left-0.5 w-4 h-4 border-t-4 border-l-4 border-primary" />
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 border-t-4 border-r-4 border-primary" />
              <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 border-b-4 border-l-4 border-primary" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 border-b-4 border-r-4 border-primary" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-5 border-t border-white/10 flex flex-col items-center gap-3 shrink-0">
          <div className="w-full max-w-xs">
            <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
              <span className="flex items-center gap-1"><ZoomIn size={10} /> Przybliżenie</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={minZoom}
              max={Math.max(minZoom * 5, 4)}
              step={Math.max(0.001, (Math.max(minZoom * 5, 4) - minZoom) / 200)}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
          <button
            onClick={() => { setZoom(minZoom); setOffset({ x: 0, y: 0 }); }}
            className="text-white/40 hover:text-primary transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]"
          >
            <RotateCcw size={12} /> Resetuj
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
