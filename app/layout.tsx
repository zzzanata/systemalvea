import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Controle de Estoque",
  description: "Sistema web de controle de estoque",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {user ? (
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar user={{ name: user.name, role: user.role }} />
            <main className="flex-1 p-4 md:p-8">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        ) : (
          // Sem sessão só a tela de login é exibida (o proxy.ts redireciona o resto).
          <main className="min-h-screen">{children}</main>
        )}
      </body>
    </html>
  );
}
