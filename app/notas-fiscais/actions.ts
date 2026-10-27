"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parseDay, todayBR } from "@/lib/dates";
import { parseNumber, round2, text } from "@/lib/form";
import type { MutationResult } from "@/lib/types";

function refresh() {
  revalidatePath("/");
  revalidatePath("/notas-fiscais");
}

export async function createInvoice(formData: FormData): Promise<MutationResult> {
  await requireAdmin();

  const description = text(formData.get("description"));
  const amount = parseNumber(formData.get("amount"));
  const dueDate = parseDay(formData.get("dueDate"));
  const number = text(formData.get("number"));
  const projectId = text(formData.get("projectId"));

  if (!description) return { error: "Informe o cliente ou o serviço." };
  if (amount === null || amount <= 0) return { error: "Informe um valor maior que zero." };

  try {
    await prisma.invoice.create({
      data: {
        description,
        amount: round2(amount),
        dueDate,
        number: number || null,
        projectId: projectId || null,
      },
    });
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível salvar a nota. Tente novamente." };
  }

  refresh();
  return { success: true };
}

export async function markInvoiceIssued(
  invoiceId: string,
  number: string,
  issuedDay: string,
): Promise<MutationResult> {
  await requireAdmin();

  const issuedAt = parseDay(issuedDay) ?? parseDay(todayBR());

  try {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "ISSUED",
        issuedAt,
        // Só sobrescreve o número se algum foi informado.
        ...(number.trim() ? { number: number.trim() } : {}),
      },
    });
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível marcar como emitida." };
  }

  refresh();
  return { success: true };
}

export async function cancelInvoice(invoiceId: string): Promise<MutationResult> {
  await requireAdmin();

  try {
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "CANCELED" } });
  } catch (e) {
    console.error(e);
    return { error: "Não foi possível cancelar a nota." };
  }

  refresh();
  return { success: true };
}
