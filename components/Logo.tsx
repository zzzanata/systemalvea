// Logo da Alvéa: os dois arcos do favicon do site + o nome em Newsreader.
export function LogoMark({ className = "h-9 w-9", animated = false }: { className?: string; animated?: boolean }) {
  const draw = animated ? "animate-av-draw [stroke-dasharray:1]" : "";
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <path
        d="M6 28V14a10 10 0 0 1 20 0v14"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className={draw}
      />
      <path
        d="M11 28V15.5a5 5 0 0 1 10 0V28"
        pathLength={1}
        fill="none"
        stroke="#5B8A7C"
        strokeWidth="1.8"
        className={draw}
        style={animated ? { animationDelay: "0.5s" } : undefined}
      />
    </svg>
  );
}

export default function Logo({ className = "", subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 text-ink-900 ${className}`}>
      <LogoMark />
      <span className="leading-none">
        <span className="block font-serif text-2xl font-light tracking-tight">Alvéa</span>
        {subtitle && (
          <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.22em] text-brand-600">
            Odontologia
          </span>
        )}
      </span>
    </span>
  );
}
