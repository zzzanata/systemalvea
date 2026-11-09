import Badge, { type BadgeTone } from "@/components/Badge";
import { auditActionLabel, type AuditAction, type AuditEntry } from "@/lib/types";

const tone: Record<AuditAction, BadgeTone> = { CREATE: "emerald", UPDATE: "sky", DELETE: "rose" };

// Lista do histórico. Também é usada dentro das fichas (paciente, orçamento...)
// para mostrar só as alterações daquele registro.
export default function AuditList({ entries, showEntity = true }: { entries: AuditEntry[]; showEntity?: boolean }) {
  if (entries.length === 0) {
    return <p className="px-1 py-6 text-center text-sm text-ink-500">Nenhuma alteração encontrada.</p>;
  }

  return (
    <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-sand-200">
      {entries.map((e) => (
        <li key={e.id} className="relative pl-7">
          <span className="absolute left-0 top-4 h-[15px] w-[15px] rounded-full border-2 border-white bg-brand-300 ring-1 ring-sand-200" />
          <details className="group rounded-xl border border-sand-200 bg-white px-4 py-3 open:shadow-sm">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
              <Badge tone={tone[e.action]}>{auditActionLabel[e.action]}</Badge>
              {showEntity && <span className="text-xs font-medium uppercase tracking-wide text-ink-400">{e.entityName}</span>}
              <span className="min-w-0 flex-1 text-sm text-ink-900">{e.summary}</span>
              <span className="text-xs text-ink-500">
                <b className="font-medium text-ink-700">{e.userName}</b> · {e.createdAt}
              </span>
              {e.changes.length > 0 && (
                <span className="text-xs text-brand-700 group-open:hidden">ver detalhes</span>
              )}
            </summary>

            {e.changes.length > 0 && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-ink-400">
                    <tr>
                      <th className="py-1.5 pr-4 font-medium">Campo</th>
                      <th className="py-1.5 pr-4 font-medium">Antes</th>
                      <th className="py-1.5 font-medium">Depois</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    {e.changes.map((c) => (
                      <tr key={c.field}>
                        <td className="py-1.5 pr-4 font-medium text-ink-700">{c.field}</td>
                        <td className="py-1.5 pr-4 text-ink-500 line-through decoration-red-300">{c.from}</td>
                        <td className="py-1.5 text-ink-900">{c.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        </li>
      ))}
    </ol>
  );
}
