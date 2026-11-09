import Link from "next/link";
import AuditList from "@/components/AuditList";
import prisma from "@/lib/prisma";
import { entityLabel } from "@/lib/audit";
import { requireUser } from "@/lib/auth";
import { AUDIT_PAGE_SIZE, getAuditLog } from "@/lib/data";
import { auditActionLabel, type AuditAction } from "@/lib/types";
import { btnPrimary, btnSecondary, cardCls, inputCls, pageSubtitleCls, pageTitleCls } from "@/lib/ui";

export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const day = (s: string, addDays = 0) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  // Dias do filtro são dias de São Paulo (UTC-3).
  const d = new Date(`${s}T03:00:00Z`);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d;
};

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireUser();
  const sp = await searchParams;

  const filter = {
    userId: one(sp.user),
    entity: one(sp.tipo),
    action: (["CREATE", "UPDATE", "DELETE"].includes(one(sp.acao)) ? one(sp.acao) : undefined) as AuditAction | undefined,
    from: day(one(sp.de)),
    to: day(one(sp.ate), 1),
    q: one(sp.q).trim(),
  };
  const page = Math.max(1, Number(one(sp.p)) || 1);

  const [{ entries, total }, users] = await Promise.all([
    getAuditLog(filter, page),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const k of ["user", "tipo", "acao", "de", "ate", "q"]) if (one(sp[k])) params.set(k, one(sp[k]));
    params.set("p", String(p));
    return `/historico?${params}`;
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className={pageTitleCls}>Histórico de alterações</h1>
        <p className={pageSubtitleCls}>Tudo o que foi criado, alterado ou excluído no sistema, por quem e quando.</p>
      </header>

      <form method="get" className={`${cardCls} grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_0.9fr_0.9fr_auto]`}>
        <input name="q" defaultValue={one(sp.q)} placeholder="Buscar (nome, descrição...)" className={inputCls} />
        <select name="user" defaultValue={filter.userId} className={inputCls} aria-label="Usuário">
          <option value="">Todos os usuários</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select name="tipo" defaultValue={filter.entity} className={inputCls} aria-label="Tipo de registro">
          <option value="">Todos os tipos</option>
          {Object.entries(entityLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select name="acao" defaultValue={filter.action ?? ""} className={inputCls} aria-label="Ação">
          <option value="">Todas as ações</option>
          {Object.entries(auditActionLabel).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input type="date" name="de" defaultValue={one(sp.de)} className={inputCls} aria-label="De" />
        <input type="date" name="ate" defaultValue={one(sp.ate)} className={inputCls} aria-label="Até" />
        <div className="flex gap-2">
          <button className={btnPrimary}>Filtrar</button>
          <Link href="/historico" className={btnSecondary}>
            Limpar
          </Link>
        </div>
      </form>

      <section className="space-y-4">
        <p className="text-sm text-ink-500">
          {total} {total === 1 ? "alteração" : "alterações"}
        </p>
        <AuditList entries={entries} />
      </section>

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className={btnSecondary}>
              Anterior
            </Link>
          )}
          <span className="px-3 text-ink-500">
            Página {page} de {pages}
          </span>
          {page < pages && (
            <Link href={pageHref(page + 1)} className={btnSecondary}>
              Próxima
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
