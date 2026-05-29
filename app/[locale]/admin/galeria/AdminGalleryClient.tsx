'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
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
  const t = useTranslations('admin.galleryAdmin');
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
        toast.success(t('uploadSuccess'));
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast.error(t('uploadError'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('uploadError'));
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
        toast.success(t('saveSuccess'));
      } else {
        toast.error(t('saveError'));
      }
    } catch (e) {
      console.error(e);
      toast.error(t('saveError'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete(id: string) {
    openConfirm({
      title: t('deleteConfirmTitle'),
      message: t('deleteConfirmMessage'),
      variant: 'danger',
      onConfirm: () => {
        // Optimistically remove
        const deletedImage = images.find(img => img.id === id);
        setImages(prev => prev.filter(img => img.id !== id));
        if (selectedImage?.id === id) setSelectedImage(null);

        let cancelled = false;
        const undoTimeout = setTimeout(async () => {
          if (cancelled) return;
          try {
            await fetch(`/api/images/${id}`, { method: 'DELETE' });
          } catch (e) {
            console.error(e);
            // restore on failure
            if (deletedImage) setImages(prev => [...prev, deletedImage].sort((a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
            toast.error(t('deleteError'));
          }
        }, 6000);

        toast.success(t('deleteSuccess'), {
          duration: 6000,
          action: {
            label: t('undoButton'),
            onClick: () => {
              cancelled = true;
              clearTimeout(undoTimeout);
              if (deletedImage) setImages(prev => [...prev, deletedImage].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              ));
            }
          }
        });
      }
    });
  }

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left: Upload & Grid */}
      <div className="md:col-span-2">
        <div className="mb-8">
          <h2 className="font-display font-black text-2xl uppercase mb-4">{t('uploadHeading')}</h2>
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
                <span>{t('selectImageButton')}</span>
              </Button>
            </label>
            <p className="text-[10px] text-on-surface-variant/60 mt-4">
              {t('fileTypeHint')}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="font-display font-black text-2xl uppercase mb-4">{t('galleryHeading')} ({filteredImages.length})</h2>
          <FormField label={t('searchLabel')}>
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={t('searchPlaceholder')}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {filteredImages.map((img) => (
            <div key={img.id}>
              <button
                onClick={() => {
                  setSelectedImage(img);
                  setEditName(img.name);
                  setEditTags(img.tags.map((t) => t.name).join(', '));
                }}
                className={`relative group aspect-square overflow-hidden rounded-md border-2 transition-all w-full ${
                  selectedImage?.id === img.id
                    ? 'border-primary'
                    : 'border-outline-variant/20 hover:border-primary'
                }`}
              >
                <img
                  src={img.thumbnailUrl}
                  alt={img.name}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/60 text-[8px] text-white/80 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {img.width}×{img.height}
                </div>
              </button>
              <div className="mt-1 px-0.5">
                <p className="text-[9px] text-on-surface-variant truncate">{img.name}</p>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {img.tags.slice(0, 2).map(tag => (
                    <span key={tag.id} className="text-[8px] bg-primary/10 text-primary px-1">{tag.name}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredImages.length === 0 && (
          <p className="text-center py-12 text-on-surface-variant">{t('emptyState')}</p>
        )}
      </div>

      {/* Right: Detail Panel */}
      <div>
        {selectedImage ? (
          <div className="sticky top-28 bg-surface-container-low border border-outline-variant/20 rounded-lg p-6 space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                {t('previewLabel')}
              </p>
              <img
                src={selectedImage.originalUrl}
                alt={selectedImage.name}
                className="w-full rounded-md border border-outline-variant/20"
              />
              <a
                href={selectedImage.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline font-bold uppercase tracking-widest mt-2 block"
              >
                {t('fullSizeLink')}
              </a>
            </div>

            <div className="text-[10px] space-y-1">
              <p className="font-bold uppercase tracking-widest text-on-surface-variant">{t('infoLabel')}</p>
              <p>{t('urlLabel')} <code className="text-[8px] break-all text-on-surface-variant/70">{selectedImage.originalUrl}</code></p>
              <p>{t('dimensionsLabel')} {selectedImage.width} x {selectedImage.height}px</p>
              <p>{t('sizeLabel')} {selectedImage.size < 1024 * 1024
                ? `${(selectedImage.size / 1024).toFixed(1)}KB`
                : `${(selectedImage.size / (1024 * 1024)).toFixed(2)}MB`}</p>
              <p>{t('dateLabel')} {new Date(selectedImage.createdAt).toLocaleDateString('pl-PL')}</p>
            </div>

            <div className="space-y-4">
              <FormField label={t('nameLabel')}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                />
              </FormField>

              <FormField label={t('tagsLabel')}>
                <Input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder={t('tagsPlaceholder')}
                />
              </FormField>

              {selectedImage.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                    {t('tagsHeading')}
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
                {t('saveButton')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(selectedImage.id)}
                title={t('deleteButtonTitle')}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="sticky top-28 bg-surface-container-low border border-outline-variant/20 rounded-lg p-6 text-center py-12">
            <p className="text-on-surface-variant">{t('selectImagePrompt')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
