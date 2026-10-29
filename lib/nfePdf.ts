// Lê o PDF (DANFE) de uma NF-e usando a camada de texto do PDF. Funciona com PDFs gerados
// pelo sistema emissor (não com foto/escaneado). É "melhor esforço": o XML é mais confiável.
import type { ParsedNota } from "@/lib/nfe";

export type TextItem = { str: string; x: number; y: number; w: number; page: number };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

/** Extrai os pedaços de texto com posição. Só no navegador (carrega o pdf.js sob demanda). */
export async function extractItems(data: ArrayBuffer): Promise<TextItem[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const items: TextItem[] = [];
  for (let p = 1; p <= Math.min(pdf.numPages, 3); p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    for (const it of content.items) {
      if (!("str" in it) || !it.str.trim()) continue;
      items.push({ str: it.str.trim(), x: it.transform[4], y: it.transform[5], w: it.width, page: p });
    }
  }
  return items;
}

// Valor logo abaixo de um rótulo (DANFE é uma grade: rótulo em cima, valor embaixo).
function below(items: TextItem[], label: TextItem, maxGap = 28): string {
  let best: TextItem | null = null;
  for (const it of items) {
    if (it.page !== label.page || it === label) continue;
    const gap = label.y - it.y;
    if (gap < 3 || gap > maxGap) continue;
    const overlap = Math.min(it.x + it.w, label.x + Math.max(label.w, 40)) - Math.max(it.x, label.x - 2);
    if (overlap <= 0) continue;
    if (!best || gap < label.y - best.y || (gap === label.y - best.y && it.x < best.x)) best = it;
  }
  return best?.str ?? "";
}

const findLabels = (items: TextItem[], text: string) =>
  items.filter((i) => norm(i.str).includes(norm(text)));

const dmyToIso = (v: string) => {
  const m = v.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};

const money = (v: string) => {
  const m = v.match(/\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}/);
  return m ? m[0].replace(/\./g, "").replace(",", ".") : "";
};

export function parseDanfeItems(items: TextItem[]): ParsedNota {
  // Ordem de leitura: página, de cima para baixo, esquerda para direita.
  const sorted = [...items].sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const flat = sorted.map((i) => i.str).join(" ");

  // Chave de acesso: 44 dígitos (aparece com espaços de 4 em 4).
  const keyMatch = flat.replace(/(\d)\s+(?=\d)/g, "$1").match(/\d{44}/);
  const accessKey = keyMatch?.[0] ?? "";
  if (!accessKey) throw new Error("Não achei a chave de acesso. Esse PDF parece ser escaneado ou não é um DANFE; use o XML.");

  // A chave carrega o CNPJ do emitente (posições 6–19) e o número da nota (25–33).
  const senderCnpj = accessKey.slice(6, 20);
  const number = String(Number(accessKey.slice(25, 34)));

  const dateLabel = findLabels(items, "DATA DA EMISSAO")[0] ?? findLabels(items, "DATA DE EMISSAO")[0];
  const issuedAt = dmyToIso((dateLabel && below(items, dateLabel)) || flat.match(/\d{2}\/\d{2}\/\d{4}/)?.[0] || "");

  const totalLabel = findLabels(items, "VALOR TOTAL DA NOTA")[0];
  const amount = money((totalLabel && below(items, totalLabel)) || "");

  const emitMatch = flat.match(/RECEBEMOS DE (.+?) OS PRODUTOS/i);
  const senderName = emitMatch?.[1]?.trim() ?? "";

  // Destinatário: primeiro "NOME / RAZÃO SOCIAL" e "CNPJ / CPF" depois do título do bloco.
  const destTitle = findLabels(items, "DESTINATARIO")[0];
  const afterDest = (label: string) => {
    const cands = findLabels(items, label).filter((l) => !destTitle || l.page > destTitle.page || l.y < destTitle.y + 1);
    return cands.sort((a, b) => a.page - b.page || b.y - a.y)[0];
  };
  const nameLabel = afterDest("NOME / RAZAO SOCIAL") ?? afterDest("NOME/RAZAO SOCIAL");
  const recipientName = nameLabel ? below(items, nameLabel) : "";
  const docLabel = afterDest("CNPJ / CPF") ?? afterDest("CNPJ/CPF");
  const recipientCnpj = (docLabel ? below(items, docLabel) : "").replace(/[^0-9A-Za-z]/g, "");

  // Vencimento: menor data entre o título "FATURA/DUPLICATA" e o "CÁLCULO DO IMPOSTO".
  const upper = norm(flat);
  const a = upper.search(/FATURA|DUPLICATA/);
  const b = upper.indexOf("CALCULO DO IMPOSTO");
  let dueDate = "";
  if (a >= 0) {
    const chunk = flat.slice(a, b > a ? b : a + 400);
    const dates = [...chunk.matchAll(/\d{2}\/\d{2}\/\d{4}/g)].map((m) => dmyToIso(m[0])).filter(Boolean).sort();
    dueDate = dates[0] ?? "";
  }

  const natLabel = findLabels(items, "NATUREZA DA OPERACAO")[0];
  const nat = natLabel ? below(items, natLabel) : "";

  return {
    kind: "NF-e",
    number,
    accessKey,
    description: nat ? `NF ${number} – ${nat}` : `Nota fiscal ${number}`,
    amount,
    issuedAt,
    dueDate,
    senderName,
    senderCnpj,
    recipientName,
    recipientCnpj,
  };
}

export async function parseNotaPdf(data: ArrayBuffer): Promise<ParsedNota> {
  const items = await extractItems(data);
  if (items.length === 0) throw new Error("Esse PDF não tem texto (parece imagem escaneada). Use o XML da nota.");
  return parseDanfeItems(items);
}
