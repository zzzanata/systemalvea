"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { auditCreate, auditUpdate, type Snapshot } from "@/lib/audit";
import { text } from "@/lib/form";
import { hashPassword } from "@/lib/password";
import { roleLabel, type MutationResult, type Role } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseRole = (v: FormDataEntryValue | null): Role =>
  text(v) === "DENTIST" ? "DENTIST" : "RECEPTION";

const snapshot = (u: { name: string; email: string; role: Role; active: boolean }): Snapshot => ({
  Nome: u.name,
  "E-mail": u.email,
  Perfil: roleLabel[u.role],
  Ativo: u.active,
});

export async function createUser(formData: FormData): Promise<MutationResult> {
  const me = await requireUser();

  const name = text(formData.get("name"));
  const email = text(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = parseRole(formData.get("role"));

  if (!name) return { error: "Informe o nome." };
  if (!EMAIL_RE.test(email)) return { error: "E-mail inválido." };
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };

  try {
    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({ data: { name, email, passwordHash, role } });
      await auditCreate(tx, { user: me, entity: "user", entityId: u.id, label: u.name, data: snapshot(u) });
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { error: "Já existe um usuário com esse e-mail." };
    console.error(e);
    return { error: "Não foi possível criar o usuário. Tente novamente." };
  }

  revalidatePath("/users");
  return { success: true };
}

export async function updateUser(id: string, formData: FormData): Promise<MutationResult> {
  const me = await requireUser();

  const name = text(formData.get("name"));
  const email = text(formData.get("email")).toLowerCase();
  const role = parseRole(formData.get("role"));
  const active = formData.get("active") === "on";
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Informe o nome." };
  if (!EMAIL_RE.test(email)) return { error: "E-mail inválido." };
  if (password && password.length < 8) return { error: "A nova senha precisa ter pelo menos 8 caracteres." };
  if (id === me.id && !active) return { error: "Você não pode desativar o seu próprio usuário." };

  try {
    const passwordHash = password ? await hashPassword(password) : undefined;
    await prisma.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({ where: { id } });
      const after = await tx.user.update({ where: { id }, data: { name, email, role, active, passwordHash } });
      await auditUpdate(tx, {
        user: me,
        entity: "user",
        entityId: id,
        label: after.name,
        // A senha nunca vai para o histórico: só o fato de ter sido trocada.
        before: { ...snapshot(before), Senha: "" },
        after: { ...snapshot(after), Senha: password ? "alterada" : "" },
      });
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return { error: "Já existe um usuário com esse e-mail." };
    console.error(e);
    return { error: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath("/users");
  return { success: true };
}
