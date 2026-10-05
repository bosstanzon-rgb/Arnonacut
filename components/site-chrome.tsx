import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#f6f4f0]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 sm:h-16">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-tight text-stone-950 sm:text-[1.35rem]">
            Israel News
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" aria-hidden />
            Live
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.14em] text-stone-400 sm:inline">
            English
          </span>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-stone-200/80">
      <div className="mx-auto max-w-3xl px-4 py-8 text-xs leading-relaxed text-stone-500">
        <p>
          Israel News publishes English headlines and short summaries only. Full
          reporting remains with the original publishers.
        </p>
        <p className="mt-2">
          This build uses sample stories for development. It does not connect to
          live news wires yet.
        </p>
      </div>
    </footer>
  );
}
