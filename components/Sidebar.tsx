"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { roleLabel, type Role } from "@/lib/types";

const links = [
  { href: "/", label: "Painel", adminOnly: false },
  { href: "/products", label: "Produtos", adminOnly: false },
  { href: "/movements", label: "Movimentações", adminOnly: false },
  { href: "/users", label: "Usuários", adminOnly: true },
];

export default function Sidebar({ user }: { user: { name: string; role: Role } }) {
  const pathname = usePathname();
  const visible = links.filter((l) => !l.adminOnly || user.role === "ADMIN");

  return (
    <aside className="flex w-full shrink-0 flex-row items-center gap-1 border-b border-slate-200 bg-white px-4 py-3 md:min-h-screen md:w-60 md:flex-col md:items-stretch md:gap-1 md:border-b-0 md:border-r md:px-4 md:py-6">
      <div className="mr-4 px-2 text-lg font-semibold tracking-tight text-slate-900 md:mb-6 md:mr-0">
        Estoque
      </div>

      <nav className="flex flex-row gap-1 md:flex-col">
        {visible.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-3 md:ml-0 md:mt-auto md:flex-col md:items-stretch md:gap-2 md:border-t md:border-slate-100 md:pt-4">
        <div className="hidden px-2 md:block">
          <p className="truncate text-sm font-medium text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-400">{roleLabel[user.role]}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
