// Importa as notas fiscais da planilha "controle_zana.xlsx" (já limpas em notas-import.json).
//
//   Conferir sem gravar:  npx tsx prisma/import-notas.ts --simular
//   Importar:             npx tsx prisma/import-notas.ts
//
// Por segurança, se o banco já tiver notas o script para. Para somar às existentes: --acrescentar
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { extractCity } from "../lib/cities";

type Row = {
  row: number;
  type: "IN" | "OUT";
  number: string;
  accessKey: string | null;
  description: string;
  amount: number;
  issuedAt: string | null;
  dueDate: string | null;
  status: "PAID" | "PENDING" | "CANCELED";
  senderName: string;
  senderCnpj: string;
  recipientName: string;
  recipientCnpj: string;
};

const simulate = process.argv.includes("--simular");
const append = process.argv.includes("--acrescentar");

// Datas de calendário são guardadas ao meio-dia UTC (igual ao resto do sistema).
const day = (s: string | null) => (s ? new Date(`${s}T12:00:00Z`) : null);

const rows: Row[] = JSON.parse(readFileSync(join(process.cwd(), "prisma", "notas-import.json"), "utf8"));
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function main() {
  const sum = (f: (r: Row) => boolean) => rows.filter(f).reduce((s, r) => s + r.amount, 0);
  console.log(`\n${rows.length} notas na planilha:`);
  console.log(`  Pagas:      ${rows.filter((r) => r.status === "PAID").length}  (${brl(sum((r) => r.status === "PAID"))})`);
  console.log(`  Pendentes:  ${rows.filter((r) => r.status === "PENDING").length}  (${brl(sum((r) => r.status === "PENDING"))})`);
  console.log(`  Canceladas: ${rows.filter((r) => r.status === "CANCELED").length}  (${brl(sum((r) => r.status === "CANCELED"))})`);
  console.log(`  Sem chave de acesso: ${rows.filter((r) => !r.accessKey).length}`);
  console.log(`  Sem data de emissão: ${rows.filter((r) => !r.issuedAt).length}\n`);

  if (simulate) {
    console.log("Simulação: nada foi gravado.");
    return;
  }

  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const existing = await prisma.invoice.count();
    if (existing > 0 && !append) {
      console.log(`O banco já tem ${existing} nota(s). Nada foi importado.`);
      console.log("Limpe antes (npx tsx prisma/clear-data.ts) ou use --acrescentar para somar.");
      return;
    }

    const result = await prisma.invoice.createMany({
      data: rows.map((r) => ({
        type: r.type,
        number: r.number || null,
        accessKey: r.accessKey,
        description: r.description,
        amount: r.amount,
        issuedAt: day(r.issuedAt),
        dueDate: day(r.dueDate),
        status: r.status,
        senderName: r.senderName || null,
        senderCnpj: r.senderCnpj || null,
        recipientName: r.recipientName || null,
        recipientCnpj: r.recipientCnpj || null,
        city: extractCity(r.description) || null,
      })),
    });
    console.log(`Pronto: ${result.count} notas importadas.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Erro ao importar:", e);
  process.exitCode = 1;
});
