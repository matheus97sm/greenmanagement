import { canReopen } from "@/domain/customer";
import type { SimilarTicket } from "@/domain/similarity";
import type { WarningKey } from "./types";

export function warningKey(hits: SimilarTicket[]): WarningKey {
  return hits.some((hit) => canReopen(hit.ticket))
    ? "warningReopen"
    : "warningFollow";
}
