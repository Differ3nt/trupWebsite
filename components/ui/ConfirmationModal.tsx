'use client';
import { useUIStore } from '@/lib/store/ui';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { ShieldAlert } from '@/components/icons';
import { cn } from '@/lib/utils';

export function ConfirmationModal() {
  const { confirmModal, closeConfirm } = useUIStore();
  if (!confirmModal) return null;
  const { title, message, variant = 'danger', confirmText = 'POTWIERDŹ', cancelText = 'ANULUJ', onConfirm } = confirmModal;

  return (
    <Modal isOpen={true} onClose={closeConfirm} title={title ?? 'Potwierdzenie'}>
      <div className="flex flex-col gap-6">
        <div className={cn('flex items-center gap-4 p-4 border', variant === 'danger' ? 'bg-error/10 border-error/20' : 'bg-primary/10 border-primary/20')}>
          <ShieldAlert className={variant === 'danger' ? 'text-error shrink-0' : 'text-primary shrink-0'} size={28} />
          <p className={cn('text-[10px] font-black uppercase tracking-widest leading-relaxed', variant === 'danger' ? 'text-error' : 'text-primary')}>
            {variant === 'danger' ? 'Ta akcja jest nieodwracalna.' : 'Prosimy o potwierdzenie tej operacji.'}
          </p>
        </div>
        <p className="text-on-surface-variant text-xs leading-relaxed uppercase tracking-widest font-bold">{message}</p>
        <ModalFooter className="grid grid-cols-2">
          <Button variant="primary" onClick={() => { onConfirm(); closeConfirm(); }} className="h-12 text-xs">{confirmText}</Button>
          <Button variant="secondary" onClick={closeConfirm} className="h-12 text-xs">{cancelText}</Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
