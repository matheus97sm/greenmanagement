import { Status } from "@/domain/enums";
import { compareBySla } from "@/domain/sla";
import { isActive, STATUS_LABEL } from "@/domain/status";
import type { Person, Ticket } from "@/domain/types";
import { StatusOption, Tab } from "./enums";
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
    mine: tickets.filter((t) => t.responsavel_id === meId),
    queue: tickets.filter(
      (t) =>
        !t.responsavel_id && t.status === Status.Open && t.grupo_id === groupId,
    ),
  };
}

export function matchesStatus(ticket: Ticket, filter: StatusFilter): boolean {
  if (filter === StatusOption.Active) return isActive(ticket.status);
  if (filter === StatusOption.All) return true;
  return ticket.status === filter;
}

export function matchesSearch(
  ticket: Ticket,
  term: string,
  people: Record<string, Person>,
): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  const requester = people[ticket.solicitante_id];
  return (
    String(ticket.numero).includes(needle) ||
    ticket.titulo.toLowerCase().includes(needle) ||
    (requester?.nome ?? "").toLowerCase().includes(needle) ||
    (requester?.empresa ?? "").toLowerCase().includes(needle)
  );
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
    .filter((t) => matchesStatus(t, statusFilter))
    .filter((t) => matchesSearch(t, search, people))
    .sort(compareBySla(now));
}

export function statusFilterOptions(): StatusFilterOption[] {
  return [
    { value: StatusOption.Active, label: "Em andamento" },
    { value: StatusOption.All, label: "Todos" },
    ...Object.values(Status).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
  ];
}
