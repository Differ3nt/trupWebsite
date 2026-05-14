import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface EventCountdownProps {
  targetDate: string;
  className?: string;
  compact?: boolean;
}

export default function EventCountdown({ targetDate, className = '', compact = false }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; total: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, total: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        total: diff
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft || timeLeft.total <= 0) return null;

  const displayText = timeLeft.days > 0 ? `ZA ${timeLeft.days} DNI` : 'DZISIAJ';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 bg-primary text-surface text-[9px] font-black uppercase tracking-widest ${className}`}>
        {displayText}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-stretch bg-[#121212] border border-white/10 shadow-xl overflow-hidden h-12 ${className}`}>
      <div className="bg-primary px-3 flex items-center justify-center text-surface">
        <Clock size={16} />
      </div>
      <div className="px-6 flex items-center">
        <p className="text-[14px] font-black uppercase tracking-[0.2em] text-white leading-none">{displayText}</p>
      </div>
    </div>
  );
}
