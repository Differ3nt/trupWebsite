import React, { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';

// Możliwe role użytkownika w aplikacji frontendowej
type UserRole = 'guest' | 'user' | 'admin';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  hasHardware: (item: string) => boolean;
  user: any;
  loading: boolean;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info', onUndo?: () => void) => void;
  confirmAction: (options: { 
    title: string, 
    message: string, 
    variant?: 'danger' | 'primary' | 'warning', 
    onConfirm: () => void,
    onDiscard?: () => void,
    confirmText?: string,
    cancelText?: string,
    discardText?: string
  }) => void;
  modal: { 
    title: string, 
    message: string, 
    variant?: 'danger' | 'primary' | 'warning', 
    onConfirm: () => void,
    onDiscard?: () => void,
    confirmText?: string,
    cancelText?: string,
    discardText?: string
  } | null;
  setModal: (modal: any) => void;
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Provider dostarczający stan globalny (użytkownik, rola, ładowanie) do wszystkich komponentów.
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('guest');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ 
    title: string, 
    message: string, 
    variant?: 'danger' | 'primary' | 'warning', 
    onConfirm: () => void,
    onDiscard?: () => void,
    confirmText?: string,
    cancelText?: string,
    discardText?: string
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', onUndo?: () => void) => {
    if (type === 'success') {
      toast.success(message, {
        action: onUndo ? { label: 'UNDO', onClick: onUndo } : undefined
      });
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast(message);
    }
  };

  const confirmAction = (options: {
    title: string,
    message: string,
    variant?: 'danger' | 'primary' | 'warning',
    onConfirm: () => void,
    onDiscard?: () => void,
    confirmText?: string,
    cancelText?: string,
    discardText?: string
  }) => {
    setModal(options);
    setIsModalOpen(true);
  };

  /**
   * Sprawdza aktualną sesję użytkownika odpytując serwer (/api/auth/me).
   */
  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setRole(data.user.role.toLowerCase() as UserRole);
      } else {
        setUser(null);
        setRole('guest');
      }
    } catch (e) {
      console.error('Błąd weryfikacji sesji użytkownika', e);
    } finally {
      setLoading(false);
    }
  };

  // Inicjalne sprawdzenie sesji przy pierwszym załadowaniu strony
  React.useEffect(() => {
    refreshUser();
  }, []);

  /**
   * Przekierowuje użytkownika do logowania przez Google.
   */
  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  /**
   * Wylogowuje użytkownika usuwając ciasteczko sesji na serwerze i resetując stan lokalny.
   */
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setRole('guest');
  };

  /**
   * Helper sprawdzający czy zalogowany użytkownik posiada dany sprzęt techniczny.
   */
  const hasHardware = (item: string) => {
    if (!user || !user.hardware) return false;
    const userHardware = Array.isArray(user.hardware) ? user.hardware : JSON.parse(user.hardware || '[]');
    return userHardware.includes(item);
  };

  return (
    <AppContext.Provider value={{ 
      role, setRole, hasHardware, user, loginWithGoogle, logout, loading, refreshUser, 
      showToast, confirmAction, modal, setModal, isModalOpen, setIsModalOpen
    }}>
      {children}
      
      {/* Global components moved to Layout.tsx but their state is here */}
    </AppContext.Provider>
  );
}

/**
 * Hook ułatwiający dostęp do kontekstu aplikacji w komponentach funkcyjnych.
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
