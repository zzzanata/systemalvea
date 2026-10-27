export type MovementType = "IN" | "OUT" | "ADJUSTMENT";
export type StockStatus = "ok" | "low" | "out";
export type Role = "ADMIN" | "OPERATOR";

export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "DONE";
export type TaskStatus = "TODO" | "DOING" | "DONE";
export type MemberRole = "LEAD" | "MEMBER";
export type EntryType = "REVENUE" | "COST";
export type InvoiceStatus = "PENDING" | "ISSUED" | "CANCELED";

export const roleLabel: Record<Role, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
};

export const projectStatusLabel: Record<ProjectStatus, string> = {
  ACTIVE: "Em andamento",
  ON_HOLD: "Pausada",
  DONE: "Concluída",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  TODO: "Pendente",
  DOING: "Em andamento",
  DONE: "Concluída",
};

export const memberRoleLabel: Record<MemberRole, string> = {
  LEAD: "Líder da obra",
  MEMBER: "Equipe",
};

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  PENDING: "A emitir",
  ISSUED: "Emitida",
  CANCELED: "Cancelada",
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
  createdAt: string; // já formatado
};

export type Category = {
  id: string;
  name: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  currentStock: number;
  active: boolean;
};

export type Movement = {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  reason: string;
  user: string;
  createdAt: string; // já formatado (fuso de São Paulo)
};

// ---------- Obras ----------

export type ProjectSummary = {
  id: string;
  name: string;
  location: string;
  status: ProjectStatus;
  total: number;
  done: number;
  doing: number;
  percent: number;
  next: string[]; // próximas tarefas (em andamento primeiro)
  lead: string | null;
  teamSize: number;
  late: boolean;
  expectedEnd: string;
};

export type TaskItem = {
  id: string;
  stage: string;
  title: string;
  status: TaskStatus;
  updatedBy: string | null;
  updatedAt: string;
};

export type TeamMemberItem = {
  id: string;
  name: string;
  role: MemberRole;
  jobTitle: string;
};

export type ProjectDetail = {
  id: string;
  name: string;
  location: string;
  powerKwp: number | null;
  startDate: string;
  expectedEnd: string;
  status: ProjectStatus;
  late: boolean;
  total: number;
  done: number;
  doing: number;
  percent: number;
  tasks: TaskItem[];
  team: TeamMemberItem[];
};

export type ProjectOption = { id: string; name: string };

// ---------- Financeiro ----------

export type FinancePoint = { label: string; revenue: number; cost: number };

export type FinanceEntryItem = {
  id: string;
  type: EntryType;
  amount: number;
  date: string;
  description: string;
  projectName: string;
};

export type InvoiceItem = {
  id: string;
  number: string;
  description: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedAt: string;
  projectName: string;
  late: boolean;
};

export type InvoiceSummary = {
  issuedThisMonth: number;
  pendingCount: number;
  pendingAmount: number;
  lateCount: number;
  next: InvoiceItem[];
};

// ---------- Resultados de ações ----------

// Ações que terminam em redirecionamento devolvem undefined no sucesso.
export type ActionResult = { error: string } | undefined;

// Ações que ficam na mesma página devolvem sucesso explícito.
export type MutationResult = { error: string } | { success: true };
export type UserActionResult = MutationResult;

export type LoginState = { error: string; email?: string } | undefined;

export function stockStatus(p: Pick<Product, "currentStock" | "minStock">): StockStatus {
  if (p.currentStock <= 0) return "out";
  if (p.currentStock <= p.minStock) return "low";
  return "ok";
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
