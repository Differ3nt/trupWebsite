import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';

const EVENTS = [
  {
    id: 'tatry-zimowe-2024',
    title: 'Zimowe Tatry: Orla Perć',
    date: '15-18 Grudnia 2024',
    location: 'Tatry Wysokie',
    spots: 'Brak miejsc',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCR5pO5QgFSNLU9L3FbHsULwCRMGO34kqt9OZ-XZxhW0DB_HZsXLqHWcsBQ0aMS0ysZc83MYvmEM1NO9JCPPKhU_MxzI8hIDaIqW8zJ_rrVgjm7oSpOll3ll9RnWZ7dSb8KtwvCAKiaWqxXyDhvkYexfztMYCKBIilPXMd1xilcN8abxVRtf1LTzZoQwUu5Gb-gGxTIl9K6JqR23QrN8JjJ7Ixe8SZWHUSybdNyPrVcZQaj0xjAhytQI3XDHaoZCeD72GRo6Zl_VMA'
  },
  {
    id: 'beskidy-planszowki',
    title: 'Beskidy & Planszówki',
    date: '12-14 Stycznia 2025',
    location: 'Schronisko Rysianka',
    spots: '5 wolnych miejsc',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQXZh676chPrNLBMu9h1yRGckedwK1JJ-r01WHjoYJda2Sg-hP5XZcR5sAoV6ygpTTRlc55WhnjoBNJ8bFd2w9vU5igPTfhBNlHMuXuvwt3yhQcnDVc7DYauk-Fi2ir1ohATcgP4bv74UrZgSW56DaiTm56z_NEIvcdN-_DP3Lf1JCEhGNtGkOZ7laRJTOjJZo17ZDhIpPVgMMiKOZFFd6-oKLuHx08Bk9N1-wHsp563zHBc3ycVL3ToPJTzyQrgn8huOZK8y4OSs'
  },
  {
    id: 'alpy-mont-blanc',
    title: 'Projekt Mont Blanc',
    date: 'Lipiec 2025',
    location: 'Chamonix, Francja',
    spots: 'Zapisy wkrótce',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcjkRKbPnllP6Fu_t4F60Sra3mvomt0nnpwjYHyJA8eTZZcMRgepBhquGNCO3xA2-1Z1sSBqVR9aT8oWKsxM6ju6ZIUwN364UtbkxEAuX03_gG-vEszryhTaRJglj8iZwCksg3SYAxiAb4RethpFxt5jt4tk4phlVag9kNcHIX-PLkcNrIgihV2T-Cjy0Wc39TuvYv3c4hdUNUzv5DOZCM96QyfSd8_jUH4zX2DV4AwZNYL10R_DmQh2QePLduEfJ9xx3tcHZQ8NI'
  }
];

export default function Events() {
  return (
    <div className="container mx-auto px-6 md:px-8 py-24">
      <div className="flex justify-between items-end mb-12">
        <h1 className="font-display font-black text-5xl md:text-7xl text-on-surface uppercase tracking-tighter">
          Wydarzenia
        </h1>
        <div className="hidden md:block text-on-surface-variant font-bold uppercase tracking-widest text-sm">
          Dołącz do nas na szlaku
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {EVENTS.map((event) => (
          <Link key={event.id} to={`/wydarzenia/${event.id}`} className="group block bg-surface-container-low border border-outline-variant/30 hover:border-primary-container transition-colors duration-300">
            <div className="h-64 overflow-hidden relative">
              <img 
                src={event.image} 
                alt={event.title} 
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4 bg-primary-container text-white px-3 py-1 font-bold text-xs uppercase tracking-wider">
                {event.spots}
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display font-black text-2xl uppercase tracking-tight mb-4 group-hover:text-primary-container transition-colors">
                {event.title}
              </h3>
              <div className="space-y-2 text-on-surface-variant font-medium text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary-container" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary-container" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
