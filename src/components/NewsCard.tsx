import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Book, Zap, ArrowRight, Trophy } from 'lucide-react';
import EventCountdown from './EventCountdown';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

interface NewsCardProps {
  item: {
    id: string;
    title: string;
    content?: string;
    type: 'EVENT' | 'ARTICLE' | 'UPDATE' | 'GENERAL';
    imageUrl?: string;
    link?: string;
    eventId?: string;
    articleId?: string;
    createdAt: string;
    // Joined data
    eventTitle?: string;
    eventImage?: string;
    eventType?: string;
    eventDate?: string;
    eventLocation?: string;
    articleTitle?: string;
    articleCategory?: string;
  };
}

export default function NewsCard({ item }: NewsCardProps) {
  const isEvent = item.type === 'EVENT';
  const isArticle = item.type === 'ARTICLE';
  const isUpdate = item.type === 'UPDATE';

  // Determine the link and display data
  const targetLink = isEvent ? `/wydarzenia/${item.eventId}` : 
                    isArticle ? `/wiki/${item.articleId}` : 
                    item.link || '#';
  
  const title = isEvent ? item.eventTitle : isArticle ? item.articleTitle : item.title;
  const image = isEvent ? item.eventImage : item.imageUrl;
  const date = isEvent ? item.eventDate : item.createdAt;

  return (
    <Link
      to={targetLink}
      className={cn(
        "group relative block border border-outline-variant/20 bg-surface-container-low hover:border-primary transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden"
      )}
    >
      {/* Background Glow/Image */}
      {image && (
        <div className="absolute inset-0 z-0">
          <img 
            src={image} 
            alt="" 
            className="w-full h-full object-cover opacity-[0.05] grayscale group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-container-low via-transparent to-surface-container-low opacity-40"></div>
        </div>
      )}

      <div className="relative z-10 flex flex-col md:flex-row h-48 md:h-64">
        {/* Visual Identity (Image or Icon) */}
        <div className="overflow-hidden md:w-1/3 lg:w-1/4 h-24 md:h-auto shrink-0 border-r border-outline-variant/10 relative bg-surface-container">
          {image ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/20">
              {isUpdate ? <Zap size={64} strokeWidth={1} /> : isArticle ? <Book size={64} strokeWidth={1} /> : <Zap size={64} strokeWidth={1} />}
            </div>
          )}
          
          <div className="absolute top-0 left-0 z-20">
            <Badge variant="primary" className="shadow-lg px-3 py-1">
              {isEvent ? item.eventType : isArticle ? item.articleCategory : 'OGŁOSZENIE'}
            </Badge>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-4 md:p-6 flex flex-col justify-center flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Badge variant="outline" className="gap-1.5 border-primary/30">
                {isEvent ? <Trophy size={10} /> : isArticle ? <Book size={10} /> : <Zap size={10} />}
                <span>{isEvent ? 'Nowa Wyprawa' : isArticle ? 'Nowy Artykuł' : 'Aktualizacja'}</span>
              </Badge>
            </div>

          <h3 className="font-display font-black text-lg md:text-2xl uppercase tracking-tight mb-2 text-on-surface leading-tight truncate md:whitespace-normal group-hover:link-underline">
            {title}
          </h3>

          <div className="space-y-1 text-on-surface-variant text-[10px] md:text-sm font-medium">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-primary shrink-0" />
              <span>{new Date(date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            {isEvent && item.eventLocation && (
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-primary shrink-0" />
                <span>{item.eventLocation}</span>
              </div>
            )}
            {!isEvent && item.content && (
              <p className="text-[10px] text-on-surface-variant/70 line-clamp-1 md:line-clamp-2 mt-1 font-normal leading-relaxed">
                {item.content}
              </p>
            )}
            {isEvent && new Date(date) >= new Date() && (
              <div className="mt-2 scale-90 origin-left">
                <EventCountdown targetDate={date} compact />
              </div>
            )}
          </div>

          {/* Action indicator */}
          <div className="mt-auto pt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            {isEvent ? 'Szczegóły' : isArticle ? 'Czytaj' : 'Więcej'}
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </Link>
  );
}
