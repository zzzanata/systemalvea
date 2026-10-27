"use client";

import { useActionState } from "react";
import { login } from "@/app/auth/actions";

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state?.email}
          className={inputCls}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Senha</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={inputCls}
        />
      </label>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
