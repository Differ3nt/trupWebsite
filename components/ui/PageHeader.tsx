interface PageHeaderProps {
  title: string;
  subtitle?: string;
  category?: string;
  className?: string;
  align?: 'left' | 'center';
}

export function PageHeader({ title, subtitle, category, className = '', align = 'left' }: PageHeaderProps) {
  const centered = align === 'center';
  return (
    <div className={`mb-12 md:mb-20 ${centered ? 'text-center' : ''} ${className}`}>
      {category && (
        <p className="text-primary font-bold text-[10px] md:text-xs tracking-[0.3em] uppercase mb-4">
          {category}
        </p>
      )}
      <h1 className={`font-display font-black text-5xl md:text-7xl lg:text-8xl leading-[0.85] text-on-surface uppercase tracking-tighter mb-6 ${centered ? 'mx-auto' : ''}`}>
        {title}
      </h1>
      {subtitle && (
        <p className={`text-on-surface-variant text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed max-w-3xl ${centered ? 'mx-auto' : ''}`}>
          {subtitle}
        </p>
      )}
      <div className={`w-24 h-1 bg-primary mt-8 ${centered ? 'mx-auto' : ''}`} />
    </div>
  );
}
