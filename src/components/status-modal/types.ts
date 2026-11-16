import type { Ticket } from "@/domain/types";

export interface Props {
  ticket: Ticket;
  userId: string;
  reopen?: boolean;
  onClose: () => void;
}
