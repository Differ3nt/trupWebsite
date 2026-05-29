import React, { useRef, useState } from 'react';
import { Move } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImagePositionPickerProps {
  src: string;
  focalX: number;  // 0–100
  focalY: number;  // 0–100
  onChange: (x: number, y: number) => void;
  className?: string;
}

export default function ImagePositionPicker({ src, focalX, focalY, onChange, className }: ImagePositionPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ clientX: 0, clientY: 0, focalX: 50, focalY: 50 });
  const [isDragging, setIsDragging] = useState(false);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStart.current = { clientX: e.clientX, clientY: e.clientY, focalX, focalY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = containerRef.current;
    // Drag right → image shifts right → we see more of the left → x% decreases
    const dx = ((e.clientX - dragStart.current.clientX) / w) * 100;
    const dy = ((e.clientY - dragStart.current.clientY) / h) * 100;
    const newX = Math.round(Math.max(0, Math.min(100, dragStart.current.focalX - dx)));
    const newY = Math.round(Math.max(0, Math.min(100, dragStart.current.focalY - dy)));
    onChange(newX, newY);
  };

  const onPointerUp = () => setIsDragging(false);

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Kadrowanie tła</span>
        <span className="text-[9px] font-mono text-on-surface-variant/50">{focalX}% / {focalY}%</span>
      </div>

      <div
        ref={containerRef}
        className={cn(
          'relative w-full overflow-hidden border border-outline-variant/30 select-none',
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        )}
        style={{ aspectRatio: '16/7' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
        />

        {/* Drag hint — fades while dragging */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-150',
          isDragging ? 'opacity-0' : 'opacity-100'
        )}>
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 backdrop-blur-sm">
            <Move size={12} className="text-white/80" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">Przeciągnij aby ustawić</span>
          </div>
        </div>

        {/* Rule-of-thirds grid overlay — subtle guide */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
        </div>
      </div>
    </div>
  );
}
