// Consultas ao banco. Use apenas em Server Components e Server Actions.
import prisma from "@/lib/prisma";
import type { AppUser, Category, Movement, Product } from "@/lib/types";

const dayFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Sao_Paulo",
});

export async function getUsers(): Promise<AppUser[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: dayFmt.format(u.createdAt),
  }));
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

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

export async function getMovements(limit?: number): Promise<Movement[]> {
  const rows = await prisma.stockMovement.findMany({
    include: { product: true, user: true },
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
    createdAt: dateFmt.format(m.createdAt),
  }));
}
