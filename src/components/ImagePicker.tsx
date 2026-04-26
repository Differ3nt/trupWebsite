import React, { useState, useEffect } from 'react';
import { X, Upload, Grid, Loader2, Check } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface ImagePickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function ImagePicker({ onSelect, onClose }: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('gallery');
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (activeTab === 'gallery') {
      loadGallery();
    }
  }, [activeTab]);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/images/all');
      const data = await res.json();
      if (Array.isArray(data)) {
        setImages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Sprawdzenie rozmiaru pliku (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Plik jest zbyt duży. Maksymalny rozmiar to 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropSrc(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    setCropSrc(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('image', blob, 'event-bg.jpg');

    try {
      const res = await fetch('/api/images/upload-simple', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        onSelect(data.url);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8">
      <div className="bg-surface border border-outline-variant/30 w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20 bg-surface-container-low">
          <h3 className="font-display font-black text-2xl uppercase tracking-tight text-on-surface">Wybierz Zdjęcie Tła</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-2">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/10 bg-surface-container-lowest">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'gallery' ? 'bg-primary text-surface' : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <Grid size={14} /> Galeria Serwera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold text-[10px] uppercase tracking-widest transition-all ${
              activeTab === 'upload' ? 'bg-primary text-surface' : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <Upload size={14} /> Wgraj Nowe
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-primary/20">
          {activeTab === 'gallery' ? (
            loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelect(img.originalUrl);
                      onClose();
                    }}
                    className="group relative aspect-square overflow-hidden border border-outline-variant/20 hover:border-primary transition-all"
                  >
                    <img
                      src={img.thumbnailUrl}
                      alt=""
                      className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-all flex items-center justify-center">
                      <div className="bg-primary text-surface p-2 rounded-full opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all">
                        <Check size={16} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-4">
                <Grid size={48} className="opacity-20" />
                <p className="font-bold uppercase tracking-widest text-xs">Brak zdjęć w galerii</p>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <label className="w-full max-w-md aspect-video border-2 border-dashed border-outline-variant/30 hover:border-primary transition-all flex flex-col items-center justify-center gap-4 cursor-pointer bg-surface-container-low group">
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin text-primary" size={48} />
                    <p className="font-bold uppercase tracking-widest text-xs text-primary">Przetwarzanie...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Upload className="text-primary" size={32} />
                    </div>
                    <div className="text-center">
                      <p className="font-display font-black uppercase tracking-tight text-lg mb-1">Kliknij aby wgrać</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">PNG, JPG, WEBP DO 5MB</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/10 bg-surface-container-lowest text-right">
          <button
            onClick={onClose}
            className="px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Anuluj
          </button>
        </div>
      </div>

      {cropSrc && (
        <ImageCropper 
          image={cropSrc} 
          aspect={16/9} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setCropSrc(null)} 
        />
      )}
    </div>
  );
}
