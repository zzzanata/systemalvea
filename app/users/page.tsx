import UserManager from "@/components/UserForm";
import { requireUser } from "@/lib/auth";
import { getUsers } from "@/lib/data";
import { pageSubtitleCls, pageTitleCls } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireUser();
  const users = await getUsers();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className={pageTitleCls}>Usuários</h1>
        <p className={pageSubtitleCls}>Quem pode acessar o sistema. Usuários inativos não conseguem entrar.</p>
      </header>
      <UserManager users={users} meId={me.id} />
    </div>
  );
}
