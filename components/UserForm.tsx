"use client";

import { useRef, useState, useTransition } from "react";
import { createUser, updateUser } from "@/app/users/actions";
import Badge from "@/components/Badge";
import { roleLabel, type AppUser } from "@/lib/types";
import { btnGhost, btnPrimary, btnSecondary, cardCls, inputCls, labelCls, labelTextCls, tableHeadCls } from "@/lib/ui";

type Msg = { ok: boolean; text: string } | null;

function Message({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <p className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {msg.text}
    </p>
  );
}

function RoleSelect({ defaultValue = "RECEPTION" }: { defaultValue?: string }) {
  return (
    <select name="role" defaultValue={defaultValue} className={inputCls}>
      <option value="RECEPTION">{roleLabel.RECEPTION}</option>
      <option value="DENTIST">{roleLabel.DENTIST}</option>
    </select>
  );
}

function NewUser() {
  const formRef = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const data = new FormData(e.currentTarget);
    start(async () => {
      const r = await createUser(data);
      if ("error" in r) setMsg({ ok: false, text: r.error });
      else {
        formRef.current?.reset();
        setMsg({ ok: true, text: "Usuário criado." });
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className={`${cardCls} space-y-4 p-6`}>
      <h2 className="font-serif text-xl font-light">Novo usuário</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          <span className={labelTextCls}>Nome</span>
          <input name="name" required className={inputCls} />
        </label>
        <label className={labelCls}>
          <span className={labelTextCls}>E-mail</span>
          <input name="email" type="email" required autoComplete="off" className={inputCls} />
        </label>
        <label className={labelCls}>
          <span className={labelTextCls}>Senha inicial</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
          <span className="block text-xs text-ink-400">Mínimo de 8 caracteres</span>
        </label>
        <label className={labelCls}>
          <span className={labelTextCls}>Perfil</span>
          <RoleSelect />
          <span className="block text-xs text-ink-400">Os dois perfis têm acesso total ao sistema</span>
        </label>
      </div>
      <Message msg={msg} />
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending ? "Criando..." : "Criar usuário"}
        </button>
      </div>
    </form>
  );
}

function EditRow({ user, isMe, onDone }: { user: AppUser; isMe: boolean; onDone: () => void }) {
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const data = new FormData(e.currentTarget);
    start(async () => {
      const r = await updateUser(user.id, data);
      if ("error" in r) setMsg({ ok: false, text: r.error });
      else onDone();
    });
  }

  return (
    <tr className="bg-brand-50/40">
      <td colSpan={5} className="px-4 py-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input name="name" defaultValue={user.name} required className={inputCls} aria-label="Nome" />
            <input name="email" type="email" defaultValue={user.email} required className={inputCls} aria-label="E-mail" />
            <RoleSelect defaultValue={user.role} />
            <input
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              placeholder="Nova senha (opcional)"
              className={inputCls}
              aria-label="Nova senha"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" name="active" defaultChecked={user.active} disabled={isMe} className="accent-brand-600" />
            Ativo (pode entrar no sistema)
            {isMe && <input type="hidden" name="active" value="on" />}
          </label>
          <Message msg={msg} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onDone} className={btnSecondary}>
              Cancelar
            </button>
            <button type="submit" disabled={pending} className={btnPrimary}>
              {pending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}

export default function UserManager({ users, meId }: { users: AppUser[]; meId: string }) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <>
      <NewUser />
      <div className={`${cardCls} overflow-x-auto`}>
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className={tableHeadCls}>
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {users.map((u) =>
              editing === u.id ? (
                <EditRow key={u.id} user={u} isMe={u.id === meId} onDone={() => setEditing(null)} />
              ) : (
                <tr key={u.id} className="hover:bg-sand-50">
                  <td className="px-4 py-3 font-medium">
                    {u.name} {!u.active && <Badge tone="slate">Inativo</Badge>}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{u.email}</td>
                  <td className="px-4 py-3 text-ink-500">{roleLabel[u.role]}</td>
                  <td className="px-4 py-3 text-ink-400">{u.createdAt}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => setEditing(u.id)} className={btnGhost}>
                      Editar
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
