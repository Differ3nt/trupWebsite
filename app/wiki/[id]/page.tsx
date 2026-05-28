import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Tag as TagIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

export default async function WikiArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let article;
  try {
    article = await prisma.wikiArticle.findUnique({
      where: { id },
    });
  } catch {
    article = null;
  }

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-12 py-12">
      <Link
        href="/wiki"
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors mb-12"
      >
        <ArrowLeft size={14} /> Powrót do Wiki
      </Link>

      <header className="mb-12 border-b border-outline-variant/30 pb-12">
        <span className="inline-block bg-primary/10 text-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-primary/20 mb-6">
          {article.category || 'Artykuł'}
        </span>

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
            <div className="flex flex-wrap gap-2 border-l border-outline-variant/30 pl-6">
              {(article.tags as string[]).map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-highest text-on-surface-variant/80 border border-outline-variant/10 text-[9px] font-black uppercase tracking-widest"
                >
                  <TagIcon size={10} /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      <article className="prose prose-invert max-w-none space-y-6">
        <div className="prose-headings:font-display prose-headings:uppercase prose-headings:tracking-tighter prose-a:text-primary prose-code:text-primary prose-code:bg-surface-container-low prose-code:px-1">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
            {article.content}
          </ReactMarkdown>
        </div>
      </article>

      <div className="mt-24 p-8 border border-outline-variant/30 bg-surface-container-low flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="font-display font-black text-xl uppercase tracking-tight text-on-surface mb-2">
            Masz uwagi do artykułu?
          </h4>
          <p className="text-sm text-on-surface-variant">
            Napisz do nas, jeśli uważasz, że dane wymagają aktualizacji.
          </p>
        </div>
        <a
          href="mailto:kontakt@trup.pl"
          className="inline-flex items-center justify-center px-8 py-4 text-xs font-bold uppercase tracking-widest bg-black/60 text-on-surface ring-2 ring-inset ring-white/10 hover:bg-white hover:text-surface transition-all"
        >
          Zgłoś poprawkę
        </a>
      </div>
    </div>
  );
}
