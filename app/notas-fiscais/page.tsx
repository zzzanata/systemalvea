import Badge from "@/components/Badge";
import InvoiceActions from "@/components/InvoiceActions";
import InvoiceForm from "@/components/InvoiceForm";
import { requireAdmin } from "@/lib/auth";
import { todayBR } from "@/lib/dates";
import { getInvoices, getProjectOptions } from "@/lib/data";
import { brl, invoiceStatusLabel, type InvoiceItem } from "@/lib/types";

export const dynamic = "force-dynamic";

function InvoiceRow({ invoice: n, today }: { invoice: InvoiceItem; today: string }) {
  const tone =
    n.status === "ISSUED" ? "emerald" : n.status === "CANCELED" ? "slate" : n.late ? "rose" : "amber";

  return (
    <li className="space-y-2 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate text-sm font-medium ${n.status === "CANCELED" ? "text-slate-400 line-through" : ""}`}>
            {n.description}
          </p>
          <p className="truncate text-xs text-slate-500">
            {n.projectName || "Sem obra"}
            {n.number ? ` · Nota ${n.number}` : ""}
            {n.status === "ISSUED" ? ` · emitida em ${n.issuedAt}` : ""}
            {n.status === "PENDING" && n.dueDate !== "—" ? ` · emitir até ${n.dueDate}` : ""}
          </p>
        </div>
        <div className="shrink-0 space-y-1 text-right">
          <p className="text-sm font-semibold tabular-nums">{brl(n.amount)}</p>
          <Badge tone={tone}>{n.late ? "Atrasada" : invoiceStatusLabel[n.status]}</Badge>
        </div>
      </div>
      {n.status === "PENDING" && <InvoiceActions invoiceId={n.id} today={today} />}
    </li>
  );
}

export default async function InvoicesPage() {
  await requireAdmin();

  const [invoices, projects] = await Promise.all([getInvoices(), getProjectOptions()]);
  const today = todayBR();

  const pending = invoices.filter((i) => i.status === "PENDING");
  const issued = invoices.filter((i) => i.status === "ISSUED");
  const canceled = invoices.filter((i) => i.status === "CANCELED");
  const late = pending.filter((i) => i.late).length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notas fiscais</h1>
        <p className="text-sm text-slate-500">
          {pending.length} a emitir{late > 0 ? ` (${late} atrasadas)` : ""} · {issued.length} emitidas
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 bg-sun-50 px-4 py-2.5 text-sm font-semibold text-sun-700">
              A emitir ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Nenhuma nota pendente.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pending.map((n) => (
                  <InvoiceRow key={n.id} invoice={n} today={today} />
                ))}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <h2 className="border-b border-slate-100 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800">
              Emitidas ({issued.length})
            </h2>
            {issued.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                Nenhuma nota emitida ainda.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {issued.map((n) => (
                  <InvoiceRow key={n.id} invoice={n} today={today} />
                ))}
              </ul>
            )}
          </section>

          {canceled.length > 0 && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <h2 className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600">
                Canceladas ({canceled.length})
              </h2>
              <ul className="divide-y divide-slate-100">
                {canceled.map((n) => (
                  <InvoiceRow key={n.id} invoice={n} today={today} />
                ))}
              </ul>
            </section>
          )}
        </div>

        <InvoiceForm projects={projects} />
      </div>
    </div>
  );
}
