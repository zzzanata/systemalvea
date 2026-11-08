// Cidades das notas fiscais: o texto é livre (o usuário digita), mas "Laranjal Paulista",
// "laranjal  paulista" e "LARANJAL PAULISTA" contam como a mesma cidade.

export const cityKey = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const cleanCity = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 60);

export const NO_CITY = "__none__";

export type CityTab = { key: string; label: string; count: number };

/** Cidades distintas, da mais usada para a menos usada (grafia mais comum de cada uma). */
export function listCities(items: { city: string }[]): CityTab[] {
  const map = new Map<string, { spellings: Map<string, number>; count: number }>();
  for (const i of items) {
    if (!i.city) continue;
    const k = cityKey(i.city);
    const e = map.get(k) ?? { spellings: new Map(), count: 0 };
    e.count++;
    e.spellings.set(i.city, (e.spellings.get(i.city) ?? 0) + 1);
    map.set(k, e);
  }
  return [...map.entries()]
    .map(([key, e]) => ({
      key,
      count: e.count,
      label: [...e.spellings.entries()].sort((a, b) => b[1] - a[1])[0][0],
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR"));
}

/**
 * Chuta a cidade pelo texto da descrição: se a descrição contém a palavra principal de uma
 * cidade já cadastrada ("... LARANJAL - SP" -> "Laranjal Paulista"), devolve essa cidade.
 */
export function guessCity(description: string, cities: string[]): string {
  const text = ` ${cityKey(description).replace(/[^a-z0-9]+/g, " ")} `;
  let best = "";
  let bestLen = 0;
  for (const city of cities) {
    const base = cityKey(city).split(" - ")[0].replace(/[^a-z0-9 ]+/g, " ");
    const words = base.split(" ").filter((w) => w.length >= 4);
    if (words.length === 0) continue;
    const w = words[0];
    if (text.includes(` ${w} `) && w.length > bestLen) {
      best = city;
      bestLen = w.length;
    }
  }
  return best;
}
