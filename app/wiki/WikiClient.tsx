'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Star, FileText } from '@/components/icons';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/states/EmptyState';

interface WikiArticleData {
  id: string;
  title: string;
  category?: string | null;
  content: string;
  tags?: string[];
  createdAt: Date;
  authorName?: string | null;
}

interface WikiClientProps {
  articles: WikiArticleData[];
}

const categoryMetadata: Record<string, { icon: React.ReactNode; label: string }> = {
  PORADNIK: { icon: <BookOpen size={24} />, label: 'Poradniki' },
  WYPOSAŻENIE: { icon: <Star size={24} />, label: 'Wyposażenie' },
  TECHNIKA: { icon: <FileText size={24} />, label: 'Technika' },
};

export function WikiClient({ articles }: WikiClientProps) {
  const [search, setSearch] = useState('');

  // Get unique categories from articles
  const categories = Array.from(
    new Set(
      articles
        .map((a) => a.category)
        .filter((c): c is string => c !== null && c !== undefined)
    )
  ).sort();

  // Count articles by category
  const categoryCount = (cat: string) => {
    return articles.filter((a) => a.category === cat).length;
  };

  // Filter articles by search term
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;

    const searchLower = search.toLowerCase();
    return articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchLower) ||
        article.category?.toLowerCase().includes(searchLower) ||
        article.tags?.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        ) ||
        article.content.toLowerCase().includes(searchLower)
    );
  }, [articles, search]);

  return (
    <div className="space-y-12">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-on-surface-variant" size={20} />
        <Input
          type="text"
          placeholder="Szukaj poradników, sprzętu, techniki..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface-container-highest border-2 border-outline-variant/30 px-6 py-4 pl-14 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => {
          const meta = categoryMetadata[category] || {
            icon: <FileText size={24} />,
            label: category,
          };
          const count = categoryCount(category);

          return (
            <div
              key={category}
              className="bg-surface-container-low border border-outline-variant/30 p-6 text-center hover:border-primary transition-colors cursor-default"
            >
              <div className="flex justify-center mb-4 text-primary">
                {meta.icon}
              </div>
              <h3 className="font-display font-black text-lg uppercase tracking-tighter text-on-surface mb-2">
                {meta.label}
              </h3>
              <p className="text-xs text-on-surface-variant">
                {count} {count === 1 ? 'artykuł' : 'artykułów'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={48} />}
          title="Brak artykułów"
          description={
            search
              ? 'Nie znaleziono artykułów pasujących do Twojego wyszukiwania.'
              : 'Nie ma jeszcze żadnych artykułów w bazie wiedzy.'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <Link key={article.id} href={`/wiki/${article.id}`}>
              <div className="bg-surface-container-low border border-outline-variant/30 p-6 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  {article.category && (
                    <Badge variant="primary">{article.category}</Badge>
                  )}
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-widest">
                    {new Date(article.createdAt).toLocaleDateString('pl-PL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <h3 className="font-display font-black text-xl uppercase tracking-tight text-on-surface mb-2">
                  {article.title}
                </h3>

                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[9px]">
                        #{tag}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <span className="text-[9px] text-on-surface-variant/60">
                        +{article.tags.length - 3} więcej
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                  {article.content.substring(0, 150)}
                  {article.content.length > 150 ? '...' : ''}
                </p>

                {article.authorName && (
                  <p className="text-[9px] text-on-surface-variant/60 mt-3 uppercase tracking-widest">
                    Autor: {article.authorName}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
