import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Star, FileText, Loader2, Tag as TagIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Skeleton } from '../components/ui/Skeleton';


const CATEGORY_MAP: Record<string, { icon: React.ReactNode }> = {
  'Poradnik': { icon: <BookOpen size={24} /> },
  'Recenzja': { icon: <Star size={24} /> },
  'Artykuł': { icon: <FileText size={24} /> },
};

export default function Wiki() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/wiki')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setArticles(data);
      })
      .catch(err => console.error('Błąd Wiki:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredArticles = articles.filter(a => {
    const s = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(s) ||
      a.category.toLowerCase().includes(s) ||
      (Array.isArray(a.tags) && a.tags.some((t: string) => t.toLowerCase().includes(s)))
    );
  });

  const categories = Object.keys(CATEGORY_MAP).map(cat => ({
    title: cat,
    icon: CATEGORY_MAP[cat].icon,
    count: articles.filter(a => a.category === cat).length
  }));

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
      <PageHeader 
        title="Baza Wiedzy" 
        subtitle="ZBIÓR DOŚWIADCZEŃ, PORADNIKÓW I DOKUMENTACJI TECHNICZNEJ GRUPY TRUP."
        category="Wiedza i sprzęt"
      />
        
        <div className="relative mb-16">
          <input 
            type="text" 
            placeholder="Czego szukasz?" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-container-highest border-2 border-outline-variant/30 px-6 py-4 pl-14 font-sans text-lg focus:outline-none focus:border-primary transition-colors"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant" size={24} />
        </div>

        {loading ? (
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-12" />
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border border-outline-variant/30 p-6 space-y-3">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {categories.map((cat, idx) => (
                <div key={idx} className="bg-surface-container-low border border-outline-variant/30 p-6 hover:border-primary transition-colors cursor-pointer group">
                  <div className="text-primary mb-4">{cat.icon}</div>
                  <h3 className="font-display font-bold text-xl uppercase tracking-tight mb-2">{cat.title}</h3>
                  <p className="text-on-surface-variant text-sm font-medium">{cat.count} artykułów</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="font-display font-black text-3xl uppercase tracking-tight mb-6">
                {search ? `Wyniki dla: ${search}` : 'Najnowsze wpisy'}
              </h2>
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <Link 
                    key={article.id} 
                    to={`/wiki/${article.id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-surface-container-low border border-outline-variant/20 hover:bg-surface-container-highest transition-colors cursor-pointer group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{article.category}</span>
                        <div className="flex gap-2">
                          {Array.isArray(article.tags) && article.tags.map((tag: string, i: number) => (
                            <span key={i} className="flex items-center gap-1 text-[8px] font-bold uppercase bg-surface-container-highest px-2 py-0.5 text-on-surface-variant/70 border border-outline-variant/10">
                              <TagIcon size={8} /> {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <h4 className="font-display font-black text-xl uppercase tracking-tight group-hover:text-primary transition-colors">{article.title}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest block opacity-40">
                        {new Date(article.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  </Link>
                ))}

                {filteredArticles.length === 0 && (
                  <p className="text-center py-12 text-on-surface-variant italic">Nie znaleziono artykułów spełniających kryteria.</p>
                )}
              </div>
            </div>
          </>
        )}
    </div>
  );
}
