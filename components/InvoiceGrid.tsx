"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import {
  createInvoice,
  deleteInvoice,
  setInvoicePaid,
  updateInvoice,
  type InvoiceInput,
} from "@/app/notas-fiscais/actions";
import Badge, { type BadgeTone } from "@/components/Badge";
import { CheckIcon, DownloadIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/Icons";
import { formatAccessKey, formatCnpj, normalizeAccessKey, shownStatus } from "@/lib/invoices";
import {
  brl,
  invoiceShownLabel,
  invoiceTypeLabel,
  type InvoiceRecord,
  type InvoiceShownStatus,
  type ProjectOption,
} from "@/lib/types";

type SortKey =
  | "issuedAt"
  | "type"
  | "number"
  | "description"
  | "amount"
  | "dueDate"
  | "status"
  | "sender"
  | "recipient"
  | "project";

const cols: { key: SortKey | null; label: string; cls: string }[] = [
  { key: "issuedAt", label: "Emissão", cls: "min-w-[125px]" },
  { key: "type", label: "Tipo", cls: "min-w-[105px]" },
  { key: "number", label: "Nº da nota", cls: "min-w-[110px]" },
  { key: null, label: "Chave de acesso", cls: "min-w-[170px]" },
  { key: "description", label: "Descrição", cls: "min-w-[230px]" },
  { key: "amount", label: "Valor", cls: "min-w-[130px] text-right" },
  { key: "dueDate", label: "Vencimento", cls: "min-w-[125px]" },
  { key: "status", label: "Status", cls: "min-w-[130px]" },
  { key: "sender", label: "Remetente", cls: "min-w-[240px]" },
  { key: "recipient", label: "Destinatário", cls: "min-w-[240px]" },
  { key: "project", label: "Obra", cls: "min-w-[160px]" },
];

const statusTone: Record<InvoiceShownStatus, BadgeTone> = {
  PENDING: "amber",
  PAID: "emerald",
  OVERDUE: "rose",
  CANCELED: "slate",
};

const cell =
  "w-full rounded border border-brand-300 bg-white px-2 py-1 text-xs outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-300";
const toolbarInput =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

const dmy = (d: string) => (d ? d.split("-").reverse().join("/") : "—");

type Draft = InvoiceInput;

function emptyDraft(today: string): Draft {
  return {
    type: "IN",
    number: "",
    accessKey: "",
    description: "",
    amount: "",
    issuedAt: today,
    dueDate: "",
    status: "PENDING",
    paidAt: "",
    senderName: "",
    senderCnpj: "",
    recipientName: "",
    recipientCnpj: "",
    projectId: "",
  };
}

function toDraft(r: InvoiceRecord): Draft {
  return {
    type: r.type,
    number: r.number,
    accessKey: r.accessKey,
    description: r.description,
    amount: String(r.amount).replace(".", ","),
    issuedAt: r.issuedAt,
    dueDate: r.dueDate,
    // Notas antigas "emitidas" ou "a emitir" contam como pendentes.
    status: r.status === "PAID" ? "PAID" : r.status === "CANCELED" ? "CANCELED" : "PENDING",
    paidAt: r.paidAt,
    senderName: r.senderName,
    senderCnpj: formatCnpj(r.senderCnpj),
    recipientName: r.recipientName,
    recipientCnpj: formatCnpj(r.recipientCnpj),
    projectId: r.projectId,
  };
}

function csvCell(v: string | number) {
  const s = String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function InvoiceGrid({
  invoices,
  projects,
  today,
}: {
  invoices: InvoiceRecord[];
  projects: ProjectOption[];
  today: string;
}) {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // id, "new" ou null
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(today));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [pending, startTransition] = useTransition();

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const termDigits = term.replace(/[^0-9a-z]/g, "");

    const list = invoices
      .map((r) => ({ r, shown: shownStatus(r.status, r.dueDate, today) }))
      .filter(({ r, shown }) => {
        if (typeFilter && r.type !== typeFilter) return false;
        if (statusFilter && shown !== statusFilter) return false;
        if (!term) return true;
        const text = [r.description, r.number, r.senderName, r.recipientName, r.projectName]
          .join(" ")
          .toLowerCase();
        const ids = (r.accessKey + r.senderCnpj + r.recipientCnpj).toLowerCase();
        return text.includes(term) || (termDigits.length >= 3 && ids.includes(termDigits));
      });

    if (sort) {
      const value = ({ r, shown }: (typeof list)[number]): string | number => {
        switch (sort.key) {
          case "issuedAt":
            return r.issuedAt;
          case "type":
            return r.type;
          case "number":
            return r.number;
          case "description":
            return r.description.toLowerCase();
          case "amount":
            return r.amount;
          case "dueDate":
            return r.dueDate;
          case "status":
            return shown;
          case "sender":
            return r.senderName.toLowerCase();
          case "recipient":
            return r.recipientName.toLowerCase();
          case "project":
            return r.projectName.toLowerCase();
        }
      };
      list.sort((a, b) => {
        const x = value(a);
        const y = value(b);
        // Vazios sempre no fim, qualquer que seja a direção.
        if (x === "" && y !== "") return 1;
        if (y === "" && x !== "") return -1;
        return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
      });
    }
    return list;
  }, [invoices, q, typeFilter, statusFilter, sort, today]);

  const totals = useMemo(() => {
    const t = { all: 0, paid: 0, pending: 0, overdue: 0 };
    for (const { r, shown } of rows) {
      if (shown === "CANCELED") continue;
      t.all += r.amount;
      if (shown === "PAID") t.paid += r.amount;
      else if (shown === "OVERDUE") t.overdue += r.amount;
      else t.pending += r.amount;
    }
    return t;
  }, [rows]);

  function toggleSort(key: SortKey) {
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));
  }

  function startNew() {
    setDraft(emptyDraft(today));
    setError("");
    setEditingId("new");
  }

  function startEdit(r: InvoiceRecord) {
    setDraft(toDraft(r));
    setError("");
    setEditingId(r.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setError("");
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function save() {
    setError("");
    startTransition(async () => {
      const result =
        editingId === "new" ? await createInvoice(draft) : await updateInvoice(editingId!, draft);
      if ("error" in result) setError(result.error);
      else setEditingId(null);
    });
  }

  function togglePaid(r: InvoiceRecord) {
    setError("");
    startTransition(async () => {
      const result = await setInvoicePaid(r.id, r.status !== "PAID");
      if ("error" in result) alert(result.error);
    });
  }

  function remove(r: InvoiceRecord) {
    const label = r.number ? `a nota ${r.number}` : `"${r.description}"`;
    if (!confirm(`Excluir ${label}? Essa ação não pode ser desfeita.`)) return;
    startTransition(async () => {
      const result = await deleteInvoice(r.id);
      if ("error" in result) alert(result.error);
    });
  }

  async function copyKey(key: string) {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* sem permissão de área de transferência: ignora */
    }
  }

  function exportCsv() {
    const head = [
      "Emissão", "Tipo", "Nº da nota", "Chave de acesso", "Descrição", "Valor", "Vencimento",
      "Status", "Data do pagamento", "Remetente", "CNPJ/CPF remetente", "Destinatário",
      "CNPJ/CPF destinatário", "Obra",
    ];
    const lines = rows.map(({ r, shown }) =>
      [
        dmy(r.issuedAt), invoiceTypeLabel[r.type], r.number, r.accessKey, r.description,
        r.amount.toFixed(2).replace(".", ","), dmy(r.dueDate), invoiceShownLabel[shown],
        dmy(r.paidAt), r.senderName, formatCnpj(r.senderCnpj), r.recipientName,
        formatCnpj(r.recipientCnpj), r.projectName,
      ]
        .map(csvCell)
        .join(";"),
    );
    // BOM + ponto e vírgula: o Excel em português abre com acentos e colunas certas.
    const blob = new Blob(["﻿" + [head.join(";"), ...lines].join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `notas-fiscais-${today}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName === "INPUT") {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") cancelEdit();
  }

  const editing = editingId !== null;

  function EditRow() {
    return (
      <>
        <tr className="bg-brand-50/60" onKeyDown={onKey}>
          <td className="px-2 py-2">
            <input type="date" value={draft.issuedAt} onChange={(e) => set("issuedAt", e.target.value)} className={cell} aria-label="Data de emissão" />
          </td>
          <td className="px-2 py-2">
            <select value={draft.type} onChange={(e) => set("type", e.target.value)} className={cell} aria-label="Tipo">
              <option value="IN">Entrada</option>
              <option value="OUT">Saída</option>
            </select>
          </td>
          <td className="px-2 py-2">
            <input value={draft.number} onChange={(e) => set("number", e.target.value)} className={cell} placeholder="Nº" aria-label="Número da nota" />
          </td>
          <td className="px-2 py-2">
            <input
              value={formatAccessKey(draft.accessKey)}
              onChange={(e) => set("accessKey", normalizeAccessKey(e.target.value))}
              className={`${cell} font-mono`}
              placeholder="Chave ou código"
              aria-label="Chave de acesso"
            />
          </td>
          <td className="px-2 py-2">
            <input value={draft.description} onChange={(e) => set("description", e.target.value)} className={cell} placeholder="Descrição breve" aria-label="Descrição" autoFocus />
          </td>
          <td className="px-2 py-2">
            <input value={draft.amount} onChange={(e) => set("amount", e.target.value)} inputMode="decimal" className={`${cell} text-right`} placeholder="0,00" aria-label="Valor" />
          </td>
          <td className="px-2 py-2">
            <input type="date" value={draft.dueDate} onChange={(e) => set("dueDate", e.target.value)} className={cell} aria-label="Vencimento" />
          </td>
          <td className="px-2 py-2">
            <select value={draft.status} onChange={(e) => set("status", e.target.value)} className={cell} aria-label="Status">
              <option value="PENDING">Pendente</option>
              <option value="PAID">Pago</option>
              <option value="CANCELED">Cancelada</option>
            </select>
            {draft.status === "PAID" && (
              <input type="date" value={draft.paidAt} onChange={(e) => set("paidAt", e.target.value)} className={`${cell} mt-1`} aria-label="Data do pagamento" title="Data do pagamento (vazio = hoje)" />
            )}
          </td>
          <td className="space-y-1 px-2 py-2">
            <input value={draft.senderName} onChange={(e) => set("senderName", e.target.value)} className={cell} placeholder="Razão social" aria-label="Razão social do remetente" />
            <input value={draft.senderCnpj} onChange={(e) => set("senderCnpj", formatCnpj(e.target.value))} className={`${cell} font-mono`} placeholder="CNPJ/CPF" aria-label="CNPJ/CPF do remetente" />
          </td>
          <td className="space-y-1 px-2 py-2">
            <input value={draft.recipientName} onChange={(e) => set("recipientName", e.target.value)} className={cell} placeholder="Razão social" aria-label="Razão social do destinatário" />
            <input value={draft.recipientCnpj} onChange={(e) => set("recipientCnpj", formatCnpj(e.target.value))} className={`${cell} font-mono`} placeholder="CNPJ/CPF" aria-label="CNPJ/CPF do destinatário" />
          </td>
          <td className="px-2 py-2">
            <select value={draft.projectId} onChange={(e) => set("projectId", e.target.value)} className={cell} aria-label="Obra">
              <option value="">Sem obra</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </td>
          <td className="sticky right-0 bg-brand-50 px-2 py-2 shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)]">
            <div className="flex flex-col gap-1">
              <button type="button" onClick={save} disabled={pending} className="rounded bg-brand-900 px-2 py-1 text-xs font-medium text-white hover:bg-brand-800 disabled:opacity-60">
                {pending ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" onClick={cancelEdit} disabled={pending} className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </td>
        </tr>
        {error && (
          <tr className="bg-brand-50/60">
            <td colSpan={cols.length + 1} className="px-3 pb-2 text-xs text-red-600">{error}</td>
          </tr>
        )}
      </>
    );
  }

  const arrow = (key: SortKey) => (sort?.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : "");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por descrição, nº, chave, CNPJ/CPF, razão social..."
          className={`${toolbarInput} min-w-0 flex-1 basis-64`}
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={toolbarInput} aria-label="Filtrar por tipo">
          <option value="">Entrada e saída</option>
          <option value="IN">Só entradas</option>
          <option value="OUT">Só saídas</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={toolbarInput} aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="OVERDUE">Vencido</option>
          <option value="PAID">Pago</option>
          <option value="CANCELED">Cancelada</option>
        </select>
        <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" title="Baixa as linhas filtradas para abrir no Excel">
          <DownloadIcon className="h-4 w-4" /> Exportar
        </button>
        <button type="button" onClick={startNew} disabled={editing} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
          <PlusIcon className="h-4 w-4" /> Nova nota
        </button>
      </div>

      <p className="text-xs text-slate-400 lg:hidden">Arraste a tabela para o lado para ver todas as colunas.</p>

      <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[1900px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-brand-900 text-xs uppercase tracking-wide text-white">
            <tr>
              {cols.map((c) => (
                <th key={c.label} className={`px-3 py-2.5 font-medium ${c.cls}`}>
                  {c.key ? (
                    <button type="button" onClick={() => toggleSort(c.key!)} className="uppercase tracking-wide hover:text-sun-400">
                      {c.label}
                      {arrow(c.key)}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
              <th className="sticky right-0 min-w-[120px] bg-brand-900 px-3 py-2.5 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {editingId === "new" && EditRow()}

            {rows.map(({ r, shown }) =>
              editingId === r.id ? (
                <Fragment key={r.id}>{EditRow()}</Fragment>
              ) : (
                <tr key={r.id} className={`group hover:bg-slate-50 ${shown === "CANCELED" ? "text-slate-400" : ""}`}>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{dmy(r.issuedAt)}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={r.type === "IN" ? "brand" : "slate"}>{invoiceTypeLabel[r.type]}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{r.number || "—"}</td>
                  <td className="px-3 py-2.5">
                    {r.accessKey ? (
                      <button type="button" onClick={() => copyKey(r.accessKey)} title={`${formatAccessKey(r.accessKey)} (clique para copiar)`} className="font-mono text-xs text-slate-600 hover:text-brand-900">
                        {copied === r.accessKey ? "copiado ✓" : `${r.accessKey.slice(0, 4)}…${r.accessKey.slice(-6)}`}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[300px] px-3 py-2.5">
                    <p className={`truncate font-medium ${shown === "CANCELED" ? "line-through" : ""}`} title={r.description}>{r.description}</p>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums">{brl(r.amount)}</td>
                  <td className={`whitespace-nowrap px-3 py-2.5 tabular-nums ${shown === "OVERDUE" ? "font-medium text-red-600" : ""}`}>{dmy(r.dueDate)}</td>
                  <td className="px-3 py-2.5">
                    <span title={r.paidAt ? `Pago em ${dmy(r.paidAt)}` : undefined}>
                      <Badge tone={statusTone[shown]}>{invoiceShownLabel[shown]}</Badge>
                    </span>
                  </td>
                  <td className="max-w-[260px] px-3 py-2.5">
                    <p className="truncate" title={r.senderName}>{r.senderName || "—"}</p>
                    {r.senderCnpj && <p className="font-mono text-[11px] text-slate-400">{formatCnpj(r.senderCnpj)}</p>}
                  </td>
                  <td className="max-w-[260px] px-3 py-2.5">
                    <p className="truncate" title={r.recipientName}>{r.recipientName || "—"}</p>
                    {r.recipientCnpj && <p className="font-mono text-[11px] text-slate-400">{formatCnpj(r.recipientCnpj)}</p>}
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-2.5 text-slate-600" title={r.projectName}>{r.projectName || "—"}</td>
                  <td className="sticky right-0 bg-white px-3 py-2.5 shadow-[-6px_0_6px_-6px_rgba(0,0,0,0.15)] group-hover:bg-slate-50">
                    <div className="flex items-center gap-1">
                      {shown !== "CANCELED" && (
                        <button
                          type="button"
                          onClick={() => togglePaid(r)}
                          disabled={pending || editing}
                          title={r.status === "PAID" ? "Voltar para pendente" : "Marcar como pago"}
                          className={`rounded p-1.5 disabled:opacity-40 ${r.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"}`}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button type="button" onClick={() => startEdit(r)} disabled={pending || editing} title="Editar" className="rounded p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-900 disabled:opacity-40">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => remove(r)} disabled={pending || editing} title="Excluir" className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}

            {rows.length === 0 && editingId !== "new" && (
              <tr>
                <td colSpan={cols.length + 1} className="px-4 py-12 text-center text-slate-400">
                  {invoices.length === 0
                    ? 'Nenhuma nota cadastrada ainda. Clique em "Nova nota" para começar.'
                    : "Nenhuma nota encontrada com esses filtros."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm sm:grid-cols-5">
        <Stat label="Notas na tela" value={String(rows.length)} />
        <Stat label="Valor total" value={brl(totals.all)} />
        <Stat label="Pago" value={brl(totals.paid)} tone="text-emerald-600" />
        <Stat label="Pendente" value={brl(totals.pending)} tone="text-sun-700" />
        <Stat label="Vencido" value={brl(totals.overdue)} tone="text-red-600" />
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "text-brand-900" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`truncate font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
