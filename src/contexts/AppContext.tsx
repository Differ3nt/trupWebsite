import React, { createContext, useContext, useState } from 'react';

type UserRole = 'guest' | 'user' | 'admin';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  hasHardware: (item: string) => boolean;
  user: any;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('guest');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      console.error('Błąd weryfikacji sesji', e);
    } finally {
      setLoading(false);
    }
  };

  // Sprawdzamy stan zalogowania przy załadowaniu
  React.useEffect(() => {
    refreshUser();
  }, []);

  const loginWithGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setRole('guest');
  };

  const hasHardware = (item: string) => {
    if (!user || !user.hardware) return false;
    const userHardware = Array.isArray(user.hardware) ? user.hardware : JSON.parse(user.hardware || '[]');
    return userHardware.includes(item);
  };

  return (
    <AppContext.Provider value={{ role, setRole, hasHardware, user, loginWithGoogle, logout, loading, refreshUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
