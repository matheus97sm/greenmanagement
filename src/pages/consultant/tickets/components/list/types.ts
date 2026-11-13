import type { User } from "@/auth/users";
import type { Status } from "@/domain/enums";
import type { Person, Ticket } from "@/domain/types";
import type { StatusOption, Tab } from "./enums";

export type StatusFilter = StatusOption | Status;

export interface Props {
  me: User;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}

export interface SelectRowsInput {
  mine: Ticket[];
  queue: Ticket[];
  tab: Tab;
  statusFilter: StatusFilter;
  search: string;
  people: Record<string, Person>;
  now: number;
}

export interface StatusFilterOption {
  value: StatusFilter;
  label: string;
}
