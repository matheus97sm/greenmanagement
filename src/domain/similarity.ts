import type { Ticket } from "./types";

const STOPWORDS = new Set([
  "que",
  "para",
  "com",
  "uma",
  "uns",
  "umas",
  "nao",
  "por",
  "dos",
  "das",
  "nos",
  "nas",
  "aos",
  "mais",
  "como",
  "esta",
  "isso",
  "pelo",
  "pela",
  "tem",
  "ter",
  "foi",
  "mas",
  "seu",
  "sua",
  "meu",
  "minha",
  "ele",
  "ela",
  "eles",
  "elas",
  "sao",
  "ser",
  "muito",
  "pode",
  "podem",
  "ainda",
  "outra",
  "outro",
  "vez",
  "quando",
  "onde",
  "qual",
  "quais",
  "hoje",
  "agora",
  "aqui",
  "depois",
  "antes",
  "entre",
  "sobre",
  "desde",
  "num",
  "numa",
  "nem",
  "tambem",
]);

const MIN_WORD_LENGTH = 3;

export interface SimilarTicket {
  ticket: Ticket;
  score: number;
}

export interface SimilarityOptions {
  limit?: number;
  minScore?: number;
  minShared?: number;
}

export function tokensOf(text: string): string[] {
  const plain = text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const words = plain
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= MIN_WORD_LENGTH && !STOPWORDS.has(word));
  return [...new Set(words)];
}

export function similarTickets(
  draft: { title: string; description: string },
  tickets: Ticket[],
  { limit = 3, minScore = 0.6, minShared = 2 }: SimilarityOptions = {},
): SimilarTicket[] {
  const wanted = new Set([
    ...tokensOf(draft.title),
    ...tokensOf(draft.description),
  ]);
  if (wanted.size < minShared) return [];

  return tickets
    .map((ticket) => {
      const own = tokensOf(ticket.titulo);
      const shared = own.filter((token) => wanted.has(token)).length;
      return {
        ticket,
        shared,
        score: own.length === 0 ? 0 : shared / own.length,
      };
    })
    .filter((hit) => hit.shared >= minShared && hit.score >= minScore)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.ticket.atualizado_em.localeCompare(a.ticket.atualizado_em),
    )
    .slice(0, limit)
    .map(({ ticket, score }) => ({ ticket, score }));
}
