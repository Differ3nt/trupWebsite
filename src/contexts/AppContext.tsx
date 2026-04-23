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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('guest');
  const [user, setUser] = useState<any>(null);
  const [hardware] = useState<string[]>(['Kask', 'Czekan']); // Missing e.g., 'Raki'
  const [loading, setLoading] = useState(true);

  // Sprawdzamy stan zalogowania przy załadowaniu
  React.useEffect(() => {
    fetch('http://localhost:3001/api/auth/me', {credentials: 'include'})
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setRole(data.user.role.toLowerCase());
        }
      })
      .catch(() => console.error('Błąd weryfikacji sesji'))
      .finally(() => setLoading(false));
  }, []);

  const loginWithGoogle = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/auth/google/url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Przekierowanie do Google
      }
    } catch (e) {
      console.error('Błąd inicjacji logowania', e);
    }
  };

  const logout = async () => {
    await fetch('http://localhost:3001/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    setRole('guest');
  };

  const hasHardware = (item: string) => hardware.includes(item);

  return (
    <AppContext.Provider value={{ role, setRole, hasHardware, user, loginWithGoogle, logout, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
