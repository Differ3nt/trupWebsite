'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Upload } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FormField } from '@/components/ui/FormField';
import { Skeleton } from '@/components/ui/Skeleton';
import { useUIStore } from '@/lib/store/ui';

interface Image {
  id: string;
  originalUrl: string;
  thumbnailUrl: string;
  name: string;
  width: number;
  height: number;
  size: number;
  createdAt: string;
  tags: Tag[];
}

interface Tag {
  id: string;
  name: string;
}

export function AdminGalleryClient() {
  const { openConfirm } = useUIStore();
  const [images, setImages] = useState<Image[]>([]);
  const [filteredImages, setFilteredImages] = useState<Image[]>([]);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (searchFilter.trim() === '') {
      setFilteredImages(images);
    } else {
      const term = searchFilter.toLowerCase();
      setFilteredImages(
        images.filter(
          (img) =>
            img.name.toLowerCase().includes(term) ||
            img.tags.some((tag) => tag.name.toLowerCase().includes(term))
        )
      );
    }
  }, [searchFilter, images]);

  async function fetchImages() {
    try {
      const r = await fetch('/api/images');
      const data = await r.json();
      if (Array.isArray(data)) {
        setImages(data);
        setFilteredImages(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const r = await fetch('/api/images', { method: 'POST', body: fd });
      if (r.ok) {
        fetchImages();
        alert('Wysłano!');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        alert('Błąd wysyłania.');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd wysyłania.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!selectedImage) return;
    setIsSaving(true);
    try {
      const tagsArray = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const r = await fetch(`/api/images/${selectedImage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, tags: tagsArray }),
      });
      if (r.ok) {
        fetchImages();
        alert('Zapisano!');
      } else {
        alert('Błąd zapisu.');
      }
    } catch (e) {
      console.error(e);
      alert('Błąd zapisu.');
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete(id: string) {
    openConfirm({
      title: 'Usuń Obraz',
      message: 'Czy na pewno chcesz usunąć ten obraz?',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const r = await fetch(`/api/images/${id}`, { method: 'DELETE' });
          if (r.ok) {
            setSelectedImage(null);
            fetchImages();
            alert('Usunięto!');
          } else {
            alert('Błąd usuwania.');
          }
        } catch (e) {
          console.error(e);
          alert('Błąd usuwania.');
        }
      }
    });
  }

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left: Upload & Grid */}
      <div className="md:col-span-2">
        <div className="mb-8">
          <h2 className="font-display font-black text-2xl uppercase mb-4">Prześlij Obraz</h2>
          <div className="border-2 border-dashed border-outline-variant/30 rounded-lg p-8 text-center">
            <Upload className="mx-auto mb-4 text-on-surface-variant/50" size={32} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleUpload(e.target.files[0]);
                }
              }}
              className="hidden"
              id="imageUpload"
            />
            <label htmlFor="imageUpload" className="cursor-pointer block">
              <Button variant="primary" isLoading={uploading} asChild>
                <span>Wybierz Obraz</span>
              </Button>
            </label>
            <p className="text-[10px] text-on-surface-variant/60 mt-4">
              PNG, JPG, WebP. Max 5MB.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-display font-black text-2xl uppercase mb-4">Galeria ({filteredImages.length})</h2>
          <FormField label="Szukaj">
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Wyszukaj po nazwie lub tagu..."
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredImages.map((img) => (
            <button
              key={img.id}
              onClick={() => {
                setSelectedImage(img);
                setEditName(img.name);
                setEditTags(img.tags.map((t) => t.name).join(', '));
              }}
              className={`relative group aspect-square overflow-hidden rounded-md border-2 transition-all ${
                selectedImage?.id === img.id
                  ? 'border-primary'
                  : 'border-outline-variant/20 hover:border-primary'
              }`}
            >
              <img
                src={img.thumbnailUrl}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <p className="text-center py-12 text-on-surface-variant">Brak obrazów.</p>
        )}
      </div>

      {/* Right: Detail Panel */}
      <div>
        {selectedImage ? (
          <div className="sticky top-28 bg-surface-container-low border border-outline-variant/20 rounded-lg p-6 space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                Podgląd
              </p>
              <img
                src={selectedImage.originalUrl}
                alt={selectedImage.name}
                className="w-full rounded-md border border-outline-variant/20"
              />
            </div>

            <div className="text-[10px] space-y-1">
              <p className="font-bold uppercase tracking-widest text-on-surface-variant">Info</p>
              <p>URL: <code className="text-[8px] break-all text-on-surface-variant/70">{selectedImage.originalUrl}</code></p>
              <p>Wymiary: {selectedImage.width} x {selectedImage.height}px</p>
              <p>Rozmiar: {(selectedImage.size / 1024).toFixed(2)}KB</p>
              <p>Data: {new Date(selectedImage.createdAt).toLocaleDateString('pl-PL')}</p>
            </div>

            <div className="space-y-4">
              <FormField label="Nazwa">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nazwa obrazu"
                />
              </FormField>

              <FormField label="Tagi (rozdzielone przecinkami)">
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              </FormField>

              {selectedImage.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    Tagi
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedImage.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-outline-variant/20">
              <Button
                variant="primary"
                fullWidth
                isLoading={isSaving}
                onClick={handleSave}
              >
                Zapisz
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(selectedImage.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="sticky top-28 bg-surface-container-low border border-outline-variant/20 rounded-lg p-6 text-center py-12">
            <p className="text-on-surface-variant">Wybierz obraz, aby edytować</p>
          </div>
        )}
      </div>
    </div>
  );
}
