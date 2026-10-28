// Regras puras das notas fiscais (sem Next/Prisma): usadas no servidor e no navegador.
import type { InvoiceRecord, InvoiceShownStatus, InvoiceStatus, InvoiceSummary } from "@/lib/types";

/** Status mostrado na tela. "Vencido" não é gravado: sai do vencimento + hoje (AAAA-MM-DD). */
export function shownStatus(
  status: InvoiceStatus,
  dueDate: string,
  today: string,
): InvoiceShownStatus {
  if (status === "PAID") return "PAID";
  if (status === "CANCELED") return "CANCELED";
  if (dueDate && dueDate < today) return "OVERDUE";
  return "PENDING";
}

/** Só letras e números, maiúsculas (o CNPJ alfanumérico já existe desde 2026). */
const clean = (v: string, max: number) =>
  v.replace(/[^0-9a-zA-Z]/g, "").toUpperCase().slice(0, max);

export const normalizeCnpj = (v: string) => clean(v, 14);
export const normalizeAccessKey = (v: string) => clean(v, 44);

/** 12345678000190 -> 12.345.678/0001-90 (também enquanto digita). */
export function formatCnpj(v: string): string {
  const d = normalizeCnpj(v);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "." + d.slice(2, 5);
  if (d.length > 5) out += "." + d.slice(5, 8);
  if (d.length > 8) out += "/" + d.slice(8, 12);
  if (d.length > 12) out += "-" + d.slice(12, 14);
  return out;
}

/** Chave de acesso em blocos de 4 dígitos, como aparece na DANFE. */
export const formatAccessKey = (v: string) => normalizeAccessKey(v).replace(/(.{4})(?=.)/g, "$1 ");

export function summarizeInvoices(records: InvoiceRecord[], today: string): InvoiceSummary {
  const active = records.filter((r) => r.status !== "CANCELED");
  const sum = (list: InvoiceRecord[]) => list.reduce((s, r) => s + r.amount, 0);
  const group = (key: string, label: string, paidLabel: string, list: InvoiceRecord[]) => {
    const total = sum(list);
    const paid = sum(list.filter((r) => r.status === "PAID"));
    return {
      key,
      label,
      paidLabel,
      count: list.length,
      total,
      paid,
      percent: total > 0 ? Math.round((paid / total) * 100) : 0,
    };
  };

  const open = active.filter((r) => r.status !== "PAID");
  const overdue = open.filter((r) => shownStatus(r.status, r.dueDate, today) === "OVERDUE");
  const pending = open.filter((r) => shownStatus(r.status, r.dueDate, today) === "PENDING");

  return {
    groups: [
      group("all", "Todas", "pagas", active),
      group("out", "Saídas", "recebidas", active.filter((r) => r.type === "OUT")),
      group("in", "Entradas", "pagas", active.filter((r) => r.type === "IN")),
    ],
    paidAmount: sum(active.filter((r) => r.status === "PAID")),
    paidCount: active.length - open.length,
    pendingAmount: sum(pending),
    pendingCount: pending.length,
    overdueAmount: sum(overdue),
    overdueCount: overdue.length,
    next: [...open]
      .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"))
      .slice(0, 5)
      .map((r) => ({ ...r, shown: shownStatus(r.status, r.dueDate, today) })),
  };
}
