"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createMovement } from "@/app/actions";
import type { MovementType, Product } from "@/lib/types";

type ProductOption = Pick<Product, "id" | "sku" | "name" | "unit" | "currentStock">;

const reasons: Record<MovementType, string[]> = {
  IN: ["Compra", "Devolução", "Produção"],
  OUT: ["Venda", "Uso interno", "Perda"],
  ADJUSTMENT: ["Inventário", "Correção"],
};

const typeOptions: { value: MovementType; label: string }[] = [
  { value: "IN", label: "Entrada" },
  { value: "OUT", label: "Saída" },
  { value: "ADJUSTMENT", label: "Ajuste" },
];

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function MovementForm({ products }: { products: ProductOption[] }) {
  const [type, setType] = useState<MovementType>("IN");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Nenhum produto cadastrado ainda.{" "}
        <Link href="/products/new" className="font-medium text-slate-900 underline">
          Cadastre um produto
        </Link>{" "}
        antes de lançar movimentações.
      </div>
    );
  }

  const product = products.find((p) => p.id === productId);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const qty = parseFloat(quantity.replace(",", "."));
    if (Number.isNaN(qty) || qty === 0) {
      setError("Informe uma quantidade válida.");
      return;
    }
    if (type !== "ADJUSTMENT" && qty < 0) {
      setError("Em entrada e saída a quantidade deve ser positiva.");
      return;
    }
    if (type === "OUT" && product && qty > product.currentStock) {
      setError(`Saldo insuficiente: há apenas ${product.currentStock} ${product.unit}.`);
      return;
    }

    const data = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createMovement(data);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-100 p-1">
        {typeOptions.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setType(o.value)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              type === o.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Produto</span>
        <select
          name="productId"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className={inputCls}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} · {p.name}
            </option>
          ))}
        </select>
        {product && (
          <span className="block text-xs text-slate-400">
            Saldo atual: {product.currentStock} {product.unit}
          </span>
        )}
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Quantidade</span>
          <input
            name="quantity"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={type === "ADJUSTMENT" ? "Ex.: -3 ou 5" : "Ex.: 10"}
            className={inputCls}
          />
          {type === "ADJUSTMENT" && (
            <span className="block text-xs text-slate-400">
              No ajuste, use número negativo para reduzir o saldo.
            </span>
          )}
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Motivo</span>
          <select name="reason" className={inputCls} key={type}>
            {reasons[type].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Observação (opcional)</span>
        <textarea name="note" rows={3} className={inputCls} />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Link
          href="/movements"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "Registrando..." : "Registrar"}
        </button>
      </div>
    </form>
  );
}
