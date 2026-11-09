// Consultas ao banco. Use apenas em Server Components e Server Actions.
import prisma from "@/lib/prisma";
import { entityLabel, type AuditEntity, type Changes } from "@/lib/audit";
import type { AppUser, AuditAction, AuditEntry } from "@/lib/types";

export const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

const dayFmtSP = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

// ---------- Usuários ----------

export async function getUsers(): Promise<AppUser[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: dayFmtSP.format(u.createdAt),
  }));
}

// ---------- Histórico ----------

export type AuditFilter = {
  userId?: string;
  entity?: string;
  entityId?: string;
  action?: AuditAction;
  from?: Date; // início do dia (inclusive)
  to?: Date; // fim do dia (exclusive)
  q?: string; // busca no nome do registro / resumo
};

export const AUDIT_PAGE_SIZE = 50;

export async function getAuditLog(
  filter: AuditFilter,
  page = 1,
): Promise<{ entries: AuditEntry[]; total: number }> {
  const where = {
    userId: filter.userId || undefined,
    entity: filter.entity || undefined,
    entityId: filter.entityId || undefined,
    action: filter.action || undefined,
    createdAt: filter.from || filter.to ? { gte: filter.from, lt: filter.to } : undefined,
    OR: filter.q
      ? [
          { entityLabel: { contains: filter.q, mode: "insensitive" as const } },
          { summary: { contains: filter.q, mode: "insensitive" as const } },
        ]
      : undefined,
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * AUDIT_PAGE_SIZE,
      take: AUDIT_PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    total,
    entries: rows.map((r) => ({
      id: r.id,
      createdAt: dateTimeFmt.format(r.createdAt),
      userName: r.userName,
      action: r.action,
      entity: r.entity,
      entityName: entityLabel[r.entity as AuditEntity] ?? r.entity,
      entityId: r.entityId,
      entityLabel: r.entityLabel,
      summary: r.summary,
      changes: Object.entries((r.changes ?? {}) as Changes).map(([field, c]) => ({
        field,
        from: c.from,
        to: c.to,
      })),
    })),
  };
}
