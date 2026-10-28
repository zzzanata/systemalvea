// Painel com barra de título azul-marinho e detalhe amarelo (cores da logo).
export default function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-gtg-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-l-4 border-sun-400 bg-brand-900 px-4 py-2.5 text-white">
        <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
