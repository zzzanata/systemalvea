// Painel com título em Newsreader e uma linha verde-sálvia de destaque.
// Em grade, todos os painéis da fileira ficam com a mesma altura (h-full).
export default function Panel({
  title,
  action,
  index = 0,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  /** Posição na tela: define o atraso da animação de entrada. */
  index?: number;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{ animationDelay: `${index * 90}ms` }}
      className="flex h-full animate-av-rise flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
      <header className="flex items-center justify-between gap-3 border-b border-sand-100 px-5 py-3.5">
        <h2 className="flex items-center gap-2.5 font-serif text-lg font-normal text-ink-900">
          <span className="h-4 w-0.5 rounded-full bg-brand-500" />
          {title}
        </h2>
        {action}
      </header>
      <div className="flex-1 p-4">{children}</div>
    </section>
  );
}
