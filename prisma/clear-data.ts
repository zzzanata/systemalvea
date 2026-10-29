// LIMPA os dados do sistema para você começar a cadastrar coisas reais.
// Mantém os USUÁRIOS (você continua entrando com o mesmo login).
//
//   Tudo (obras, financeiro, notas, funcionários e estoque):
//     npx tsx prisma/clear-data.ts
//   Só obras/financeiro/notas/funcionários, mantendo o estoque:
//     npx tsx prisma/clear-data.ts --keep-estoque
//
// ATENÇÃO: não tem como desfazer. O script mostra o que vai apagar e só continua
// se você digitar APAGAR.
import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const keepStock = process.argv.includes("--keep-estoque");

async function counts() {
  const base: [string, number][] = [
    ["obras", await prisma.project.count()],
    ["tarefas dos checklists", await prisma.task.count()],
    ["membros de equipe", await prisma.teamMember.count()],
    ["lançamentos financeiros", await prisma.financeEntry.count()],
    ["notas fiscais", await prisma.invoice.count()],
    ["funcionários", await prisma.employee.count()],
  ];
  if (!keepStock) {
    base.push(
      ["movimentações de estoque", await prisma.stockMovement.count()],
      ["produtos", await prisma.product.count()],
      ["categorias", await prisma.category.count()],
      ["fornecedores", await prisma.supplier.count()],
    );
  }
  return base;
}

async function main() {
  const users = await prisma.user.count();
  console.log("\nVai APAGAR do banco:");
  for (const [label, n] of await counts()) console.log(`  - ${n} ${label}`);
  console.log(`\nSerá MANTIDO: ${users} usuário(s)${keepStock ? " e todo o estoque" : ""}.\n`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("Para confirmar, digite APAGAR: ")).trim();
  rl.close();
  if (answer !== "APAGAR") {
    console.log("Cancelado. Nada foi apagado.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.task.deleteMany();
    await tx.teamMember.deleteMany();
    await tx.financeEntry.deleteMany();
    await tx.invoice.deleteMany();
    await tx.project.deleteMany();
    await tx.employee.deleteMany();
    if (!keepStock) {
      await tx.stockMovement.deleteMany();
      await tx.product.deleteMany();
      await tx.category.deleteMany();
      await tx.supplier.deleteMany();
    }
  });

  console.log("\nPronto. Banco limpo. Seu login continua funcionando.");
}

main()
  .catch((e) => {
    console.error("Erro ao limpar:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
