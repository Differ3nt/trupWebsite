import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

interface MapyLinkProps {
  url: string;
  locationName?: string;
  className?: string;
}

export default function MapyLink({ url, locationName, className }: MapyLinkProps) {
  if (!url) return null;

  const getPeakName = (mapUrl: string) => {
    try {
      const uri = new URL(mapUrl);
      // Próba wyciągnięcia z parametru 'q' (standardowe wyszukiwanie)
      const q = uri.searchParams.get('q');
      if (q) return decodeURIComponent(q);

      // Próba wyciągnięcia z parametru 'id' lub podobnych (czasem Mapy.cz tak robią)
      const source = uri.searchParams.get('source');
      const id = uri.searchParams.get('id');
      if (source && id) return `${source.toUpperCase()} ${id}`;

      return null;
    } catch {
      return null;
    }
  };

  const parsedName = getPeakName(url);
  const displayName = locationName || parsedName || 'Zobacz trasę';

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 group bg-surface-container-highest border border-outline-variant/30 hover:border-primary px-4 py-2 transition-all${className ? ` ${className}` : ''}`}
    >
      <div className="bg-primary/10 p-1.5 rounded-sm text-primary group-hover:bg-primary group-hover:text-surface transition-colors">
        <MapPin size={16} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">
          Punkt docelowy
        </span>
        <span className="text-sm font-display font-black uppercase tracking-tight text-on-surface flex items-center gap-2">
          {displayName}
          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </span>
      </div>
    </a>
  );
}
