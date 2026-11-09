import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import Logo from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Arcos concêntricos (o desenho da logo) que formam o fundo do lado da marca.
const arches = [
  { r: 260, w: 1.2, o: 0.18, d: 0 },
  { r: 205, w: 1.2, o: 0.24, d: 0.15 },
  { r: 150, w: 1.4, o: 0.32, d: 0.3 },
  { r: 95, w: 1.6, o: 0.5, d: 0.45 },
];

export default async function LoginPage() {
  // Já logado: não faz sentido ver a tela de login.
  if (await getCurrentUser()) redirect("/");

  return (
    <div data-av-own className="grid min-h-screen overflow-hidden lg:grid-cols-[1.1fr_1fr]">
      {/* Lado da marca: verde escuro com os arcos da logo sendo desenhados. */}
      <aside className="relative hidden overflow-hidden bg-brand-900 text-sand-50 lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div aria-hidden className="pointer-events-none absolute -bottom-16 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 animate-av-breathe rounded-full bg-brand-500/20 blur-3xl" />

        <svg aria-hidden viewBox="0 0 600 420" className="pointer-events-none absolute inset-x-0 bottom-0 w-full">
          {arches.map((a) => (
            <path
              key={a.r}
              d={`M${300 - a.r} 420 V${420 - a.r * 0.55} a${a.r} ${a.r} 0 0 1 ${a.r * 2} 0 V420`}
              pathLength={1}
              fill="none"
              stroke={a.r === 95 ? "#93B7A9" : "#FBFAF7"}
              strokeOpacity={a.o}
              strokeWidth={a.w}
              className="animate-av-draw [stroke-dasharray:1]"
              style={{ animationDelay: `${a.d}s` }}
            />
          ))}
        </svg>

        <div className="relative z-10 animate-av-rise">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium tracking-wide text-brand-200 ring-1 ring-inset ring-white/10">
            <span className="h-1.5 w-1.5 animate-av-pulse rounded-full bg-brand-300" />
            Bauru · SP
          </p>
        </div>

        <div className="relative z-10 mb-40 max-w-md space-y-4 animate-av-rise [animation-delay:250ms]">
          <h2 className="font-serif text-5xl font-light leading-[1.05] tracking-tight">
            Cada tratamento, <i className="text-brand-300">no seu tempo.</i>
          </h2>
          <p className="text-sm leading-relaxed text-sand-50/65">
            Agenda, orçamentos e financeiro da Alvéa Odontologia em um só lugar.
          </p>
        </div>
      </aside>

      {/* Lado do formulário */}
      <main className="relative flex flex-col items-center justify-center gap-10 bg-sand-50 p-5 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 animate-av-breathe rounded-full bg-brand-100/80 blur-3xl" />

        <Logo className="relative animate-av-rise scale-125" />

        <div className="relative w-full max-w-sm animate-av-rise space-y-6 overflow-hidden rounded-3xl border border-sand-200 bg-white/90 p-7 shadow-xl shadow-brand-900/5 backdrop-blur [animation-delay:120ms] sm:p-8">
          <span className="absolute inset-x-0 top-0 h-0.5 origin-left animate-av-fill bg-gradient-to-r from-brand-300 via-brand-500 to-brand-300 [animation-delay:400ms]" />
          <header className="space-y-1">
            <h1 className="font-serif text-2xl font-light tracking-tight text-ink-900">Acesse o sistema</h1>
            <p className="text-sm text-ink-500">Entre com seu e-mail e senha</p>
          </header>
          <LoginForm />
        </div>

        <p className="relative animate-av-text text-xs text-ink-400">© Alvéa Odontologia</p>
      </main>
    </div>
  );
}
