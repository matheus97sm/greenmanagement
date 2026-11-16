import type { SimilarTicket } from "@/domain/similarity";

export interface Props {
  hits: SimilarTicket[];
  onOpen: (ticketId: string) => void;
}

export type WarningKey = "warningReopen" | "warningFollow";
