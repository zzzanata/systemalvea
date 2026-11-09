"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/auth/actions";

const inputCls =
  "peer w-full rounded-2xl border border-sand-200 bg-white px-3.5 py-2.5 text-sm outline-none transition duration-200 placeholder:text-ink-400/60 hover:border-brand-300 focus:border-brand-500 focus:shadow-[0_0_0_4px_rgba(91,138,124,0.15)]";

const Eye = ({ off }: { off: boolean }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink-700">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue={state?.email}
          placeholder="voce@alvea.com.br"
          className={inputCls}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-ink-700">Senha</span>
        <span className="relative block">
          <input
            name="password"
            type={show ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={`${inputCls} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 transition hover:bg-brand-50 hover:text-brand-800"
          >
            <Eye off={show} />
          </button>
        </span>
      </label>

      {state?.error && (
        // key = mensagem: a animação de tremida repete a cada nova tentativa errada.
        <p key={state.error + (state.email ?? "")} role="alert" className="animate-av-shake rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-medium text-sand-50 shadow-lg shadow-brand-900/20 transition duration-300 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-900/25 disabled:opacity-70"
      >
        {/* Reflexo que passa no botão ao passar o mouse */}
        <span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-transform duration-700 group-hover:translate-x-[420%] group-hover:opacity-100" />
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-brand-300" />
            Entrando...
          </>
        ) : (
          <>
            Entrar
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </>
        )}
      </button>
    </form>
  );
}
