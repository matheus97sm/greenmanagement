import { canReopen } from "@/domain/customer";
import type { SimilarTicket } from "@/domain/similarity";

export function warningText(hits: SimilarTicket[]): string {
  return hits.some((hit) => canReopen(hit.ticket))
    ? "Se o problema voltou, você pode reabrir esse chamado em vez de abrir outro. Assim a equipe já vê o que foi feito antes."
    : "Se for o mesmo problema, acompanhe por lá em vez de abrir outro chamado.";
}
