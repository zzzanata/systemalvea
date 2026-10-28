import { brl, type FinancePoint } from "@/lib/types";

// Gráfico de barras agrupadas em SVG puro: verde = faturamento, vermelho = custos.
// Escala junto com a largura da tela (viewBox) e não depende de nenhuma biblioteca.
const W = 480;
const H = 250;
const L = 54;
const R = 8;
const T = 12;
const B = 28;

const GREEN = "#10b981";
const RED = "#ef4444";

// Escolhe um passo "redondo" (1, 2, 2.5, 5 × potência de 10) com no máximo 5 divisões.
function niceScale(max: number) {
  const exp = Math.pow(10, Math.floor(Math.log10(max)) - 1);
  for (const m of [1, 2, 2.5, 5, 10, 20, 25, 50, 100]) {
    const step = m * exp;
    const count = Math.ceil(max / step);
    if (count <= 5) return { step, count };
  }
  return { step: max, count: 1 };
}

function compact(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  if (v >= 1_000) return `${Math.round(v / 1_000)} mil`;
  return String(Math.round(v));
}

export default function FinanceChart({ data }: { data: FinancePoint[] }) {
  const max = Math.max(0, ...data.flatMap((d) => [d.revenue, d.cost]));

  if (max === 0) {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
        Nenhum lançamento nos últimos meses.
      </p>
    );
  }

  const { step, count } = niceScale(max);
  const top = step * count;
  const plotW = W - L - R;
  const plotH = H - T - B;
  const group = plotW / data.length;
  const barW = Math.min(24, group * 0.32);
  const y = (v: number) => T + plotH - (v / top) * plotH;
  const ticks = Array.from({ length: count + 1 }, (_, i) => i * step);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Faturamento e custos por mês"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#e2e8f0" strokeWidth="1" />
          <text
            x={L - 6}
            y={y(t)}
            textAnchor="end"
            dominantBaseline="central"
            fontSize="12"
            fill="#64748b"
          >
            {compact(t)}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const cx = L + group * i + group / 2;
        const bars = [
          { v: d.revenue, x: cx - barW - 1, fill: GREEN, name: "Faturamento" },
          { v: d.cost, x: cx + 1, fill: RED, name: "Custos" },
        ];
        return (
          <g key={d.label}>
            {bars.map(
              (b) =>
                b.v > 0 && (
                  <rect
                    key={b.name}
                    x={b.x}
                    y={y(b.v)}
                    width={barW}
                    height={(b.v / top) * plotH}
                    rx={3}
                    fill={b.fill}
                    className="animate-gtg-grow"
                    style={{
                      transformBox: "fill-box",
                      transformOrigin: "bottom",
                      animationDelay: `${i * 80 + (b.name === "Custos" ? 60 : 0)}ms`,
                    }}
                  >
                    <title>{`${d.label} · ${b.name}: ${brl(b.v)}`}</title>
                  </rect>
                ),
            )}
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="12" fill="#64748b">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
