import type { Ticket } from "@/domain/types";

export interface Props {
  tickets: Ticket[];
  total: number;
  selected: ReadonlySet<string>;
  now: number;
  emptyText: string;
  onToggle: (ticketId: string) => void;
  onToggleAll: (checked: boolean) => void;
}
