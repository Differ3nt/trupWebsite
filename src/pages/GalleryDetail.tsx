import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { EXPEDITIONS } from './Gallery';

export default function GalleryDetail() {
  const { id } = useParams<{ id: string }>();
  const expedition = EXPEDITIONS.find(e => e.id === id);

  if (!expedition) {
    return (
      <div className="pt-40 pb-24 px-6 md:px-12 max-w-7xl mx-auto text-center min-h-screen">
        <h1 className="font-display font-black text-4xl uppercase mb-4">Nie znaleziono wyprawy</h1>
        <Link to="/galeria" className="text-primary hover:underline font-bold tracking-widest uppercase text-sm">
          Wróć do galerii
        </Link>
      </div>
    );
  }

  // Generate a larger array of images for the detail view by repeating the existing ones
  // In a real app, this would be fetched from an API
  const allImages = [
    ...expedition.images,
    ...expedition.images.map(img => img.replace('w=800', 'w=801')), // Slight URL change to force different image if using random, or just duplicate
    ...expedition.images.map(img => img.replace('w=800', 'w=802')),
    ...expedition.images.map(img => img.replace('w=800', 'w=803'))
  ].slice(0, expedition.images.length + expedition.extraPhotos);

  return (
    <div className="pt-32 pb-24 bg-[#fafafa] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        
        {/* Back Button */}
        <Link to="/galeria" className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-12 font-bold text-xs tracking-widest uppercase">
          <ArrowLeft size={16} />
          Wróć do archiwum
        </Link>

        {/* Header */}
        <div className="border-l-4 border-primary pl-6 md:pl-8 mb-16">
          <div className="text-primary font-bold text-sm tracking-widest uppercase mb-2">{expedition.mission}</div>
          <h1 className="font-display font-black text-5xl md:text-7xl leading-[0.9] text-on-surface uppercase tracking-tighter mb-6">
            {expedition.title}
          </h1>
          <div className="flex flex-col gap-1 text-on-surface-variant text-xs tracking-widest uppercase font-bold">
            <div>LOKALIZACJA: {expedition.location}</div>
            <div>DATA: {expedition.date}</div>
            <div>ZDJĘCIA: {allImages.length}</div>
          </div>
        </div>

        {/* Full Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {allImages.map((img, idx) => (
            <div key={idx} className="aspect-square overflow-hidden bg-surface-variant">
              <img 
                src={img} 
                alt={`${expedition.title} - photo ${idx + 1}`} 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
