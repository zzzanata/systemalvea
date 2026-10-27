import Image from "next/image";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Já logado: não faz sentido ver a tela de login.
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-50 p-4">
      <Image
        src="/logo.png"
        alt="GTG Energia"
        width={640}
        height={364}
        priority
        className="h-28 w-auto"
      />
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-slate-200 border-t-4 border-t-sun-400 bg-white p-8 shadow-sm">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-brand-900">Gestão de Obras</h1>
          <p className="text-sm text-slate-500">Entre com seu e-mail e senha</p>
        </header>
        <LoginForm />
      </div>
    </div>
  );
}
