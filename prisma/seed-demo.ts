// Dados de EXEMPLO para ver o painel preenchido: 4 obras (com checklist e equipe),
// lançamentos dos últimos 6 meses e algumas notas fiscais.
//
//   Criar:   npx tsx prisma/seed-demo.ts
//   Remover: npx tsx prisma/seed-demo.ts --remove
//
// Tudo que é de exemplo tem "(exemplo)" no nome da obra ou "[exemplo]" na descrição.
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_CHECKLIST } from "../lib/template";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const TAG = "(exemplo)";
const DESC = "[exemplo]";

// Data de calendário (meio-dia UTC) deslocada em dias a partir de hoje.
function day(offsetDays: number): Date {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
}

async function remove() {
  const projects = await prisma.project.deleteMany({ where: { name: { endsWith: TAG } } });
  const entries = await prisma.financeEntry.deleteMany({
    where: { description: { startsWith: DESC } },
  });
  const invoices = await prisma.invoice.deleteMany({
    where: { description: { startsWith: DESC } },
  });
  console.log(
    `Removido: ${projects.count} obra(s), ${entries.count} lançamento(s), ${invoices.count} nota(s) de exemplo.`,
  );
}

const demoProjects = [
  {
    name: `Usina Rio de Janeiro ${TAG}`,
    location: "Niterói, RJ",
    powerKwp: 750,
    start: -120,
    end: 30,
    doneCount: 18,
    lead: "Carlos Mendes",
    team: ["Rafael Souza", "Bruno Lima", "Diego Alves", "Marcos Pinto", "Tiago Rocha"],
  },
  {
    name: `Usina Campinas ${TAG}`,
    location: "Campinas, SP",
    powerKwp: 1200,
    start: -80,
    end: 60,
    doneCount: 12,
    lead: "Ana Paula Ribeiro",
    team: ["Felipe Costa", "Lucas Ferreira", "Eduardo Nunes", "Paulo Vieira"],
  },
  {
    name: `Usina Belo Horizonte ${TAG}`,
    location: "Contagem, MG",
    powerKwp: 500,
    start: -40,
    end: 90,
    doneCount: 5,
    lead: "Renato Barbosa",
    team: ["Gustavo Dias", "André Martins", "João Pedro Cardoso"],
  },
  {
    name: `Usina Curitiba ${TAG}`,
    location: "São José dos Pinhais, PR",
    powerKwp: 900,
    start: -200,
    end: -10, // prazo vencido: aparece como atrasada
    doneCount: 20,
    lead: "Marcelo Teixeira",
    team: ["Vinícius Araújo", "Caio Moreira", "Rodrigo Campos", "Sérgio Lopes", "Henrique Melo"],
  },
];

async function create() {
  const exists = await prisma.project.findFirst({ where: { name: { endsWith: TAG } } });
  if (exists) {
    console.log("Os dados de exemplo já existem. Para recriar, rode antes com --remove.");
    return;
  }

  const total = DEFAULT_CHECKLIST.reduce((s, st) => s + st.tasks.length, 0);

  for (const p of demoProjects) {
    let position = 0;
    const tasks = DEFAULT_CHECKLIST.flatMap((st) =>
      st.tasks.map((title) => {
        const i = position++;
        const status =
          i < p.doneCount ? ("DONE" as const) : i === p.doneCount && p.doneCount < total ? ("DOING" as const) : ("TODO" as const);
        return { stage: st.stage, title, position: i, status };
      }),
    );

    await prisma.project.create({
      data: {
        name: p.name,
        location: p.location,
        powerKwp: p.powerKwp,
        startDate: day(p.start),
        expectedEnd: day(p.end),
        tasks: { create: tasks },
        team: {
          create: [
            { name: p.lead, role: "LEAD", jobTitle: "Líder de obra" },
            ...p.team.map((name, i) => ({
              name,
              role: "MEMBER" as const,
              jobTitle: ["Eletricista", "Instalador", "Auxiliar", "Técnico"][i % 4],
            })),
          ],
        },
      },
    });
  }

  // Lançamentos: 6 meses, no dia 15 de cada mês.
  const revenues = [182000, 215000, 168000, 243000, 197000, 226000];
  const costs = [121000, 139000, 118000, 152000, 133000, 147000];
  const now = new Date();
  const entries = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 15, 12));
    const k = 5 - i;
    entries.push({
      type: "REVENUE" as const,
      amount: revenues[k],
      date,
      description: `${DESC} Medição do mês`,
    });
    entries.push({
      type: "COST" as const,
      amount: costs[k],
      date,
      description: `${DESC} Materiais e mão de obra`,
    });
  }
  await prisma.financeEntry.createMany({ data: entries });

  // Notas fiscais: algumas emitidas neste mês, outras pendentes (uma atrasada).
  await prisma.invoice.createMany({
    data: [
      { description: `${DESC} Medição 1 - Cliente Rio`, amount: 98000, status: "ISSUED", number: "1021", issuedAt: day(-6), dueDate: day(-8) },
      { description: `${DESC} Medição 2 - Cliente Campinas`, amount: 124000, status: "ISSUED", number: "1022", issuedAt: day(-2), dueDate: day(-3) },
      { description: `${DESC} Medição 3 - Cliente Curitiba`, amount: 87000, status: "PENDING", dueDate: day(-4) },
      { description: `${DESC} Medição 2 - Cliente Rio`, amount: 112000, status: "PENDING", dueDate: day(5) },
      { description: `${DESC} Entrada - Cliente Belo Horizonte`, amount: 65000, status: "PENDING", dueDate: day(12) },
    ],
  });

  console.log("Dados de exemplo criados: 4 obras, 12 lançamentos e 5 notas.");
}

async function main() {
  if (process.argv.includes("--remove")) await remove();
  else await create();
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
