import Link from "next/link";
import Badge from "@/components/Badge";
import FinanceChart from "@/components/FinanceChart";
import Panel from "@/components/Panel";
import ProgressRing from "@/components/ProgressRing";
import StatCard from "@/components/StatCard";
import { getCurrentUser } from "@/lib/auth";
import { getFinanceSeries, getInvoiceSummary, getProducts, getProjectSummaries } from "@/lib/data";
import {
  brl,
  stockStatus,
  type FinancePoint,
  type InvoiceSummary,
  type ProjectSummary,
} from "@/lib/types";

// Lê do banco a cada acesso (não gera a página estática no build).
export const dynamic = "force-dynamic";

const panelLink = "text-xs font-medium text-white/80 hover:text-white";

function ProjectsPanel({
  projects,
  wide,
  isAdmin,
}: {
  projects: ProjectSummary[];
  wide: boolean;
  isAdmin: boolean;
}) {
  // Em tela cheia (operador) cabem mais anéis por linha do que na coluna do meio de 3 painéis.
  const gridCls = wide
    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
    : "grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3";

  return (
    <Panel
      title="Evolução das obras"
      action={
        <Link href="/obras" className={panelLink}>
          Ver todas
        </Link>
      }
    >
      {projects.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">
          <p>Nenhuma obra cadastrada ainda.</p>
          {isAdmin && (
            <Link
              href="/obras/new"
              className="mt-3 inline-block rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
            >
              Cadastrar a primeira obra
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`grid gap-3 ${gridCls}`}>
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/obras/${p.id}`}
                className="flex flex-col items-center gap-2 rounded-lg p-2 text-center transition hover:bg-slate-50"
              >
                <ProgressRing percent={p.percent} className="h-24 w-24" />
                <div className="w-full min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="truncate text-xs text-slate-500">{p.location || "—"}</p>
                </div>
                {p.late && <Badge tone="rose">Atrasada</Badge>}
              </Link>
            ))}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              O que falta fazer
            </h3>
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
              {projects.map((p) => (
                <li key={p.id}>
                  <Link href={`/obras/${p.id}`} className="block px-3 py-2.5 hover:bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{p.name}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {p.done}/{p.total}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {p.percent >= 100
                        ? "Obra concluída"
                        : p.next.length > 0
                          ? `Próximas: ${p.next.join(" · ")}`
                          : "Sem tarefas cadastradas"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Panel>
  );
}

function FinancePanel({ data }: { data: FinancePoint[] }) {
  const revenue = data.reduce((s, d) => s + d.revenue, 0);
  const cost = data.reduce((s, d) => s + d.cost, 0);
  const result = revenue - cost;

  return (
    <Panel
      title="Faturamento e custos"
      action={
        <Link href="/financeiro" className={panelLink}>
          Lançamentos
        </Link>
      }
    >
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

        <FinanceChart data={data} />

        <div className="flex items-center justify-center gap-5 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Faturamento
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Custos
          </span>
          <span>últimos {data.length} meses</span>
        </div>
      </div>
    </Panel>
  );
}

function Tile({
  label,
  value,
  sub,
  tone = "text-slate-900",
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function InvoicesPanel({ summary }: { summary: InvoiceSummary }) {
  return (
    <Panel
      title="Notas fiscais"
      action={
        <Link href="/notas-fiscais" className={panelLink}>
          Ver todas
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Tile label="Emitidas no mês" value={summary.issuedThisMonth} tone="text-emerald-600" />
          <Tile
            label="A emitir"
            value={summary.pendingCount}
            sub={summary.pendingCount > 0 ? brl(summary.pendingAmount) : undefined}
          />
          <Tile label="Atrasadas" value={summary.lateCount} tone="text-red-600" />
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Próximas a emitir
          </h3>
          {summary.next.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              Nenhuma nota pendente.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
              {summary.next.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{n.description}</p>
                    <p className="truncate text-xs text-slate-500">
                      {n.projectName || "Sem obra"} · vence {n.dueDate}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium">{brl(n.amount)}</p>
                    {n.late && <Badge tone="rose">Atrasada</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  // Faturamento e notas fiscais só aparecem para administradores.
  const [projects, products, finance, invoices] = await Promise.all([
    getProjectSummaries(),
    getProducts(),
    isAdmin ? getFinanceSeries(6) : Promise.resolve(null),
    isAdmin ? getInvoiceSummary() : Promise.resolve(null),
  ]);

  const stockValue = products.reduce((s, p) => s + p.currentStock * p.costPrice, 0);
  const lowItems = products.filter((p) => stockStatus(p) === "low");
  const outItems = products.filter((p) => stockStatus(p) === "out");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-sm text-slate-500">Andamento das obras, financeiro e estoque</p>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className={finance && invoices ? "" : "xl:col-span-3"}>
          <ProjectsPanel projects={projects} wide={!(finance && invoices)} isAdmin={isAdmin} />
        </div>
        {finance && <FinancePanel data={finance} />}
        {invoices && <InvoicesPanel summary={invoices} />}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Estoque</h2>
          <Link href="/products" className="text-sm text-slate-500 hover:text-slate-900">
            Ver produtos
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Produtos ativos" value={products.length} />
          <StatCard label="Valor em estoque" value={brl(stockValue)} hint="a preço de custo" />
          <StatCard label="Estoque baixo" value={lowItems.length} tone="warn" />
          <StatCard label="Em falta" value={outItems.length} tone="danger" />
        </div>
      </section>
    </div>
  );
}
