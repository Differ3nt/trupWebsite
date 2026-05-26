import { Clock, LogOut } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { Button } from '../components/ui/Button';

export default function PendingApproval() {
  const { user, logout } = useAppContext();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-surface">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-surface-container-low border-2 border-outline-variant/30 flex items-center justify-center">
            <Clock size={40} className="text-primary" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="font-display font-black text-3xl uppercase tracking-tighter text-on-surface">
            Konto oczekuje na zatwierdzenie
          </h1>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            Zalogowałeś się jako <span className="font-bold text-on-surface">{user?.email}</span>.
            Twoje konto zostało zarejestrowane, ale czeka na zatwierdzenie przez administratora TRUP.
          </p>
          <p className="text-on-surface-variant/60 text-xs uppercase tracking-wider font-bold">
            Skontaktuj się z organizatorami, aby uzyskać dostęp.
          </p>
        </div>

        <div className="pt-4 border-t border-outline-variant/30">
          <Button
            variant="secondary"
            onClick={logout}
            leftIcon={<LogOut size={14} />}
          >
            Wyloguj się
          </Button>
        </div>
      </div>
    </div>
  );
}
