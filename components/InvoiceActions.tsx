"use client";

import { useState, useTransition } from "react";
import { cancelInvoice, markInvoiceIssued } from "@/app/notas-fiscais/actions";

const inputCls =
  "rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

// Botões de uma nota "a emitir": marcar como emitida (com número e data) ou cancelar.
export default function InvoiceActions({ invoiceId, today }: { invoiceId: string; today: string }) {
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [day, setDay] = useState(today);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function issue() {
    setError("");
    startTransition(async () => {
      const result = await markInvoiceIssued(invoiceId, number, day);
      if ("error" in result) setError(result.error);
      else setOpen(false);
    });
  }

  function cancel() {
    if (!confirm("Cancelar esta nota? Ela deixa de aparecer como pendente.")) return;
    setError("");
    startTransition(async () => {
      const result = await cancelInvoice(invoiceId);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      {!open ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            Marcar como emitida
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar nota
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1">
            <span className="block text-[11px] text-slate-500">Número da nota</span>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Opcional"
              className={`${inputCls} w-32`}
            />
          </label>
          <label className="space-y-1">
            <span className="block text-[11px] text-slate-500">Emitida em</span>
            <input type="date" value={day} onChange={(e) => setDay(e.target.value)} className={inputCls} />
          </label>
          <button
            type="button"
            onClick={issue}
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Salvando..." : "Confirmar"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            Voltar
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
