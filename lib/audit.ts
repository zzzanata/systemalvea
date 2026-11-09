// Histórico de alterações. Toda Server Action que grava algo chama audit() dentro da
// mesma transação da gravação: ou ficam as duas coisas, ou nenhuma.
import type { Prisma } from "@/app/generated/prisma/client";
import type { CurrentUser } from "@/lib/types";

type Db = Pick<Prisma.TransactionClient, "auditLog">;

export type AuditEntity =
  | "user"
  | "patient"
  | "procedure"
  | "appointment"
  | "scheduleBlock"
  | "budget"
  | "receivable"
  | "payment"
  | "expense"
  | "expenseCategory";

export const entityLabel: Record<AuditEntity, string> = {
  user: "Usuário",
  patient: "Paciente",
  procedure: "Procedimento",
  appointment: "Consulta",
  scheduleBlock: "Bloqueio de agenda",
  budget: "Orçamento",
  receivable: "Conta a receber",
  payment: "Recebimento",
  expense: "Conta a pagar",
  expenseCategory: "Categoria de despesa",
};

/** Valores já prontos para leitura (ex.: "R$ 150,00", "12/03/2027"). */
export type Snapshot = Record<string, string | number | boolean | null | undefined>;

export type Changes = Record<string, { from: string; to: string }>;

const show = (v: Snapshot[string]) =>
  v === null || v === undefined || v === "" ? "—" : typeof v === "boolean" ? (v ? "Sim" : "Não") : String(v);

/**
 * Compara dois retratos do registro e devolve só o que mudou.
 * As chaves do retrato são os rótulos que aparecem na tela (ex.: "Telefone").
 */
export function diff(before: Snapshot, after: Snapshot): Changes {
  const out: Changes = {};
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const from = show(before[key]);
    const to = show(after[key]);
    if (from !== to) out[key] = { from, to };
  }
  return out;
}

/** Na criação/exclusão, guarda o retrato inteiro (de "—" para o valor, ou o contrário). */
function full(snapshot: Snapshot, side: "from" | "to"): Changes {
  const out: Changes = {};
  for (const [key, value] of Object.entries(snapshot)) {
    const v = show(value);
    if (v === "—") continue;
    out[key] = side === "to" ? { from: "—", to: v } : { from: v, to: "—" };
  }
  return out;
}

type Base = {
  user: CurrentUser;
  entity: AuditEntity;
  entityId: string;
  /** Como o registro é chamado na tela: nome do paciente, "Orçamento #12"... */
  label: string;
  /** Frase opcional; sem ela, uma frase padrão é montada. */
  summary?: string;
};

export async function auditCreate(db: Db, a: Base & { data: Snapshot }) {
  await db.auditLog.create({
    data: {
      userId: a.user.id,
      userName: a.user.name,
      action: "CREATE",
      entity: a.entity,
      entityId: a.entityId,
      entityLabel: a.label,
      summary: a.summary ?? `${entityLabel[a.entity]} criado(a): ${a.label}`,
      changes: full(a.data, "to"),
    },
  });
}

/** Registra uma edição. Se nada mudou de verdade, não grava nada. */
export async function auditUpdate(db: Db, a: Base & { before: Snapshot; after: Snapshot }) {
  const changes = diff(a.before, a.after);
  if (Object.keys(changes).length === 0 && !a.summary) return;
  await db.auditLog.create({
    data: {
      userId: a.user.id,
      userName: a.user.name,
      action: "UPDATE",
      entity: a.entity,
      entityId: a.entityId,
      entityLabel: a.label,
      summary: a.summary ?? `${entityLabel[a.entity]} alterado(a): ${a.label}`,
      changes,
    },
  });
}

export async function auditDelete(db: Db, a: Base & { data: Snapshot }) {
  await db.auditLog.create({
    data: {
      userId: a.user.id,
      userName: a.user.name,
      action: "DELETE",
      entity: a.entity,
      entityId: a.entityId,
      entityLabel: a.label,
      summary: a.summary ?? `${entityLabel[a.entity]} excluído(a): ${a.label}`,
      changes: full(a.data, "from"),
    },
  });
}
