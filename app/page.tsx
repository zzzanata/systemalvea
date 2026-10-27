import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { getMovements, getProducts } from "@/lib/data";
import { brl, stockStatus } from "@/lib/types";

const typeLabel = { IN: "Entrada", OUT: "Saída", ADJUSTMENT: "Ajuste" } as const;
const typeColor = {
  IN: "text-emerald-600",
  OUT: "text-red-600",
  ADJUSTMENT: "text-slate-600",
} as const;

async function DashboardContent() {
  // Marca o componente como dinâmico: lê do banco a cada acesso.
  await connection();

  const [products, movements] = await Promise.all([getProducts(), getMovements(5)]);

  const totalValue = products.reduce((s, p) => s + p.currentStock * p.costPrice, 0);
  const lowItems = products.filter((p) => stockStatus(p) === "low");
  const outItems = products.filter((p) => stockStatus(p) === "out");
  const attention = [...outItems, ...lowItems];

  return (
    <>
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Produtos ativos" value={products.length} />
        <StatCard label="Valor em estoque" value={brl(totalValue)} hint="a preço de custo" />
        <StatCard label="Estoque baixo" value={lowItems.length} tone="warn" />
        <StatCard label="Em falta" value={outItems.length} tone="danger" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-medium">Precisam de atenção</h2>
            <Link href="/products" className="text-sm text-slate-500 hover:text-slate-900">
              Ver produtos
            </Link>
          </div>
          {attention.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Nenhum produto abaixo do mínimo.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {attention.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-slate-400">
                      {p.currentStock} {p.unit} · mínimo {p.minStock}
                    </p>
                  </div>
                  <StatusBadge status={stockStatus(p)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-medium">Últimas movimentações</h2>
            <Link href="/movements" className="text-sm text-slate-500 hover:text-slate-900">
              Ver todas
            </Link>
          </div>
          {movements.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">
              Nenhuma movimentação ainda.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {movements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.productName}</p>
                    <p className="text-xs text-slate-400">
                      {m.reason} · {m.createdAt}
                    </p>
                  </div>
                  <span className={`shrink-0 text-sm font-medium ${typeColor[m.type]}`}>
                    {typeLabel[m.type]} {m.type === "OUT" || m.quantity < 0 ? "-" : "+"}
                    {Math.abs(m.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-sm text-slate-500">Visão geral do estoque</p>
      </header>

      <Suspense fallback={<p className="text-sm text-slate-400">Carregando...</p>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}