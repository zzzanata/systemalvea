"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/auth/actions";
import Logo from "@/components/Logo";
import { CloseIcon, HistoryIcon, HomeIcon, MenuIcon, UsersIcon } from "@/components/Icons";
import { roleLabel, type Role } from "@/lib/types";

type Item = { href: string; label: string; icon: (p: { className?: string }) => React.ReactNode };
type Group = { title: string; items: Item[] };

// Dentista e recepção veem tudo. Os módulos novos entram aqui conforme ficam prontos.
const groups: Group[] = [
  {
    title: "Clínica",
    items: [{ href: "/", label: "Painel", icon: HomeIcon }],
  },
  {
    title: "Administração",
    items: [
      { href: "/historico", label: "Histórico", icon: HistoryIcon },
      { href: "/users", label: "Usuários", icon: UsersIcon },
    ],
  },
];

export default function Sidebar({ user }: { user: { name: string; role: Role } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <aside className="shrink-0 border-b border-sand-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-4 py-3 md:justify-start md:px-6 md:py-7">
        <Link href="/" onClick={() => setOpen(false)} aria-label="Alvéa Odontologia, ir ao painel">
          <Logo />
        </Link>
        <button
          type="button"
          className="rounded-lg p-2 text-ink-900 hover:bg-brand-50 md:hidden"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      <div className={`${open ? "flex" : "hidden"} flex-col md:flex md:min-h-0 md:flex-1 md:overflow-y-auto`}>
        <nav className="flex flex-col gap-5 px-3 pb-4">
          {groups.map((g) => (
            <div key={g.title} className="space-y-0.5">
              <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-ink-400">
                {g.title}
              </p>
              {g.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200"
                        : "text-ink-500 hover:bg-sand-50 hover:text-ink-900"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-brand-600" : "text-ink-400"}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-sand-200 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 font-serif text-base text-brand-800">
              {user.name.trim().charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-900">{user.name}</p>
              <p className="text-xs text-ink-500">{roleLabel[user.role]}</p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-500 hover:bg-brand-50 hover:text-brand-800"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
