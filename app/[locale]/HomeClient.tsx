'use client';

import { useState, useEffect, useRef } from 'react';
import { Mountain, Route, TrendingUp, Clock, Users } from '@/components/icons';

interface HomeStats {
  expeditions: number;
  distance: number;
  elevation: number;
  duration: number;
  members: number;
}

interface HomeClientProps {
  stats: HomeStats;
}

function AnimatedNumber({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startTime = Date.now();
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(target * progress);
      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{count}</span>;
}

export function HomeClient({ stats }: HomeClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const statItems = [
    {
      icon: <Mountain size={32} />,
      value: stats.expeditions,
      unit: '',
      label: 'Ekspedycji',
      format: (v: number) => v.toString(),
    },
    {
      icon: <Route size={32} />,
      value: stats.distance,
      unit: 'km',
      label: 'Pokonanych',
      format: (v: number) => v.toFixed(1),
    },
    {
      icon: <TrendingUp size={32} />,
      value: stats.elevation,
      unit: 'm',
      label: 'Przewyższenia',
      format: (v: number) => v.toString(),
    },
    {
      icon: <Clock size={32} />,
      value: Math.round(stats.duration / 60),
      unit: 'h',
      label: 'Godzin',
      format: (v: number) => v.toString(),
    },
    {
      icon: <Users size={32} />,
      value: stats.members,
      unit: '',
      label: 'Członków',
      format: (v: number) => v.toString(),
    },
  ];

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-2 lg:grid-cols-5 gap-12 md:gap-16"
    >
      {statItems.map((stat, idx) => (
        <div key={idx} className="text-center">
          <div className="flex justify-center mb-6 text-primary/50">
            {stat.icon}
          </div>
          <div className="font-display text-5xl md:text-7xl font-black text-white mb-3 leading-none">
            {isVisible ? (
              <>
                <AnimatedNumber target={stat.value} duration={2000} />
                {stat.unit && <span className="text-3xl md:text-5xl">{stat.unit}</span>}
              </>
            ) : (
              '0'
            )}
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant/60 font-bold">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
