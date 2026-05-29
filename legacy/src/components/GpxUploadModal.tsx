import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Map as MapIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface GpxUploadModalProps {
  event: any;
  onUpload: (formData: FormData) => void;
  onClose: () => void;
}

export function GpxUploadModal({ event, onUpload, onClose }: GpxUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('gpx', file);
    formData.append('eventId', event.id);
    formData.append('label', label);
    
    // Oblicz całkowitą liczbę minut
    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0);
    if (totalMinutes > 0) {
      formData.append('duration', totalMinutes.toString());
    }
    
    formData.append('participantIds', JSON.stringify(selectedParticipants));
    onUpload(formData);
  };

  const participants = (event.participants || []).filter((p: any) => p.status === 'GOING' || p.status === 'INTERESTED');

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto" onClick={onClose}>
      <div className="bg-surface border-4 border-primary p-8 max-w-lg w-full shadow-[20px_20px_0px_0px_rgba(var(--color-primary-rgb),0.2)] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-8">
          <h3 className="font-display font-black text-3xl uppercase tracking-tighter text-on-surface">Wgraj Trasę GPX</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors"><X size={24} /></button>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-6">Wydarzenie: {event.title}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Plik GPX</label>
            <input 
              type="file" 
              accept=".gpx" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full bg-surface-container border border-outline-variant/30 p-4 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Nazwa Trasy (opcjonalnie)</label>
            <input 
              type="text" 
              value={label} 
              onChange={e => setLabel(e.target.value)}
              placeholder="np. Wariant przez Grań"
              className="w-full bg-surface-container border border-outline-variant/30 p-4 text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Czas trwania (ręcznie, jeśli brak w GPX)</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input 
                  type="number" 
                  value={hours} 
                  onChange={e => setHours(e.target.value)}
                  placeholder="Godziny"
                  className="w-full bg-surface-container border border-outline-variant/30 p-4 text-sm"
                  min="0"
                />
              </div>
              <div className="flex-1">
                <input 
                  type="number" 
                  value={minutes} 
                  onChange={e => setMinutes(e.target.value)}
                  placeholder="Minuty"
                  className="w-full bg-surface-container border border-outline-variant/30 p-4 text-sm"
                  min="0"
                  max="59"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">Kto z Tobą szedł? (Sugerowany przydział)</label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto pr-2">
              {participants.map((p: any) => (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => setSelectedParticipants(prev => prev.includes(p.userId) ? prev.filter(id => id !== p.userId) : [...prev, p.userId])}
                  className={cn(
                    "p-3 text-[10px] font-bold uppercase ring-1 ring-inset text-left transition-all",
                    selectedParticipants.includes(p.userId) ? "ring-primary bg-primary/10 text-primary" : "ring-outline-variant/20 opacity-60"
                  )}
                >
                  {p.user?.name}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" isLoading={loading} className="w-full py-6 text-lg">WGRAJ I WYŚLIJ DO ADMINA</Button>
        </form>
      </div>
    </div>,
    document.body
  );
}
