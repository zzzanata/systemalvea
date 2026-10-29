import AnimatedNumber from "@/components/AnimatedNumber";

type Tone = "default" | "good" | "bad" | "warn" | "danger";

const tones: Record<Tone, { value: string; bar: string; chip: string }> = {
  default: { value: "text-brand-900", bar: "from-brand-900 to-brand-700", chip: "bg-brand-50 text-brand-900" },
  good: { value: "text-emerald-600", bar: "from-emerald-500 to-emerald-400", chip: "bg-emerald-50 text-emerald-600" },
  bad: { value: "text-red-600", bar: "from-red-500 to-red-400", chip: "bg-red-50 text-red-600" },
  warn: { value: "text-sun-700", bar: "from-sun-400 to-sun-200", chip: "bg-sun-50 text-sun-700" },
  danger: { value: "text-red-600", bar: "from-red-500 to-red-400", chip: "bg-red-50 text-red-600" },
};

// Cartão padrão do painel: todos têm a mesma altura e a mesma estrutura.
// O tamanho da fonte acompanha a largura do cartão, então o valor nunca estoura.
export default function StatCard({
  label,
  value,
  kind = "int",
  hint,
  tone = "default",
  icon,
  index = 0,
}: {
  label: string;
  value: number;
  kind?: "int" | "brl";
  hint?: string;
  tone?: Tone;
  icon?: React.ReactNode;
  /** Posição na fileira: define o atraso da animação de entrada. */
  index?: number;
}) {
  const t = tones[tone];

  return (
    <div
      style={{ animationDelay: `${index * 70}ms` }}
      className="group relative h-[8.25rem] min-w-0 animate-gtg-rise overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/10"
    >
      {/* Faixa de cor no topo, que "enche" ao entrar. */}
      <span className={`absolute inset-x-0 top-0 h-1 origin-left animate-gtg-fill bg-gradient-to-r ${t.bar}`} style={{ animationDelay: `${index * 70 + 150}ms` }} />
      {/* Brilho que passa uma vez pelo cartão. */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 animate-gtg-sheen bg-gradient-to-r from-transparent via-white/70 to-transparent" style={{ animationDelay: `${index * 70 + 350}ms` }} />

      <div className="@container flex h-full flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium text-slate-500">{label}</p>
          {icon && (
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition duration-300 group-hover:scale-110 ${t.chip}`}>
              {icon}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className={`truncate whitespace-nowrap font-semibold tracking-tight text-[clamp(1.1rem,10cqw,1.9rem)] leading-tight ${t.value}`}>
            <AnimatedNumber value={value} kind={kind} />
          </p>
          <p className="mt-0.5 h-4 truncate text-xs text-slate-400">{hint ?? " "}</p>
        </div>
      </div>
    </div>
  );
}
