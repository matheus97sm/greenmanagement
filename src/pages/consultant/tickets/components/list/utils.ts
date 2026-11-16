import { Status } from "@/domain/enums";
import { matchesSearch } from "@/domain/search";
import { compareBySla } from "@/domain/sla";
import type { Language, Translate } from "@/i18n";
import { isActive } from "@/domain/status";
import type { Ticket } from "@/domain/types";
import { StatusOption, Tab } from "./enums";
import type { locales } from "./locales";
import type {
  SelectRowsInput,
  StatusFilter,
  StatusFilterOption,
} from "./types";

export function splitTickets(
  tickets: Ticket[],
  meId: string,
  groupId: string | undefined,
): { mine: Ticket[]; queue: Ticket[] } {
  return {
    mine: tickets.filter((ticket) => ticket.responsavel_id === meId),
    queue: tickets.filter(
      (ticket) =>
        !ticket.responsavel_id &&
        ticket.status === Status.Open &&
        ticket.grupo_id === groupId,
    ),
  };
}

export function matchesStatus(ticket: Ticket, filter: StatusFilter): boolean {
  if (filter === StatusOption.Active) return isActive(ticket.status);
  if (filter === StatusOption.All) return true;
  return ticket.status === filter;
}

export function selectRows({
  mine,
  queue,
  tab,
  statusFilter,
  search,
  people,
  now,
}: SelectRowsInput): Ticket[] {
  return (tab === Tab.Mine ? mine : queue)
    .filter((ticket) => matchesStatus(ticket, statusFilter))
    .filter((ticket) => matchesSearch(ticket, search, people))
    .sort(compareBySla(now));
}

export function statusFilterOptions(
  translate: Translate<(typeof locales)[Language.PtBr]>,
  statusLabel: (status: Status) => string,
): StatusFilterOption[] {
  return [
    { value: StatusOption.Active, label: translate("filterActive") },
    { value: StatusOption.All, label: translate("filterAll") },
    ...Object.values(Status).map((status) => ({
      value: status,
      label: statusLabel(status),
    })),
  ];
}
