import React from 'react';
import PageHeader from '../components/PageHeader';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader 
        title="O nas" 
        subtitle="TRUP TO NIE TYLKO GRUPA GÓRSKA. TO IDEA, KTÓRA ZRODZIŁA SIĘ Z POTRZEBY PRZEKRACZANIA WŁASNYCH GRANIC."
        category="Nasza historia"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <div>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
            TRUP to nie tylko grupa górska. To idea, która zrodziła się z potrzeby przekraczania własnych granic i budowania autentycznych relacji w świecie, który coraz bardziej staje się wirtualny.
          </p>
          <p className="text-on-surface-variant text-lg leading-relaxed mb-6">
            Naszą misją jest łączenie ludzi o podobnych wartościach – tych, którzy cenią surowe piękno natury, wysiłek fizyczny i wieczorne rozmowy przy planszówkach w schronisku.
          </p>
          <div className="border-l-4 border-primary-container pl-6 mt-12">
            <h3 className="font-display font-bold text-2xl uppercase tracking-tight mb-4">Nasze Wartości</h3>
            <ul className="space-y-3 text-on-surface-variant font-medium">
              <li>SUROWOŚĆ I AUTENTYCZNOŚĆ</li>
              <li>WSPÓŁPRACA PONAD RYWALIZACJĘ</li>
              <li>SZACUNEK DO NATURY</li>
              <li>CIĄGŁY ROZWÓJ</li>
            </ul>
          </div>
        </div>
        <div className="bg-surface-container-highest h-[400px] md:h-auto relative overflow-hidden">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa7acOdV7YKgwpJg-268uU718pQAUga5uA3pvdc-dQENa4-BG3jRKjpdq6tLh-kZCasI3uuDBYAp7GTzFXmGOO_JMi1zUWej2Cl94qvyJ4LPKfLTO-laNfpUtzTyEsLR56DnvWWpechHZkiqYV0_VZInpVx6ft1cVFKjaE6qKQw_NCypI4p59JPd5U2EYphSfjvv7Fc3Sr4xm9eKflSjWS7t30PdGbxb8mSdBC59mjpzYrZuCR0hbNZOxdCIVn-4Zl_WesiwMB8zM" 
            alt="Ekipa Alpinist" 
            className="absolute inset-0 w-full h-full object-cover grayscale-[30%]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
}
