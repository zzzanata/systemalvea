import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { getCurrentUser } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Alvéa Odontologia | Sistema",
  description: "Agenda, orçamentos e financeiro da Alvéa Odontologia",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#26332F",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="bg-sand-50 font-sans text-ink-900 antialiased">
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
