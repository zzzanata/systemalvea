// Consultas ao banco. Use apenas em Server Components e Server Actions.
import prisma from "@/lib/prisma";
import { summarizeInvoices } from "@/lib/invoices";
import { formatDay, lastMonths, monthKey, todayBR, todayStart } from "@/lib/dates";
import type {
  AppUser,
  Category,
  Employee,
  FinanceEntryItem,
  FinancePoint,
  InvoiceRecord,
  InvoiceSummary,
  Movement,
  Product,
  ProductHistory,
  ProjectDetail,
  ProjectOption,
  ProjectSummary,
  SupplierOption,
} from "@/lib/types";

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
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
    createdAt: dayFmtSP.format(u.createdAt),
  }));
}

// ---------- Estoque ----------

export async function getProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  // Decimal do Prisma não pode ir para Client Components: converte para number.
  return rows.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category?.name ?? "Sem categoria",
    unit: p.unit,
    costPrice: Number(p.costPrice),
    salePrice: Number(p.salePrice),
    minStock: Number(p.minStock),
    currentStock: Number(p.currentStock),
    active: p.active,
  }));
}

export async function getCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return rows.map((c) => ({ id: c.id, name: c.name }));
}

export async function getSuppliers(): Promise<SupplierOption[]> {
  const rows = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
  return rows.map((x) => ({ id: x.id, name: x.name }));
}

