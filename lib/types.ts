export type Role = "DENTIST" | "RECEPTION";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export const roleLabel: Record<Role, string> = {
  DENTIST: "Dentista",
  RECEPTION: "Recepção",
};

export const auditActionLabel: Record<AuditAction, string> = {
  CREATE: "Criou",
  UPDATE: "Alterou",
  DELETE: "Excluiu",
};

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string; // já formatado
};

export type AuditEntry = {
  id: string;
  createdAt: string; // já formatado (data e hora de São Paulo)
  userName: string;
  action: AuditAction;
  entity: string;
  entityName: string; // "Paciente", "Orçamento"...
  entityId: string;
  entityLabel: string;
  summary: string;
  changes: { field: string; from: string; to: string }[];
};

// ---------- Resultados de ações ----------

// Ações que terminam em redirecionamento devolvem undefined no sucesso.
export type ActionResult = { error: string } | undefined;

// Ações que ficam na mesma página devolvem sucesso explícito.
export type MutationResult = { error: string } | { success: true };

export type LoginState = { error: string; email?: string } | undefined;

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
