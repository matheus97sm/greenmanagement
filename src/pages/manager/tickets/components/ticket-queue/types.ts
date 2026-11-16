import type { SlaInfo } from "@/domain/sla";
import type { Ticket } from "@/domain/types";

export interface Props {
  tickets: Ticket[];
  total: number;
  selected: ReadonlySet<string>;
  lockedGroupId: string | undefined;
  now: number;
  emptyText: string;
  onOpen: (ticketId: string) => void;
  onToggle: (ticketId: string) => void;
  onToggleAll: (ticketIds: string[], checked: boolean) => void;
}

export interface RowItem {
  ticket: Ticket;
  sla: SlaInfo;
  requester: string;
  owner: string | undefined;
  group: string;
}

export interface RowProps {
  item: RowItem;
  selected: boolean;
  locked: boolean;
  onOpen: (ticketId: string) => void;
  onToggle: (ticketId: string) => void;
}
