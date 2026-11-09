// Autenticação no servidor. Use apenas em Server Components e Server Actions.
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "@/lib/session";
import type { CurrentUser } from "@/lib/types";

export async function createSession(userId: string) {
  const token = await signSession(userId);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Os dados do usuário vêm sempre do banco (não do cookie).
// Dentista e recepção têm acesso total, então não há checagem de perfil.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;

  // Usuário desativado perde o acesso na hora, mesmo com o cookie ainda válido.
  return prisma.user.findFirst({
    where: { id: session.userId, active: true },
    select: { id: true, name: true, email: true, role: true },
  });
});

// Se não houver usuário logado, manda para o login (lança um redirect: chame fora de try/catch).
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

