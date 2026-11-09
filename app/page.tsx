import Link from "next/link";
import Panel from "@/components/Panel";
import { requireUser } from "@/lib/auth";
import { getAuditLog } from "@/lib/data";
import { todayBR } from "@/lib/dates";
import { pageSubtitleCls, pageTitleCls } from "@/lib/ui";

export const dynamic = "force-dynamic";

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()),
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const longDate = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );

// Painel inicial. Agenda do dia, recebimentos e resultado do mês entram aqui nas próximas fases.
export default async function HomePage() {
  const user = await requireUser();
  const { entries } = await getAuditLog({}, 1);
  const recent = entries.slice(0, 8);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm capitalize text-brand-600">{longDate(todayBR())}</p>
        <h1 className={pageTitleCls}>
          {greeting()}, <i>{user.name.split(" ")[0]}</i>
        </h1>
        <p className={pageSubtitleCls}>Este é o painel da Alvéa Odontologia.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Em construção" index={0}>
          <p className="text-sm leading-relaxed text-ink-500">
            Os módulos de <b className="font-medium text-ink-700">pacientes</b>, <b className="font-medium text-ink-700">agenda</b>,{" "}
            <b className="font-medium text-ink-700">orçamentos</b> e <b className="font-medium text-ink-700">financeiro</b> entram
            aqui nas próximas etapas. Quando estiverem prontos, este painel vai mostrar as consultas do dia, os valores a receber e o
            resultado do mês.
          </p>
        </Panel>

        <Panel
          title="Últimas alterações"
          index={1}
          action={
            <Link href="/historico" className="text-sm font-medium text-brand-700 hover:text-brand-900">
              Ver histórico
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="text-sm text-ink-500">Nenhuma alteração registrada ainda.</p>
          ) : (
            <ul className="divide-y divide-sand-100">
              {recent.map((e) => (
                <li key={e.id} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                  <span className="min-w-0 truncate text-ink-700">{e.summary}</span>
                  <span className="shrink-0 text-xs text-ink-400">
                    {e.userName} · {e.createdAt}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
