import type { SimilarTicket } from "@/domain/similarity";

export interface Props {
  hits: SimilarTicket[];
  onOpen: (ticketId: string) => void;
}
