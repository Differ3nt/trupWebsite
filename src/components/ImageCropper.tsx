import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCcw, ZoomIn, Move } from 'lucide-react';

interface ImageCropperProps {
  image: string;
  aspect?: number; // width / height
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, aspect = 1, onCropComplete, onCancel }: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset when image changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setImgLoaded(false);
  }, [image]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setOffset({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    const img = imageRef.current;
    const container = containerRef.current;
    if (!img || !container) return;

    // We want the output to be high quality
    const size = 800; 
    canvas.width = size;
    canvas.height = size / aspect;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // Find crop area in container coordinates
    const cropWidth = Math.min(containerWidth, containerHeight * aspect) * 0.8;
    const cropHeight = cropWidth / aspect;
    const cropX = (containerWidth - cropWidth) / 2;
    const cropY = (containerHeight - cropHeight) / 2;

    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate image position relative to crop area
    // Scale is (output size / crop area size)
    const scale = canvas.width / cropWidth;

    const drawX = (offset.x + (containerWidth - img.width * zoom) / 2 - cropX) * scale;
    const drawY = (offset.y + (containerHeight - img.height * zoom) / 2 - cropY) * scale;
    const drawWidth = img.width * zoom * scale;
    const drawHeight = img.height * zoom * scale;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    canvas.toBlob((blob) => {
      if (blob) onCropComplete(blob);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col font-sans">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-md z-20">
        <button onClick={onCancel} className="p-2 text-white/60 hover:text-white transition-colors">
          <X size={24} />
        </button>
        <div className="text-center">
          <h2 className="font-display font-black text-xl uppercase tracking-tighter text-white">Kadrowanie</h2>
          <p className="text-[9px] text-white/40 uppercase tracking-[0.2em] font-bold">Przesuń i dopasuj zdjęcie</p>
        </div>
        <button onClick={handleConfirm} className="bg-primary text-surface px-6 py-2 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-colors">
          <Check size={18} /> ZATWIERDŹ
        </button>
      </div>

      {/* Main Area */}
      <div 
        ref={containerRef}
        className="relative flex-1 bg-[#0a0a0a] overflow-hidden cursor-move touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* The Image */}
        <img
          ref={imageRef}
          src={image}
          alt=""
          onLoad={() => setImgLoaded(true)}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            maxWidth: 'none',
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: imageRef.current ? -imageRef.current.height / 2 : 0,
            marginLeft: imageRef.current ? -imageRef.current.width / 2 : 0,
          }}
          className={`pointer-events-none select-none ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* The Mask Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div 
            className="border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] z-10 relative"
            style={{
              width: '80%',
              aspectRatio: `${aspect}`,
              maxWidth: aspect > 1 ? '90%' : '80vh'
            }}
          >
             {/* Corner markers */}
             <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
             <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
             <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
             <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary"></div>
             
             {/* Center indicator */}
             <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Move className="text-white" size={32} />
             </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 bg-black border-t border-white/10 flex flex-col items-center gap-6 z-20">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <span className="flex items-center gap-2"><ZoomIn size={12} /> Przybliżenie</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            value={zoom}
            min={0.5}
            max={4}
            step={0.01}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        
        <div className="flex gap-8">
          <button 
            onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
            className="text-white/40 hover:text-primary transition-colors flex items-center gap-2 font-bold uppercase tracking-widest text-[10px]"
          >
            <RotateCcw size={14} /> Resetuj
          </button>
        </div>
      </div>
    </div>
  );
}
