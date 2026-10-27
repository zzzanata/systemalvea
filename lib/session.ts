// Sessão em cookie assinado (JWT HS256). Sem acesso ao banco: pode ser usado no proxy.ts.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 7;

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET ausente ou curta demais (mínimo de 32 caracteres). Defina no .env e na Vercel.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getKey());
}

export async function verifySession(
  token: string | undefined,
): Promise<{ userId: string } | null> {
  if (!token) return null;
  const key = getKey(); // fora do try: segredo ausente deve falhar de forma visível
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return typeof payload.userId === "string" ? { userId: payload.userId } : null;
  } catch {
    return null; // token inválido ou expirado
  }
}
