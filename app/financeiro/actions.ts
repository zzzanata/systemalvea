"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseDay } from "@/lib/dates";
import { parseNumber, round2, text } from "@/lib/form";
import type { MutationResult } from "@/lib/types";

export async function createEntry(formData: FormData): Promise<MutationResult> {
  await requireAdmin();

  const type = text(formData.get("type")) === "COST" ? "COST" : "REVENUE";
  const amount = parseNumber(formData.get("amount"));
  const date = parseDay(formData.get("date"));
  const description = text(formData.get("description"));
  const projectId = text(formData.get("projectId"));

  if (amount === null || amount <= 0) return { error: "Informe um valor maior que zero." };
  if (!date) return { error: "Informe a data." };
  if (!description) return { error: "Informe uma descrição." };

  try {
    await prisma.financeEntry.create({
      data: {
        type,
        amount: round2(amount),
        date,
        description,
        projectId: projectId || null,
      },
    });
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível salvar o lançamento. Tente novamente." };
  }

  revalidatePath("/");
  revalidatePath("/financeiro");
  return { success: true };
}

export async function deleteEntry(entryId: string): Promise<MutationResult> {
  await requireAdmin();

  try {
    await prisma.financeEntry.delete({ where: { id: entryId } });
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível excluir o lançamento." };
  }

  revalidatePath("/");
  revalidatePath("/financeiro");
  return { success: true };
}
