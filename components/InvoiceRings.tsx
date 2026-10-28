import ProgressRing from "@/components/ProgressRing";
import { brl, type InvoiceSummary } from "@/lib/types";

// Anéis de % paga (por valor): todas, saídas (a receber) e entradas (a pagar),
// com o mesmo visual dos anéis de progresso das obras.
export default function InvoiceRings({
  summary,
  compact = false,
}: {
  summary: InvoiceSummary;
  compact?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {summary.groups.map((g) => (
          <div key={g.key} className="flex min-w-0 flex-col items-center text-center">
            <ProgressRing percent={g.percent} className={compact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28"} />
            <p className="mt-2 text-sm font-semibold text-brand-900">{g.label}</p>
            <p className="text-xs text-slate-500">
              {g.count === 0 ? "sem notas" : `${g.percent}% ${g.paidLabel}`}
            </p>
            {g.count > 0 && !compact && (
              <p className="max-w-full truncate text-[11px] text-slate-400">
                {brl(g.paid)} de {brl(g.total)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Amount label="Pago" value={summary.paidAmount} count={summary.paidCount} tone="text-emerald-600" />
        <Amount label="Pendente" value={summary.pendingAmount} count={summary.pendingCount} tone="text-sun-700" />
        <Amount label="Vencido" value={summary.overdueAmount} count={summary.overdueCount} tone="text-red-600" />
      </div>
    </div>
  );
}

function Amount({ label, value, count, tone }: { label: string; value: number; count: number; tone: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 p-2.5">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label} ({count})
      </p>
      <p className={`truncate text-sm font-semibold tabular-nums sm:text-base ${tone}`}>{brl(value)}</p>
    </div>
  );
}
