export default function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "danger";
}) {
  const valueColor =
    tone === "danger"
      ? "text-red-600"
      : tone === "warn"
        ? "text-sun-700"
        : "text-slate-900";

  // Quanto maior o valor, menor a fonte, para nunca estourar o cartão.
  const len = String(value).length;
  const size =
    len <= 4
      ? "text-3xl"
      : len <= 8
        ? "text-2xl sm:text-3xl"
        : len <= 11
          ? "text-xl sm:text-2xl"
          : "text-lg sm:text-xl";

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 whitespace-nowrap font-semibold tracking-tight ${size} ${valueColor}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
