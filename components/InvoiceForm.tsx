"use client";

import { useRef, useState, useTransition } from "react";
import { createInvoice } from "@/app/notas-fiscais/actions";
import type { ProjectOption } from "@/lib/types";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function InvoiceForm({ projects }: { projects: ProjectOption[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createInvoice(data);
      if ("error" in result) {
        setMessage({ ok: false, text: result.error });
      } else {
        formRef.current?.reset();
        setMessage({ ok: true, text: "Nota registrada como \"a emitir\"." });
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="font-medium">Nova nota a emitir</h2>
        <p className="text-xs text-slate-400">Registre as notas que ainda precisam ser feitas.</p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Cliente ou serviço</span>
        <input
          name="description"
          required
          placeholder="Ex.: Medição 2 - Usina Rio"
          className={inputCls}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Valor (R$)</span>
          <input name="amount" inputMode="decimal" required placeholder="0,00" className={inputCls} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Emitir até</span>
          <input name="dueDate" type="date" className={inputCls} />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Obra (opcional)</span>
        <select name="projectId" defaultValue="" className={inputCls}>
          <option value="">Sem obra</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      {message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            message.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Registrar nota"}
      </button>
    </form>
  );
}
