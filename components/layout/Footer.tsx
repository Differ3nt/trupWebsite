import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full py-12 px-6 md:px-12 flex flex-col lg:flex-row justify-between items-center gap-8 bg-[#f9f9f8] text-[#37392E] mt-auto">
      <div className="flex flex-col items-center lg:items-start">
        <img
          src="/logo.png"
          alt="TRUP"
          className="h-12 w-auto mb-2 grayscale opacity-70"
        />
        <div className="flex flex-col items-center lg:items-start gap-1">
          <p className="text-[10px] font-bold uppercase tracking-widest">
            TRUP
          </p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#37392E]/70">
            © 2025 TRUP — GÓRSKA SEKCJA TURYSTYCZNA
          </p>
        </div>
      </div>

      <div className="flex gap-8">
        <a
          href="#"
          className="text-[#37392E]/70 text-[10px] font-bold uppercase tracking-widest hover:text-[#37392E] transition-colors"
        >
          Instagram
        </a>
        <a
          href="#"
          className="text-[#37392E]/70 text-[10px] font-bold uppercase tracking-widest hover:text-[#37392E] transition-colors"
        >
          Facebook
        </a>
        <a
          href="#"
          className="text-[#37392E]/70 text-[10px] font-bold uppercase tracking-widest hover:text-[#37392E] transition-colors"
        >
          Kontakt
        </a>
      </div>
    </footer>
  );
}
