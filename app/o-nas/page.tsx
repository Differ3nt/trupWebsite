import { PageHeader } from '@/components/ui/PageHeader';
import { Mountain } from 'lucide-react';

const values = [
  'SUROWOŚĆ I AUTENTYCZNOŚĆ',
  'WSPÓŁPRACA PONAD RYWALIZACJĘ',
  'SZACUNEK DO NATURY',
  'CIĄGŁY ROZWÓJ',
];

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader
        title="O nas"
        subtitle="TRUP TO NIE TYLKO GRUPA GÓRSKA. TO IDEA, KTÓRA ZRODZIŁA SIĘ Z POTRZEBY PRZEKRACZANIA WŁASNYCH GRANIC."
        category="Nasza historia"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        {/* Left Column: Text and Values */}
        <div className="space-y-6">
          <p className="text-on-surface-variant leading-relaxed font-medium">
            TRUP to nie tylko grupa górska. To idea, która zrodziła się z potrzeby przekraczania własnych granic i budowania autentycznych relacji w świecie, który coraz bardziej staje się wirtualny.
          </p>

          <p className="text-on-surface-variant leading-relaxed font-medium">
            Naszą misją jest łączenie ludzi o podobnych wartościach – tych, którzy cenią surowe piękno natury, wysiłek fizyczny i wieczorne rozmowy przy planszówkach w schronisku.
          </p>

          {/* Values Section */}
          <div className="border-l-4 border-primary pl-6 mt-8">
            <h3 className="font-display font-black text-xl uppercase tracking-tight text-on-surface mb-4">
              Nasze wartości
            </h3>
            <ul className="space-y-3">
              {values.map((value) => (
                <li key={value} className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                  {value}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Image Placeholder */}
        <div className="flex items-center justify-center">
          <div className="w-full h-[400px] bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
            <Mountain size={80} className="text-on-surface-variant/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
