// Dados iniciais: usuário admin (com senha), categorias e produtos de exemplo.
// Pode rodar mais de uma vez: não duplica produtos. Rodar de novo REDEFINE a senha do admin
// com o valor atual de ADMIN_PASSWORD (útil se você esquecer a senha).
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/password";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const categories = ["Papelaria", "Impressão", "Embalagens", "Acabamento"];

const products = [
  { sku: "PAP-001", name: "Papel Couchê 150g A4", category: "Papelaria", unit: "cx", costPrice: 38.9, salePrice: 54.9, minStock: 10, stock: 42 },
  { sku: "PAP-002", name: "Papel Sulfite 75g A4", category: "Papelaria", unit: "cx", costPrice: 24.5, salePrice: 34.0, minStock: 20, stock: 8 },
  { sku: "IMP-001", name: "Toner Preto HP 85A", category: "Impressão", unit: "un", costPrice: 89.0, salePrice: 129.9, minStock: 5, stock: 3 },
  { sku: "IMP-002", name: "Tinta Ciano 1L", category: "Impressão", unit: "un", costPrice: 62.0, salePrice: 92.0, minStock: 4, stock: 12 },
  { sku: "EMB-001", name: "Caixa de Papelão 30x20x10", category: "Embalagens", unit: "un", costPrice: 2.8, salePrice: 5.5, minStock: 100, stock: 260 },
  { sku: "EMB-002", name: "Fita Adesiva Transparente", category: "Embalagens", unit: "un", costPrice: 3.2, salePrice: 6.9, minStock: 30, stock: 0 },
  { sku: "ACA-001", name: "Laminação Fosca (rolo)", category: "Acabamento", unit: "un", costPrice: 210.0, salePrice: 290.0, minStock: 2, stock: 5 },
  { sku: "ACA-002", name: "Espiral para Encadernação 12mm", category: "Acabamento", unit: "cx", costPrice: 41.0, salePrice: 65.0, minStock: 6, stock: 6 },
];

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const adminName = (process.env.ADMIN_NAME ?? "").trim() || "Admin";

  if (!adminEmail || adminPassword.length < 8) {
    throw new Error(
      "Defina ADMIN_EMAIL e ADMIN_PASSWORD (mínimo de 8 caracteres) no .env antes de rodar o seed.",
    );
  }

  const passwordHash = await hashPassword(adminPassword);

  // Reaproveita o admin que já existe (o criado na versão sem login) em vez de criar outro.
  const existing = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  const admin = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { name: adminName, email: adminEmail, passwordHash },
      })
    : await prisma.user.create({
        data: { name: adminName, email: adminEmail, passwordHash, role: "ADMIN" },
      });

  const categoryIds: Record<string, string> = {};
  for (const name of categories) {
    const c = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categoryIds[name] = c.id;
  }

  let created = 0;
  for (const p of products) {
    const exists = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (exists) continue;

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: p.sku,
          name: p.name,
          unit: p.unit,
          costPrice: p.costPrice,
          salePrice: p.salePrice,
          minStock: p.minStock,
          currentStock: p.stock,
          categoryId: categoryIds[p.category],
        },
      });

      if (p.stock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            userId: admin.id,
            type: "IN",
            quantity: p.stock,
            reason: "Estoque inicial",
          },
        });
      }
    });
    created++;
  }

  console.log(
    `Seed concluído: admin ${adminEmail} pronto (senha definida), ${created} produto(s) novo(s).`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
