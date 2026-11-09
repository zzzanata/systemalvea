const tones = {
  slate: "bg-sand-100 text-ink-700 ring-ink-500/20",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-500/30",
  rose: "bg-red-50 text-red-700 ring-red-600/20",
  sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  brand: "bg-brand-50 text-brand-800 ring-brand-700/20",
} as const;

export type BadgeTone = keyof typeof tones;

export default function Badge({
  tone = "slate",
  children,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
