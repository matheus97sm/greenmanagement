import { matchesSearch } from "@/domain/search";
import { compareBySla } from "@/domain/sla";
import type { Ticket } from "@/domain/types";
import { activeTicketsOf, unassignedTickets } from "@/domain/workload";
import { ALL_GROUPS } from "./constants";
import { FocusKind } from "./enums";
import type {
  FindInput,
  Focus,
  InFocusInput,
  ViewOption,
  ViewOptionsInput,
} from "./types";

export function filterByGroup(tickets: Ticket[], groupId: string): Ticket[] {
  return groupId === ALL_GROUPS
    ? tickets
    : tickets.filter((ticket) => ticket.grupo_id === groupId);
}

export function findTickets({
  tickets,
  term,
  people,
  now,
  groupId,
}: FindInput): Ticket[] {
  return filterByGroup(
    tickets
      .filter((ticket) => matchesSearch(ticket, term, people))
      .sort(compareBySla(now)),
    groupId,
  );
}

export function ticketsInFocus({
  focus,
  tickets,
  now,
  risk,
  unassigned,
}: InFocusInput): Ticket[] {
  switch (focus.kind) {
    case FocusKind.Consultant:
      return activeTicketsOf(tickets, focus.consultantId, now);
    case FocusKind.Risk:
      return risk;
    case FocusKind.Unassigned:
      return unassigned;
  }
}

export function unassignedCountByGroup(
  tickets: Ticket[],
  now: number,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ticket of unassignedTickets(tickets, now)) {
    counts[ticket.grupo_id] = (counts[ticket.grupo_id] ?? 0) + 1;
  }
  return counts;
}

export function keepVisible(
  selected: ReadonlySet<string>,
  visible: Ticket[],
): Set<string> {
  const ids = new Set(visible.map((ticket) => ticket.id));
  return new Set([...selected].filter((id) => ids.has(id)));
}

export function toggled(
  selected: ReadonlySet<string>,
  ticketId: string,
): Set<string> {
  const next = new Set(selected);
  if (!next.delete(ticketId)) next.add(ticketId);
  return next;
}

export function focusAfterPicking(current: Focus, consultantId: string): Focus {
  return current.kind === FocusKind.Consultant &&
    current.consultantId === consultantId
    ? { kind: FocusKind.Risk }
    : { kind: FocusKind.Consultant, consultantId };
}

export function viewOptions({
  riskCount,
  unassignedCount,
  consultant,
  consultantCount,
  translate,
}: ViewOptionsInput): ViewOption[] {
  return [
    {
      value: FocusKind.Risk,
      label: translate("viewRisk", { count: riskCount }),
    },
    {
      value: FocusKind.Unassigned,
      label: translate("viewUnassigned", { count: unassignedCount }),
    },
    ...(consultant
      ? [
          {
            value: FocusKind.Consultant,
            label: translate("viewConsultant", {
              name: consultant.nome,
              count: consultantCount,
            }),
          },
        ]
      : []),
  ];
}
