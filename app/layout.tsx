import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "GTG Energia | Gestão de Obras",
  description: "Acompanhamento de obras, financeiro e estoque da GTG Energia",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000a73",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body className="bg-brand-50 text-slate-900 antialiased">
        {user ? (
          <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar user={{ name: user.name, role: user.role }} />
            <main className="min-w-0 flex-1 p-4 md:p-8">
              <div className="mx-auto max-w-[1400px]">{children}</div>
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
