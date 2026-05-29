import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Book, Loader2, Tag as TagIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Skeleton } from '../components/ui/Skeleton';

export default function WikiArticle() {
  const { id } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/wiki/${id}`)
      .then(res => res.json())
      .then(data => setArticle(data))
      .catch(err => console.error('Błąd wczytywania artykułu:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pb-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12 pt-16">
          <Skeleton className="h-6 w-24 mb-12" />
          <div className="mb-12 border-b border-outline-variant/30 pb-12 space-y-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-14 w-3/4" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={`h-3 ${i % 4 === 3 ? 'w-2/3' : 'w-full'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-6 text-center">
        <h2 className="font-display font-black text-4xl uppercase mb-4 text-on-surface">Artykuł nie odnaleziony</h2>
        <p className="text-on-surface-variant mb-8">Przepraszamy, ale ten artykuł mógł zostać usunięty lub nie istnieje.</p>
        <Link to="/wiki" className="btn btn-primary px-8 py-4">
          Wróć do bazy wiedzy
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="max-w-4xl mx-auto px-6 md:px-12 pt-16">
        <Link to="/wiki" className="btn btn-back inline-flex items-center gap-2 px-4 py-2 mb-12">
          <ArrowLeft size={16} /> Powrót do Wiki
        </Link>

        <header className="mb-12 border-b border-outline-variant/30 pb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-primary/10 text-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-primary/20">
              {article.category}
            </span>
          </div>
          <h1 className="font-display font-black text-4xl md:text-6xl uppercase tracking-tighter text-on-surface leading-[0.9] mb-8">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary" />
              {new Date(article.createdAt).toLocaleDateString('pl-PL')}
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-primary" />
              {article.authorName || 'Redakcja TRUP'}
            </div>
            {Array.isArray(article.tags) && article.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-l border-outline-variant/30 pl-6 ml-2">
                {article.tags.map((tag: string, i: number) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-highest text-on-surface-variant/80 border border-outline-variant/10 text-[9px] font-black uppercase tracking-widest">
                    <TagIcon size={10} /> {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </header>

        <article className="markdown-content max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {article.content}
          </ReactMarkdown>
        </article>

        <div className="mt-24 p-8 border border-outline-variant/30 bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-display font-black text-xl uppercase tracking-tight text-on-surface mb-2">Masz uwagi do artykułu?</h4>
            <p className="text-sm text-on-surface-variant">Napisz do nas, jeśli uważasz, że dane wymagają aktualizacji.</p>
          </div>
          <a href="mailto:kontakt@trup.pl" className="btn btn-secondary px-8 py-4 text-sm">
            Zgłoś poprawkę
          </a>
        </div>
      </div>
    </div>
  );
}
