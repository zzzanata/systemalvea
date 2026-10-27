import Link from "next/link";
import ProductsTable from "@/components/ProductsTable";
import { getCurrentUser } from "@/lib/auth";
import { getCategories, getProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories, user] = await Promise.all([
    getProducts(),
    getCategories(),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-sm text-slate-500">Cadastro e saldo atual</p>
        </div>
        {user?.role === "ADMIN" && (
          <Link
            href="/products/new"
            className="rounded-lg bg-brand-900 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800"
          >
            Novo produto
          </Link>
        )}
      </header>
      <ProductsTable products={products} categories={categories.map((c) => c.name)} />
    </div>
  );
}
