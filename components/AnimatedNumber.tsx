"use client";

import { useEffect, useState } from "react";

const brlFmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const intFmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

// Número que "sobe" de zero até o valor final quando a tela abre.
// Respeita quem pediu menos movimento (mostra o valor direto).
export default function AnimatedNumber({
  value,
  kind = "int",
  duration = 1000,
}: {
  value: number;
  kind?: "int" | "brl";
  duration?: number;
}) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    let raf = 0;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) {
      raf = requestAnimationFrame(() => setShown(value));
      return () => cancelAnimationFrame(raf);
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // easeOutExpo
      setShown(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  const text = kind === "brl" ? brlFmt.format(shown) : intFmt.format(Math.round(shown));
  return (
    <span className="tabular-nums" aria-label={kind === "brl" ? brlFmt.format(value) : intFmt.format(value)}>
      {text}
    </span>
  );
}
