import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Component, ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { AuthGate } from '../components/ui/AuthGate';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export default function News() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader 
        title="Aktualności" 
        subtitle="KOMUNIKATY I INFORMACJE GRUPY TRUP."
        category="Komunikaty grupy"
      />

      <AuthGate message="Komunikaty, galerie i wydarzenia dostępne są wyłącznie dla zalogowanych członków grupy TRUP.">
        {/* Link do wydarzeń */}
        <div className="mb-12 p-6 border border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Nadchodzące Wydarzenia</p>
              <p className="text-sm text-on-surface-variant">Szukasz nadchodzących wydarzeń? Sprawdź naszą stronę wydarzeń.</p>
            </div>
            <Button asChild leftIcon={<ArrowRight size={14} />} className="flex-row-reverse gap-2">
              <Link to="/wydarzenia">Wydarzenia</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-12">
          {/* Typ: Komunikat */}
          <div className="flex gap-4 md:gap-8">
             <div className="w-12 pt-1 flex flex-col items-center">
                <div className="bg-surface-variant border border-outline-variant/30 text-on-surface-variant p-3 rounded-full mb-2">
                   <FileText size={20} />
                </div>
                <div className="w-[1px] h-full bg-outline-variant/30"></div>
             </div>
             <Card className="flex-1 p-6 md:p-8">
                <Badge variant="secondary" className="mb-2">Artykuł sprzętowy • 1 tydzień temu</Badge>
                <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-on-surface mb-3">Recenzja Uprzęży Alpinistycznych</h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-6">Wgraliśmy nowe wpisy na Wiki z testami szpeju wykorzystywanego podczas letniego sezonu we wspinaczce wielowyciągowej.</p>
                <Link to="/wiki" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">
                  Przejdź do Wiki →
                </Link>
             </Card>
          </div>

          {/* Typ: Komunikat systemowy */}
          <div className="flex gap-4 md:gap-8">
             <div className="w-12 pt-1 flex flex-col items-center">
                <div className="bg-tertiary-container/20 text-tertiary-container p-3 rounded-full mb-2">
                   <Component size={20} />
                </div>
             </div>
             <Card className="flex-1 bg-tertiary-container/10 border-tertiary-container/30 p-6 md:p-8">
                <Badge variant="outline" className="mb-2 text-tertiary-container border-tertiary-container/30">Komunikat Systemowy • 2 tygodnie temu</Badge>
                <h3 className="font-display font-black text-2xl md:text-3xl uppercase tracking-tight text-tertiary-container mb-3">Wersja v2.0 Live</h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-6">Platforma TRUP w wersji 2.0 jest gotowa. Profil użytkownika, wsparcie PWA, nowy system Galerii.</p>
             </Card>
          </div>
        </div>
      </AuthGate>
    </div>
  );
}
