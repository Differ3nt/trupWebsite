import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';

interface ConfirmationModalProps {
  title: string;
  message: string;
  variant?: 'danger' | 'primary' | 'warning' | 'success';
  onConfirm: () => void;
  onClose: () => void;
  onDiscard?: () => void;
  confirmText?: string;
  cancelText?: string;
  discardText?: string;
}

export default function ConfirmationModal({ 
  title, message, variant = 'danger', onConfirm, onClose, onDiscard,
  confirmText = "POTWIERDŹ",
  cancelText = "ANULUJ",
  discardText = "ODRZUĆ"
}: ConfirmationModalProps) {
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';
  const isPrimary = variant === 'primary';
  const isSuccess = variant === 'success';

  // Obsługa klawisza Enter
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        onConfirm();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onClose]);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={title}
      className="max-w-md"
    >
      <div className="flex flex-col gap-6">
        <div className={cn(
          "flex items-center gap-4 p-4 border",
          isDanger ? "bg-error/10 border-error/20" : 
          isWarning ? "bg-warning/10 border-warning/20" : 
          isSuccess ? "bg-primary/10 border-primary/20" :
          "bg-primary/10 border-primary/20"
        )}>
          <ShieldAlert 
            className={cn(
              "shrink-0",
              isDanger ? "text-error" : isWarning ? "text-warning" : "text-primary"
            )} 
            size={32} 
          />
          <p className={cn(
            "text-[10px] font-black uppercase tracking-widest leading-relaxed",
            isDanger ? "text-error" : isWarning ? "text-warning-700" : isSuccess ? "text-primary" : "text-primary-700"
          )}>
            {onDiscard ? "Masz niezapisane dane w formularzu." : (
              isDanger ? "Ta akcja jest nieodwracalna. Prosimy o rozważną decyzję." : 
              "Prosimy o potwierdzenie tej operacji przed jej wykonaniem."
            )}
          </p>
        </div>
        
        <p className="text-on-surface-variant text-xs leading-relaxed uppercase tracking-widest font-bold">
          {message}
        </p>
        
        <div className={cn(
          "grid gap-3 mt-4",
          onDiscard ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"
        )}>
          {/* Pozytywny - Zapisz */}
          <Button 
            variant="primary"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full h-12 text-[10px] sm:text-xs"
          >
            {confirmText}
          </Button>
          
          {/* Negatywny - Porzuć */}
          {onDiscard && (
            <Button 
              variant="danger"
              onClick={() => {
                onDiscard();
                onClose();
              }}
              className="w-full h-12 text-[10px] sm:text-xs"
            >
              {discardText}
            </Button>
          )}

          {/* Neutralny - Anuluj/Powrót */}
          <Button 
            variant="secondary"
            onClick={onClose}
            className="w-full h-12 text-[10px] sm:text-xs"
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
