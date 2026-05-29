'use client';

import { useState, useEffect } from 'react';

interface Props {
  dateStart: Date | string;
  className?: string;
}

export function EventCountdown({ dateStart, className }: Props) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    function compute() {
      const diff = new Date(dateStart).getTime() - Date.now();
      if (diff <= 0) return null;
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      if (days >= 1) return `Za ${days} ${days === 1 ? 'dzień' : 'dni'}`;
      if (hours >= 1) return `Za ${hours}h ${mins}min`;
      if (mins > 0) return `Za ${mins}min`;
      return 'Dziś!';
    }

    setLabel(compute());
    const id = setInterval(() => setLabel(compute()), 60_000);
    return () => clearInterval(id);
  }, [dateStart]);

  if (!label) return null;

  return <span className={className}>{label}</span>;
}
