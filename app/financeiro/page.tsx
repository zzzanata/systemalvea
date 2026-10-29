import FinanceChart from "@/components/FinanceChart";
import MovementGrid from "@/components/MovementGrid";
import Panel from "@/components/Panel";
import { requireAdmin } from "@/lib/auth";
import { todayBR } from "@/lib/dates";
import {
  getFinanceCategories,
  getFinanceSeries,
  getMovementRecords,
  getProjectOptions,
} from "@/lib/data";
import { brl } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MovimentacoesPage() {
  await requireAdmin();

  const [series, entries, categories, projects] = await Promise.all([
    getFinanceSeries(6),
    getMovementRecords(),
    getFinanceCategories(),
    getProjectOptions(),
  ]);

  const revenue = series.reduce((s, d) => s + d.revenue, 0);
  const cost = series.reduce((s, d) => s + d.cost, 0);
  const result = revenue - cost;

  // Saídas por categoria (todas as movimentações).
  const byCategory = new Map<string, number>();
  for (const e of entries) {
    if (e.type !== "COST") continue;
    const name = e.categoryName || "Sem categoria";
    byCategory.set(name, (byCategory.get(name) ?? 0) + e.amount);
  }
  const top = [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topMax = top[0]?.[1] ?? 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Movimentações</h1>
        <p className="text-sm text-slate-500">
          Gastos e ganhos da empresa. Entrada conta como faturamento, saída como custo.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Últimos 6 meses">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Faturamento</p>
                  <p className="text-sm font-semibold text-emerald-600">{brl(revenue)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Custos</p>
                  <p className="text-sm font-semibold text-red-600">{brl(cost)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Resultado</p>
                  <p className={`text-sm font-semibold ${result >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {brl(result)}
                  </p>
                </div>
              </div>
              <FinanceChart data={series} />
            </div>
          </Panel>
        </div>

        <Panel title="Custos por categoria">
          {top.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Nenhuma saída ainda.</p>
          ) : (
            <ul className="space-y-3">
              {top.map(([name, value]) => (
                <li key={name} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{name}</span>
                    <span className="shrink-0 tabular-nums text-slate-600">{brl(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-100">
                    <div
                      className="h-full origin-left animate-gtg-fill rounded-full bg-sun-400"
                      style={{ width: `${topMax ? (value / topMax) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <MovementGrid entries={entries} categories={categories} projects={projects} today={todayBR()} />
    </div>
  );
}
