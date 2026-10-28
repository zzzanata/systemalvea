export type MovementType = "IN" | "OUT" | "ADJUSTMENT";
export type StockStatus = "ok" | "low" | "out";
export type Role = "ADMIN" | "OPERATOR";

export type ProjectStatus = "ACTIVE" | "ON_HOLD" | "DONE";
export type TaskStatus = "TODO" | "DOING" | "DONE";
export type MemberRole = "LEAD" | "MEMBER";
export type EntryType = "REVENUE" | "COST";
export type InvoiceStatus = "PENDING" | "ISSUED" | "CANCELED" | "PAID";
export type InvoiceType = "IN" | "OUT";
// O que aparece na tela: "Vencido" é calculado, não gravado.
export type InvoiceShownStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELED";

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

export const invoiceShownLabel: Record<InvoiceShownStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  OVERDUE: "Vencido",
  CANCELED: "Cancelada",
};

export const invoiceTypeLabel: Record<InvoiceType, string> = {
  IN: "Entrada",
  OUT: "Saída",
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
  unitCost: number | null;
  supplier: string;
  invoiceNumber: string;
  createdAt: string; // já formatado (fuso de São Paulo)
};

export type PurchaseItem = {
  id: string;
  date: string; // já formatado
  supplier: string;
  invoiceNumber: string;
  quantity: number;
  unitCost: number;
};

export type SupplierPrice = { supplier: string; purchases: number; lastCost: number; minCost: number };

export type ProductHistory = {
  product: Product;
  purchases: PurchaseItem[]; // da mais recente para a mais antiga
  lastCost: number | null;
  minCost: number | null;
  maxCost: number | null;
  bySupplier: SupplierPrice[]; // do mais barato para o mais caro (último preço)
};

export type SupplierOption = { id: string; name: string };

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

// Datas em AAAA-MM-DD ("" quando vazio): servem direto nos <input type="date">.
export type InvoiceRecord = {
  id: string;
  type: InvoiceType;
  number: string;
  accessKey: string;
  description: string;
  amount: number;
  issuedAt: string;
  dueDate: string;
  paidAt: string;
  status: InvoiceStatus;
  senderName: string;
  senderCnpj: string;
  recipientName: string;
  recipientCnpj: string;
  projectId: string;
  projectName: string;
};

export type InvoiceGroup = {
  key: string;
  label: string;
  paidLabel: string;
  count: number;
  total: number;
  paid: number;
  percent: number;
};

export type InvoiceSummary = {
  groups: InvoiceGroup[];
  paidAmount: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
  overdueAmount: number;
  overdueCount: number;
  next: (InvoiceRecord & { shown: InvoiceShownStatus })[];
};

export type Employee = {
  id: string;
  fullName: string;
  jobTitle: string;
  dailyRate: number | null;
  monthlyRate: number | null;
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