export async function getMovements(limit?: number): Promise<Movement[]> {
  const rows = await prisma.stockMovement.findMany({
    include: { product: true, user: true, supplier: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((m) => ({
    id: m.id,
    productId: m.productId,
    productName: m.product.name,
    type: m.type,
    quantity: Number(m.quantity),
    reason: m.reason ?? "",
    user: m.user.name,
    unitCost: m.unitCost === null ? null : Number(m.unitCost),
    supplier: m.supplier?.name ?? "",
    invoiceNumber: m.invoiceNumber ?? "",
    createdAt: dateTimeFmt.format(m.createdAt),
  }));
}

// ---------- Obras ----------

function toProgress(tasks: { status: string }[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const doing = tasks.filter((t) => t.status === "DOING").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, doing, percent };
}

function isLate(expectedEnd: Date | null, status: string, percent: number) {
  if (!expectedEnd || status === "DONE" || percent >= 100) return false;
  return expectedEnd < todayStart();
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const rows = await prisma.project.findMany({
    include: {
      tasks: { orderBy: { position: "asc" } },
      team: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((p) => {
    const progress = toProgress(p.tasks);
    const open = p.tasks.filter((t) => t.status !== "DONE");
    const next = [
      ...open.filter((t) => t.status === "DOING"),
      ...open.filter((t) => t.status === "TODO"),
    ]
      .slice(0, 2)
      .map((t) => t.title);

    return {
      id: p.id,
      name: p.name,
      location: p.location ?? "",
      status: p.status,
      ...progress,
      next,
      lead: p.team.find((m) => m.role === "LEAD")?.name ?? null,
      teamSize: p.team.length,
      late: isLate(p.expectedEnd, p.status, progress.percent),
      expectedEnd: formatDay(p.expectedEnd),
    };
  });
}

export async function getProjectOptions(): Promise<ProjectOption[]> {
  const rows = await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  return rows;
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  const p = await prisma.project.findUnique({
    where: { id },
    include: {
      tasks: {
        orderBy: { position: "asc" },
        include: { updatedBy: { select: { name: true } } },
      },
      team: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!p) return null;

  const progress = toProgress(p.tasks);

  return {
    id: p.id,
    name: p.name,
    location: p.location ?? "",
    powerKwp: p.powerKwp === null ? null : Number(p.powerKwp),
    startDate: formatDay(p.startDate),
    expectedEnd: formatDay(p.expectedEnd),
    status: p.status,
    late: isLate(p.expectedEnd, p.status, progress.percent),
    ...progress,
    tasks: p.tasks.map((t) => ({
      id: t.id,
      stage: t.stage,
      title: t.title,
      status: t.status,
      updatedBy: t.updatedBy?.name ?? null,
      updatedAt: dateTimeFmt.format(t.updatedAt),
    })),
    // Líder primeiro.
    team: [...p.team]
      .sort((a, b) => Number(b.role === "LEAD") - Number(a.role === "LEAD"))
      .map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        jobTitle: m.jobTitle ?? "",
      })),
  };
}

// ---------- Financeiro ----------

export async function getFinanceSeries(months = 6): Promise<FinancePoint[]> {
  const range = lastMonths(months);
  const since = new Date(`${range[0].key}-01T00:00:00Z`);

  const rows = await prisma.financeEntry.findMany({
    where: { date: { gte: since } },
    select: { type: true, amount: true, date: true },
  });

  const byMonth = new Map<string, FinancePoint>(
    range.map((m) => [m.key, { label: m.label, revenue: 0, cost: 0 }]),
  );

  for (const r of rows) {
    const point = byMonth.get(monthKey(r.date));
    if (!point) continue; // lançamento em mês futuro: fora do gráfico
    if (r.type === "REVENUE") point.revenue += Number(r.amount);
    else point.cost += Number(r.amount);
  }

  return [...byMonth.values()];
}

export async function getFinanceEntries(limit = 100): Promise<FinanceEntryItem[]> {
  const rows = await prisma.financeEntry.findMany({
    include: { project: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return rows.map((e) => ({
    id: e.id,
    type: e.type,
    amount: Number(e.amount),
    date: formatDay(e.date),
    description: e.description,
    projectName: e.project?.name ?? "",
  }));
}

// ---------- Notas fiscais ----------

const isoDay = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export async function getInvoices(): Promise<InvoiceRecord[]> {
  const rows = await prisma.invoice.findMany({
    include: { project: { select: { name: true } } },
    orderBy: [{ issuedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });

  return rows.map((i) => ({
    id: i.id,
    type: i.type,
    number: i.number ?? "",
    accessKey: i.accessKey ?? "",
    description: i.description,
    amount: Number(i.amount),
    issuedAt: isoDay(i.issuedAt),
    dueDate: isoDay(i.dueDate),
    paidAt: isoDay(i.paidAt),
    status: i.status,
    senderName: i.senderName ?? "",
    senderCnpj: i.senderCnpj ?? "",
    recipientName: i.recipientName ?? "",
    recipientCnpj: i.recipientCnpj ?? "",
    projectId: i.projectId ?? "",
    projectName: i.project?.name ?? "",
  }));
}

export async function getInvoiceSummary(): Promise<InvoiceSummary> {
  return summarizeInvoices(await getInvoices(), todayBR());
}

// ---------- Histórico de preços ----------

export async function getProductHistory(id: string): Promise<ProductHistory | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      movements: {
        where: { type: "IN", unitCost: { not: null } },
        include: { supplier: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!p) return null;

  const purchases = p.movements.map((m) => ({
    id: m.id,
    date: dateTimeFmt.format(m.createdAt).slice(0, 10),
    supplier: m.supplier?.name ?? "",
    invoiceNumber: m.invoiceNumber ?? "",
    quantity: Number(m.quantity),
    unitCost: Number(m.unitCost),
  }));
  const costs = purchases.map((x) => x.unitCost);

  // Por fornecedor: só compras com fornecedor informado; as mais recentes vêm primeiro.
  const map = new Map<string, { purchases: number; lastCost: number; minCost: number }>();
  for (const x of purchases) {
    if (!x.supplier) continue;
    const cur = map.get(x.supplier);
    if (!cur) map.set(x.supplier, { purchases: 1, lastCost: x.unitCost, minCost: x.unitCost });
    else {
      cur.purchases += 1;
      cur.minCost = Math.min(cur.minCost, x.unitCost);
    }
  }

  return {
    product: {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category?.name ?? "Sem categoria",
      unit: p.unit,
      costPrice: Number(p.costPrice),
      salePrice: Number(p.salePrice),
      minStock: Number(p.minStock),
      currentStock: Number(p.currentStock),
      active: p.active,
    },
    purchases,
    lastCost: costs.length ? costs[0] : null,
    minCost: costs.length ? Math.min(...costs) : null,
    maxCost: costs.length ? Math.max(...costs) : null,
    bySupplier: [...map.entries()]
      .map(([supplier, v]) => ({ supplier, ...v }))
      .sort((a, b) => a.lastCost - b.lastCost),
  };
}

// ---------- Funcionários ----------

export async function getEmployees(): Promise<Employee[]> {
  const rows = await prisma.employee.findMany({ orderBy: { fullName: "asc" } });
  return rows.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    jobTitle: e.jobTitle,
    dailyRate: e.dailyRate === null ? null : Number(e.dailyRate),
    monthlyRate: e.monthlyRate === null ? null : Number(e.monthlyRate),
  }));
}
