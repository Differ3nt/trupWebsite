import React, { useState, useEffect } from 'react';
import { 
  Grid, Upload, Trash2, CheckCircle2, Loader2, 
  Image as ImageIcon, ExternalLink, Tag as TagIcon, 
  Search, X, Info, Maximize2, FileText, Edit3, Save,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../contexts/AppContext';

interface Tag {
  id: string;
  name: string;
}

interface Image {
  id: string;
  name?: string;
  originalUrl: string;
  thumbnailUrl: string;
  width?: number;
  height?: number;
  size?: number;
  tags: Tag[];
  createdAt: string;
}

export default function AdminGallery() {
  const { showToast, confirmAction } = useAppContext();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  
  // Edit states
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (selectedImage) {
      setEditName(selectedImage.name || '');
      setEditTags(selectedImage.tags.map(t => t.name).join(', '));
    }
  }, [selectedImage]);

  const fetchImages = async (query = '') => {
    setLoading(true);
    try {
      const endpoint = query ? `/api/images/search?query=${encodeURIComponent(query)}` : '/api/images/all';
      const res = await fetch(endpoint);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchImages(searchQuery);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData();
      formData.append('image', files[i]);
      formData.append('name', files[i].name);

      try {
        const res = await fetch('/api/images/upload-asset', {
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

  const handleSaveDetails = async () => {
    if (!selectedImage) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/images/${selectedImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      
      if (res.ok) {
        const updatedImage = await res.json();
        setImages(images.map(img => img.id === updatedImage.id ? updatedImage : img));
        setSelectedImage(updatedImage);
      }
    } catch (err) {
      console.error('Błąd zapisu:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    confirmAction({
      title: 'Usuń Plik',
      message: `CZY NA PEWNO CHCESZ USUNĄĆ PLIK "${name.toUpperCase()}"?`,
      onConfirm: () => {
        const deletedImage = images.find(img => img.id === id);
        setImages(prev => prev.filter(img => img.id !== id));
        if (selectedImage?.id === id) setSelectedImage(null);
        
        let undoClicked = false;
        showToast(`Usunięto grafikę: ${name}`, 'success', () => {
          undoClicked = true;
          setImages(prev => [...prev, deletedImage]);
        });

        setTimeout(async () => {
          if (!undoClicked) {
            await fetch(`/api/images/${id}`, { method: 'DELETE' });
          }
        }, 6000);
      }
    });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="p-8 md:p-12 min-h-screen bg-surface text-on-surface">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
        <div>
          <h1 className="font-display font-black text-6xl uppercase tracking-tighter mb-2 leading-none">
            Baza <span className="text-primary">Grafik</span>
          </h1>
          <p className="text-on-surface-variant font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
            <span className="w-8 h-[1px] bg-primary"></span>
            Zasoby wizualne TRUP.PL
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 max-w-2xl justify-end">
          {/* Search Bar Fixed */}
          <form onSubmit={handleSearch} className="flex-1 relative group">
            <input 
              type="text" 
              placeholder="SZUKAJ PO TAGACH LUB NAZWIE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-high border-b-2 border-outline-variant focus:border-primary outline-none px-6 py-4 w-full font-bold text-xs uppercase tracking-widest transition-all pr-12"
            />
            <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
              <Search size={18} />
            </button>
          </form>

          {/* Upload Button */}
          <label className="bg-primary text-surface px-8 py-4 font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 shadow-xl">
            {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
            {uploading ? 'WGRYWANIE...' : 'DODAJ NOWE'}
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Main Content - Square Aspect Ratio */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="text-primary">
            <Loader2 size={64} />
          </motion.div>
        </div>
      ) : images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6">
          <AnimatePresence>
            {images.map((img) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={img.id} 
                className="group relative aspect-square bg-surface-container-low overflow-hidden shadow-lg cursor-pointer"
                onClick={() => setSelectedImage(img)}
              >
                <img 
                  src={img.thumbnailUrl} 
                  alt={img.name} 
                  className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                />
                
                {/* Info Badge */}
                <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[7px] font-black text-white uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.width}x{img.height}
                </div>

                {/* Action Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                  <a 
                    href={img.originalUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-3 bg-white text-black hover:bg-primary hover:text-white transition-all shadow-2xl"
                    title="Powiększ"
                  >
                    <Maximize2 size={18} />
                  </a>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedImage(img); }}
                    className="p-3 bg-white text-black hover:bg-primary hover:text-white transition-all shadow-2xl"
                    title="Edytuj"
                  >
                    <Edit3 size={18} />
                  </button>
                </div>

                {/* Bottom Info Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-all">
                  <p className="text-white text-[9px] font-black uppercase tracking-widest truncate mb-1">
                    {img.name || 'Bez nazwy'}
                  </p>
                  <div className="flex gap-1">
                    {img.tags.slice(0, 2).map(t => (
                      <span key={t.id} className="text-primary text-[7px] font-bold uppercase">{t.name}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-surface-container-low border-2 border-dashed border-outline-variant/30 h-96 flex flex-col items-center justify-center text-on-surface-variant gap-6">
           <ImageIcon size={84} className="opacity-5" />
           <p className="font-display font-black text-2xl uppercase tracking-tighter">Brak grafik</p>
           {searchQuery && (
             <button onClick={() => { setSearchQuery(''); fetchImages(''); }} className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline">
               WYCZYŚĆ FILTRY
             </button>
           )}
        </div>
      )}


      {/* Detail & Edit Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-xl"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-surface max-w-6xl w-full max-h-full overflow-hidden flex flex-col md:flex-row shadow-2xl border border-outline-variant/20"
              onClick={e => e.stopPropagation()}
            >
              {/* Image Preview */}
              <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group">
                <img src={selectedImage.originalUrl} alt="" className="max-w-full max-h-[60vh] md:max-h-[85vh] object-contain shadow-2xl" />
                <div className="absolute bottom-6 left-6 flex gap-4">
                  <a href={selectedImage.originalUrl} target="_blank" className="bg-white/10 backdrop-blur-md text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary hover:text-white transition-all border border-white/20">
                    <Maximize2 size={14} /> PEŁNY ROZMIAR
                  </a>
                </div>
              </div>

              {/* Sidebar Edit */}
              <div className="w-full md:w-96 p-8 border-l border-outline-variant/10 flex flex-col gap-8 overflow-y-auto bg-surface-container-low">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-black text-3xl uppercase tracking-tighter">Edycja</h3>
                  <button onClick={() => setSelectedImage(null)} className="text-on-surface-variant hover:text-primary transition-colors p-2">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Edit3 size={12} /> Nazwa zdjęcia
                    </label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="WPISZ NAZWĘ..."
                      className="w-full bg-surface border-b-2 border-outline-variant focus:border-primary outline-none py-3 font-bold text-xs uppercase tracking-widest transition-all"
                    />
                  </div>

                  {/* Tags Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <TagIcon size={12} /> Tagi (po przecinku)
                    </label>
                    <textarea 
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="TAG1, TAG2, TAG3..."
                      rows={3}
                      className="w-full bg-surface border-2 border-outline-variant focus:border-primary outline-none p-4 font-bold text-xs uppercase tracking-widest transition-all resize-none"
                    />
                  </div>

                  {/* Save Button */}
                  <button 
                    onClick={handleSaveDetails}
                    disabled={isSaving}
                    className="w-full bg-primary text-surface py-4 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all shadow-xl"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSaving ? 'ZAPISYWANIE...' : 'ZAPISZ ZMIANY'}
                  </button>

                  {/* Stats */}
                  <div className="pt-8 border-t border-outline-variant/10 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Rozdzielczość</p>
                      <p className="font-bold text-xs">{selectedImage.width} x {selectedImage.height} PX</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Rozmiar pliku</p>
                      <p className="font-bold text-xs">{formatSize(selectedImage.size)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8">
                  <button 
                    onClick={() => handleDelete(selectedImage.id, selectedImage.name || 'Bez nazwy')}
                    className="w-full bg-red-500/10 text-red-500 border border-red-500/20 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> USUŃ Z BAZY
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
