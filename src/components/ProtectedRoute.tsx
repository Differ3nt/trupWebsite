import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole = 'user' }: ProtectedRouteProps) {
  const { role, user, loading } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Weryfikacja uprawnień...</p>
        </div>
      </div>
    );
  }

  const roleHierarchy = { guest: 0, user: 1, admin: 2 };
  const hasAccess = roleHierarchy[role] >= roleHierarchy[requiredRole];

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  // Logged in but not yet approved by admin — send to pending screen
  if (role !== 'guest' && role !== 'admin' && user?.status !== 'ACTIVE') {
    return <Navigate to="/pending" replace />;
  }

  return <>{children}</>;
}
