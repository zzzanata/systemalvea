// Cria (ou atualiza) o primeiro usuário: o dentista, com os dados do .env.
// Rode com:  npx prisma db seed
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL }),
});

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = (process.env.ADMIN_NAME ?? "").trim() || "Dentista";

  if (!email || password.length < 8) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD (mínimo de 8 caracteres) no .env antes de rodar o seed.");
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "DENTIST", active: true },
    create: { name, email, passwordHash, role: "DENTIST" },
  });

  console.log(`Seed concluído: usuário ${email} pronto (perfil Dentista).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
