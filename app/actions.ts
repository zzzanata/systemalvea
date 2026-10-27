"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser, requireAdmin, requireUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import type { ActionResult, MovementType, UserActionResult } from "@/lib/types";

// Erro com mensagem segura para mostrar ao usuário.
class UserError extends Error {}

const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();

function num(v: FormDataEntryValue | null): number | null {
  const s = text(v).replace(",", ".");
  if (s === "") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null;
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  // Autenticação antes do try/catch: o redirect do requireUser não pode ser engolido.
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") {
    return { error: "Somente administradores podem cadastrar produtos." };
  }

  const name = text(formData.get("name"));
  const sku = text(formData.get("sku")).toUpperCase();
  const unit = text(formData.get("unit")) || "un";
  const costPrice = num(formData.get("costPrice")) ?? 0;
  const salePrice = num(formData.get("salePrice")) ?? 0;
  const minStock = num(formData.get("minStock")) ?? 0;
  const initialStock = num(formData.get("initialStock")) ?? 0;
  const categoryId = text(formData.get("categoryId"));
  const newCategory = text(formData.get("newCategory"));

  if (!name || !sku) return { error: "Preencha o nome e o SKU." };
  if ([costPrice, salePrice, minStock, initialStock].some((n) => n < 0)) {
    return { error: "Preços e quantidades não podem ser negativos." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      let finalCategoryId: string | null = categoryId || null;
      if (newCategory) {
        const c = await tx.category.upsert({
          where: { name: newCategory },
          update: {},
          create: { name: newCategory },
        });
        finalCategoryId = c.id;
      }

      const product = await tx.product.create({
        data: {
          sku,
          name,
          unit,
          costPrice,
          salePrice,
          minStock,
          currentStock: initialStock,
          categoryId: finalCategoryId,
        },
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            userId: user.id,
            type: "IN",
            quantity: initialStock,
            reason: "Estoque inicial",
          },
        });
      }
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { error: "Já existe um produto com esse SKU." };
    }
    console.error(e);
    return { error: "Não foi possível salvar o produto. Tente novamente." };
  }

  revalidatePath("/");
  revalidatePath("/products");
  redirect("/products");
}

export async function createMovement(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const productId = text(formData.get("productId"));
  const type = text(formData.get("type")) as MovementType;
  const qty = num(formData.get("quantity"));
  const reason = text(formData.get("reason"));
  const note = text(formData.get("note"));

  if (!productId) return { error: "Escolha um produto." };
  if (!["IN", "OUT", "ADJUSTMENT"].includes(type)) return { error: "Tipo inválido." };
  if (qty === null || qty === 0) return { error: "Informe uma quantidade válida." };
  if (type !== "ADJUSTMENT" && qty < 0) {
    return { error: "Em entrada e saída a quantidade deve ser positiva." };
  }

  // Quanto o saldo muda: saída diminui; entrada aumenta; ajuste usa o sinal informado.
  const delta = type === "OUT" ? -Math.abs(qty) : qty;
  // Guardado no histórico: entrada e saída sempre positivas; ajuste com sinal.
  const stored = type === "ADJUSTMENT" ? qty : Math.abs(qty);

  try {
    await prisma.$transaction(async (tx) => {
      // Atualização atômica: uma redução só acontece se houver saldo suficiente.
      const updated =
        delta >= 0
          ? await tx.product.updateMany({
              where: { id: productId },
              data: { currentStock: { increment: delta } },
            })
          : await tx.product.updateMany({
              where: { id: productId, currentStock: { gte: -delta } },
              data: { currentStock: { decrement: -delta } },
            });

      if (updated.count === 0) {
        throw new UserError(
          delta >= 0
            ? "Produto não encontrado."
            : "Saldo insuficiente (ou produto não encontrado).",
        );
      }

      await tx.stockMovement.create({
        data: {
          productId,
          userId: user.id,
          type,
          quantity: stored,
          reason: reason || null,
          note: note || null,
        },
      });
    });
  } catch (e) {
    if (e instanceof UserError) return { error: e.message };
    console.error(e);
    return { error: "Não foi possível registrar a movimentação. Tente novamente." };
  }

  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/movements");
  redirect("/movements");
}

export async function createUser(formData: FormData): Promise<UserActionResult> {
  await requireAdmin();

  const name = text(formData.get("name"));
  const email = text(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = text(formData.get("role")) === "ADMIN" ? "ADMIN" : "OPERATOR";

  if (!name) return { error: "Informe o nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "E-mail inválido." };
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };

  try {
    await prisma.user.create({
      data: { name, email, passwordHash: await hashPassword(password), role },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { error: "Já existe um usuário com esse e-mail." };
    }
    console.error(e);
    return { error: "Não foi possível criar o usuário. Tente novamente." };
  }

  revalidatePath("/users");
  return { success: true };
}
