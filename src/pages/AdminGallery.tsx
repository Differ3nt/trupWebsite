import React, { useState, useEffect } from 'react';
import { Grid, Upload, Trash2, CheckCircle2, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react';

export default function AdminGallery() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/images/all');
      const data = await res.json();
      if (Array.isArray(data)) {
        setImages(data);
      }
    } catch (err) {
      console.error('Błąd pobierania galerii:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let tooLargeCount = 0;
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 5 * 1024 * 1024) {
        tooLargeCount++;
      } else {
        validFiles.push(files[i]);
      }
    }

    if (tooLargeCount > 0) {
      alert(`Pominięto ${tooLargeCount} plików, ponieważ przekraczały limit 5MB.`);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    for (const file of validFiles) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch('/api/images/upload-simple', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error('Błąd serwera');
      } catch (err) {
        console.error('Błąd uploadu:', err);
      }
    }
    setUploading(false);
    fetchImages();
  };

  return (
    <div className="p-8 md:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="font-display font-black text-5xl uppercase tracking-tighter mb-4">Biblioteka Mediów</h1>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-xs">Zarządzaj wszystkimi wgranymi zdjęciami</p>
        </div>
        
        <label className="bg-primary text-surface px-8 py-4 font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-white transition-all flex items-center gap-3 shadow-xl">
          {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
          {uploading ? 'WGRYWANIE...' : 'DODAJ NOWE ZDJĘCIA'}
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {images.map((img, idx) => (
            <div key={idx} className="group relative aspect-square bg-surface-container-low border border-outline-variant/20 overflow-hidden shadow-lg">
              <img 
                src={img.thumbnailUrl || img.originalUrl} 
                alt="" 
                className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4">
                 <a 
                   href={img.originalUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="p-3 bg-white text-black hover:bg-primary hover:text-white transition-colors"
                   title="Zobacz oryginał"
                 >
                   <ExternalLink size={18} />
                 </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 h-96 flex flex-col items-center justify-center text-on-surface-variant gap-4">
           <ImageIcon size={64} className="opacity-10" />
           <p className="font-bold uppercase tracking-widest text-xs">Brak plików w bibliotece</p>
        </div>
      )}
    </div>
  );
}
