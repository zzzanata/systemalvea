// Apaga arquivos que não existem mais no sistema e quebram o "npm run build".
// Rode na pasta do projeto:  node limpar-arquivos-antigos.mjs
import { rmSync, existsSync } from "node:fs";

const antigos = [
  "app/movements",
  "app/products/new",
  "app/products/[id]",
  "components/MovementForm.tsx",
  "components/ProductForm.tsx",
  "components/ProductsTable.tsx",
  "components/FinanceForm.tsx",
  "components/DeleteEntryButton.tsx",
  "components/InvoiceActions.tsx",
  "components/InvoiceForm.tsx",
  "lib/stock.ts",
];

for (const f of antigos) {
  if (existsSync(f)) {
    rmSync(f, { recursive: true, force: true });
    console.log("apagado:", f);
  }
}
console.log("Pronto.");
