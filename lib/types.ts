export type MovementType = "IN" | "OUT" | "ADJUSTMENT";
export type StockStatus = "ok" | "low" | "out";
export type Role = "ADMIN" | "OPERATOR";

export const roleLabel: Record<Role, string> = {
  ADMIN: "Administrador",
  OPERATOR: "Operador",
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

// Resultado das Server Actions: em caso de sucesso elas redirecionam (retorno undefined).
export type ActionResult = { error: string } | undefined;

// Ações que ficam na mesma página (sem redirecionar) devolvem sucesso explícito.
export type UserActionResult = { error: string } | { success: true };

export type LoginState = { error: string; email?: string } | undefined;

export function stockStatus(p: Pick<Product, "currentStock" | "minStock">): StockStatus {
  if (p.currentStock <= 0) return "out";
  if (p.currentStock <= p.minStock) return "low";
  return "ok";
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
