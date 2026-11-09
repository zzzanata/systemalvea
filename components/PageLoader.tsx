import { LogoMark } from "@/components/Logo";

// Arcos da logo pulsando no centro, com uma barrinha verde embaixo.
// Entra com um pequeno atraso: páginas que carregam rápido nem chegam a mostrá-lo.
export default function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="fixed inset-0 z-50 flex items-center justify-center bg-sand-50/75 backdrop-blur-[2px] animate-av-fade motion-reduce:animate-none"
    >
      <div className="flex flex-col items-center gap-3 text-ink-900">
        <LogoMark className="h-12 w-12 animate-av-pulse motion-reduce:animate-none" />
        <div className="h-1 w-16 overflow-hidden rounded-full bg-sand-200">
          <div className="h-full w-1/3 rounded-full bg-brand-500 animate-av-bar motion-reduce:animate-none" />
        </div>
      </div>
    </div>
  );
}
