import React, { createContext, useContext, useState } from 'react';

type UserRole = 'guest' | 'user' | 'admin';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  hasHardware: (item: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('user'); // Default to user to show features
  const [hardware] = useState<string[]>(['Kask', 'Czekan']); // Missing e.g., 'Raki'

  const hasHardware = (item: string) => hardware.includes(item);

  return (
    <AppContext.Provider value={{ role, setRole, hasHardware }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
