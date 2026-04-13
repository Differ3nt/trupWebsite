import React from 'react';
import { Search, Book, Map, ShieldAlert } from 'lucide-react';

const CATEGORIES = [
  { icon: <Book size={24} />, title: 'Sprzęt', count: 12 },
  { icon: <Map size={24} />, title: 'Trasy', count: 34 },
  { icon: <ShieldAlert size={24} />, title: 'Bezpieczeństwo', count: 8 },
];

const ARTICLES = [
  { title: 'Jak dobrać raki do butów?', category: 'Sprzęt', date: '12.10.2023' },
  { title: 'Zimowe wejście na Rysy - poradnik', category: 'Trasy', date: '05.11.2023' },
  { title: 'Lawinowe ABC - podstawy', category: 'Bezpieczeństwo', date: '20.11.2023' },
  { title: 'Warstwy ubioru w góry', category: 'Sprzęt', date: '02.12.2023' },
];

export default function Wiki() {
  return (
    <div className="container mx-auto px-6 md:px-8 py-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display font-black text-5xl md:text-7xl text-on-surface uppercase tracking-tighter mb-8 text-center">
          Baza Wiedzy
        </h1>
        
        <div className="relative mb-16">
          <input 
            type="text" 
            placeholder="Czego szukasz?" 
            className="w-full bg-surface-container-highest border-2 border-outline-variant/30 px-6 py-4 pl-14 font-sans text-lg focus:outline-none focus:border-primary-container transition-colors"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={24} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {CATEGORIES.map((cat, idx) => (
            <div key={idx} className="bg-surface-container-low border border-outline-variant/30 p-6 hover:border-primary-container transition-colors cursor-pointer group">
              <div className="text-primary-container mb-4 group-hover:scale-110 transition-transform origin-left">{cat.icon}</div>
              <h3 className="font-display font-bold text-xl uppercase tracking-tight mb-2">{cat.title}</h3>
              <p className="text-on-surface-variant text-sm font-medium">{cat.count} artykułów</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-6">Najnowsze wpisy</h2>
          <div className="space-y-4">
            {ARTICLES.map((article, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-highest transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-container mb-2 block">{article.category}</span>
                  <h4 className="font-display font-bold text-xl">{article.title}</h4>
                </div>
                <span className="text-on-surface-variant text-sm font-medium mt-4 sm:mt-0">{article.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
