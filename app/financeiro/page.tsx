import DeleteEntryButton from "@/components/DeleteEntryButton";
import FinanceChart from "@/components/FinanceChart";
import FinanceForm from "@/components/FinanceForm";
import { requireAdmin } from "@/lib/auth";
import { todayBR } from "@/lib/dates";
import { getFinanceEntries, getFinanceSeries, getProjectOptions } from "@/lib/data";
import { brl } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requireAdmin();

  const [series, entries, projects] = await Promise.all([
    getFinanceSeries(6),
    getFinanceEntries(100),
    getProjectOptions(),
  ]);

  const revenue = series.reduce((s, d) => s + d.revenue, 0);
  const cost = series.reduce((s, d) => s + d.cost, 0);
  const result = revenue - cost;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Faturamento e custos</h1>
        <p className="text-sm text-slate-500">Entradas e saídas de dinheiro, mês a mês</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Faturamento</p>
                <p className="font-semibold text-emerald-600">{brl(revenue)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Custos</p>
                <p className="font-semibold text-red-600">{brl(cost)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">Resultado</p>
                <p className={`font-semibold ${result >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {brl(result)}
                </p>
              </div>
            </div>
            <FinanceChart data={series} />
            <p className="text-center text-xs text-slate-400">Últimos 6 meses</p>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
              Lançamentos recentes
            </h2>
            {entries.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">
                Nenhum lançamento ainda.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {entries.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        e.type === "REVENUE" ? "bg-emerald-500" : "bg-red-500"
                      }`}
                      aria-label={e.type === "REVENUE" ? "Faturamento" : "Custo"}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.description}</p>
                      <p className="truncate text-xs text-slate-500">
                        {e.date}
                        {e.projectName ? ` · ${e.projectName}` : ""}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        e.type === "REVENUE" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {e.type === "REVENUE" ? "+" : "-"}
                      {brl(e.amount)}
                    </p>
                    <DeleteEntryButton entryId={e.id} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <FinanceForm projects={projects} today={todayBR()} />
      </div>
    </div>
  );
}
