import { create } from 'zustand';

interface ConfirmModalState {
  title: string;
  message: string;
  variant?: 'danger' | 'primary' | 'warning';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

interface UIStore {
  confirmModal: ConfirmModalState | null;
  openConfirm: (opts: ConfirmModalState) => void;
  closeConfirm: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  confirmModal: null,
  openConfirm: (opts) => set({ confirmModal: opts }),
  closeConfirm: () => set({ confirmModal: null }),
}));
