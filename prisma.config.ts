import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Local: DIRECT_URL (porta 5432) para migrações.
    // Na Vercel só existe DATABASE_URL, e o `prisma generate` do build precisa que este arquivo carregue sem erro.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
