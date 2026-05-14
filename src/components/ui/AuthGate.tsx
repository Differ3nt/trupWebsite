import React from "react";
import { useAppContext } from "../../contexts/AppContext";
import { Button } from "./Button";
import { Lock } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";

export interface AuthGateProps {
  children: React.ReactNode;
  message?: string;
  className?: string;
}

const AuthGate = ({
  children,
  message = "Zaloguj się, aby zobaczyć pełne informacje",
  className,
}: AuthGateProps) => {
  const { role, loginWithGoogle } = useAppContext();

  if (role !== "guest") {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative overflow-hidden min-h-[400px] flex flex-col", className)}>
      {/* Blurred Content */}
      <div className="flex-1 filter blur-[8px] grayscale pointer-events-none select-none opacity-40 transition-all duration-700">
        {children}
      </div>

      {/* Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10 p-6 text-center"
      >
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-surface-container-low border border-outline-variant/30 p-8 max-w-md w-full shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 flex items-center justify-center">
              <Lock size={32} className="text-primary" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Dostęp Ograniczony</p>
          <h3 className="font-display font-black text-2xl uppercase tracking-tighter mb-4 text-on-surface">
            Tylko dla członków
          </h3>
          <p className="text-xs text-on-surface-variant mb-8 leading-relaxed font-medium">
            {message}
          </p>
          <Button
            onClick={loginWithGoogle}
            className="w-full"
            variant="primary"
          >
            Zaloguj się przez Google
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export { AuthGate };
