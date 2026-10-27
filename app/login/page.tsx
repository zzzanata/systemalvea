import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Já logado: não faz sentido ver a tela de login.
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
          <p className="text-sm text-slate-500">Entre com seu e-mail e senha</p>
        </header>
        <LoginForm />
      </div>
    </div>
  );
}
