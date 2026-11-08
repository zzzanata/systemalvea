"use client";

import { useMemo, useState, useTransition } from "react";
import { assignCities } from "@/app/notas-fiscais/actions";
import InvoiceGrid from "@/components/InvoiceGrid";
import InvoiceRings from "@/components/InvoiceRings";
import Panel from "@/components/Panel";
import { cityKey, guessCity, listCities, NO_CITY } from "@/lib/cities";
import { summarizeInvoices } from "@/lib/invoices";
import { brl, type InvoiceRecord, type ProjectOption } from "@/lib/types";

const ALL = "__all__";

// Notas separadas por cidade: uma aba por cidade (mais "Todas" e "Sem cidade").
// Anéis, totais e tabela mostram só a cidade da aba aberta.
export default function InvoicesView({
  invoices,
  projects,
  today,
}: {
  invoices: InvoiceRecord[];
  projects: ProjectOption[];
  today: string;
}) {
  const [tab, setTab] = useState(ALL);
  const [pending, startTransition] = useTransition();

  const cityTabs = useMemo(() => listCities(invoices), [invoices]);
  const cityNames = useMemo(() => cityTabs.map((c) => c.label), [cityTabs]);
  const untagged = useMemo(() => invoices.filter((i) => !i.city), [invoices]);

  // Aba que sumiu (ex.: a última nota daquela cidade mudou de cidade) volta para "Todas".
  const active =
    tab === ALL || (tab === NO_CITY && untagged.length > 0) || cityTabs.some((c) => c.key === tab) ? tab : ALL;

  const shown = useMemo(() => {
    if (active === ALL) return invoices;
    if (active === NO_CITY) return untagged;
    return invoices.filter((i) => i.city && cityKey(i.city) === active);
  }, [invoices, untagged, active]);

  const summary = useMemo(() => summarizeInvoices(shown, today), [shown, today]);
  const activeLabel =
    active === ALL ? "" : active === NO_CITY ? "Sem cidade" : (cityTabs.find((c) => c.key === active)?.label ?? "");

  const totalOf = (list: InvoiceRecord[]) => list.reduce((t, i) => t + (i.status === "CANCELED" ? 0 : i.amount), 0);

  // Sugestões: notas sem cidade cuja descrição cita uma cidade já cadastrada.
  const suggestions = useMemo(() => {
    const byCity = new Map<string, string[]>();
    for (const i of untagged) {
      const g = guessCity(i.description, cityNames);
      if (!g) continue;
      byCity.set(g, [...(byCity.get(g) ?? []), i.id]);
    }
    return [...byCity.entries()].map(([city, ids]) => ({ city, ids }));
  }, [untagged, cityNames]);
  const suggestionCount = suggestions.reduce((t, s) => t + s.ids.length, 0);

  function applySuggestions() {
    const lines = suggestions.map((s) => `• ${s.ids.length} nota(s) → ${s.city}`).join("\n");
    if (!confirm(`Definir a cidade destas notas pela descrição?\n\n${lines}`)) return;
    startTransition(async () => {
      const r = await assignCities(suggestions);
      if ("error" in r) alert(r.error);
    });
  }

  const tabs: { key: string; label: string; count: number; total: number }[] = [
    { key: ALL, label: "Todas", count: invoices.length, total: totalOf(invoices) },
    ...cityTabs.map((c) => ({
      key: c.key,
      label: c.label,
      count: c.count,
      total: totalOf(invoices.filter((i) => i.city && cityKey(i.city) === c.key)),
    })),
    ...(untagged.length > 0 && cityTabs.length > 0
      ? [{ key: NO_CITY, label: "Sem cidade", count: untagged.length, total: totalOf(untagged) }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {tabs.length > 1 && (
        <nav aria-label="Cidades" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {tabs.map((t) => {
            const on = t.key === active;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-pressed={on}
                className={`group shrink-0 rounded-xl border px-3.5 py-2 text-left transition duration-200 ${
                  on
                    ? "border-brand-900 bg-brand-900 text-white shadow-md shadow-brand-900/20"
                    : "border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-sm"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] tabular-nums ${on ? "bg-white/20 text-white" : "bg-brand-50 text-brand-900"}`}
                  >
                    {t.count}
                  </span>
                </span>
                <span className={`block text-xs tabular-nums ${on ? "text-sun-200" : "text-slate-400"}`}>{brl(t.total)}</span>
              </button>
            );
          })}
        </nav>
      )}

      {cityTabs.length === 0 && invoices.length > 0 && (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Ainda não há cidades. Use <strong>Cidade em lote</strong> (filtre pela busca, por exemplo &quot;LARANJAL&quot;, e defina a cidade das notas
          que aparecerem) ou edite cada nota. As abas por cidade aparecem aqui.
        </p>
      )}

      {active !== NO_CITY && untagged.length > 0 && cityTabs.length > 0 && active === ALL && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-sun-50 px-4 py-2.5 text-sm text-sun-700">
          {untagged.length} nota(s) ainda sem cidade.
          {suggestionCount > 0 && (
            <button
              type="button"
              onClick={applySuggestions}
              disabled={pending}
              className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-brand-900 ring-1 ring-inset ring-sun-200 hover:bg-sun-100 disabled:opacity-50"
            >
              Sugerir cidade pela descrição ({suggestionCount})
            </button>
          )}
        </p>
      )}

      {active === NO_CITY && suggestionCount > 0 && (
        <p className="flex flex-wrap items-center gap-2 rounded-xl bg-sun-50 px-4 py-2.5 text-sm text-sun-700">
          {suggestionCount} de {untagged.length} notas citam uma cidade na descrição.
          <button
            type="button"
            onClick={applySuggestions}
            disabled={pending}
            className="rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-brand-900 ring-1 ring-inset ring-sun-200 hover:bg-sun-100 disabled:opacity-50"
          >
            Sugerir cidade pela descrição
          </button>
        </p>
      )}

      <Panel title={activeLabel ? `Situação das notas · ${activeLabel}` : "Situação das notas"}>
        <InvoiceRings key={active} summary={summary} />
      </Panel>

      <InvoiceGrid
        key={active}
        invoices={shown}
        allInvoices={invoices}
        projects={projects}
        today={today}
        cities={cityNames}
        defaultCity={active === ALL || active === NO_CITY ? "" : activeLabel}
      />
    </div>
  );
}
