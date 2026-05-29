import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Grid, Loader2, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useAppContext } from '../contexts/AppContext';

interface ImagePickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function ImagePicker({ onSelect, onClose }: ImagePickerProps) {
  const { setIsModalOpen } = useAppContext();
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery'>('gallery');
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (activeTab === 'gallery') {
      loadGallery();
    }
  }, [activeTab]);

  useEffect(() => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
    return () => {
      setIsModalOpen(false);
      document.body.style.overflow = 'unset';
    };
  }, [setIsModalOpen]);

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

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('Plik jest zbyt duży. Maksymalny rozmiar to 20MB.');
      return;
    }

    setOriginalFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!originalFile) return;
    setPreviewSrc(null);
    setUploading(true);
    const formData = new FormData();
    formData.append('image', originalFile, originalFile.name);

    try {
      const res = await fetch('/api/images/upload-asset', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        onSelect(data.image.originalUrl);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      setOriginalFile(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 md:p-8 pointer-events-auto">
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
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 font-bold text-[10px] uppercase tracking-widest transition-all",
              activeTab === 'gallery' ? 'bg-primary text-surface' : 'text-on-surface-variant hover:bg-surface-container'
            )}
          >
            <Grid size={14} /> Galeria Serwera
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 font-bold text-[10px] uppercase tracking-widest transition-all",
              activeTab === 'upload' ? 'bg-primary text-surface' : 'text-on-surface-variant hover:bg-surface-container'
            )}
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
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Anuluj
          </Button>
        </div>
      </div>

      {previewSrc && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-black border border-white/10 w-full max-w-lg flex flex-col gap-0 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <span className="text-white font-black text-sm uppercase tracking-widest">Podgląd zdjęcia</span>
              <button onClick={() => { setPreviewSrc(null); setOriginalFile(null); }} className="text-white/40 hover:text-white transition-colors p-1">
                <X size={18} />
              </button>
            </div>
            <img src={previewSrc} alt="podgląd" className="w-full aspect-video object-cover" />
            <div className="flex">
              <button
                onClick={() => { setPreviewSrc(null); setOriginalFile(null); }}
                className="flex-1 py-4 text-white/50 hover:text-white font-bold text-[10px] uppercase tracking-widest border-r border-white/10 transition-colors"
              >
                Wybierz inne
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-4 bg-primary text-surface font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Użyj tego zdjęcia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
