import React from 'react';
import { motion } from 'motion/react';

interface ComingSoonProps {
  title: string;
}

export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-6 md:px-12 lg:px-24 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-primary font-bold text-[10px] md:text-xs tracking-[0.3em] uppercase mb-4">
          W przygotowaniu
        </p>
        <h1 className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.85] text-on-surface uppercase tracking-tighter mb-6">
          {title}
        </h1>
        <div className="w-24 h-1 bg-primary mb-12" />
        <p className="text-on-surface-variant text-xs md:text-sm font-bold uppercase tracking-widest">
          Ta sekcja jest jeszcze w budowie. Wróć wkrótce.
        </p>
      </motion.div>
    </div>
  );
}
