import type { User } from "@/auth/users";
import type { CustomerStage } from "@/domain/enums";
import type { Ticket } from "@/domain/types";
import type { TicketsState } from "@/store/ticketsStore";

export interface Props {
  me: User;
  selectedId: string | undefined;
  onSelect: (ticketId: string) => void;
}

export interface ListItem {
  ticket: Ticket;
  stage: CustomerStage;
  handler: string | null;
  unread: number;
}

export interface ListInput {
  state: TicketsState;
  meId: string;
  search: string;
}
