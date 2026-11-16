import { pausedSince } from "@/domain/rules";
import { slaInfo } from "@/domain/sla";
import type { Ticket } from "@/domain/types";
import type { BuildItemsInput, RowItem, SelectionScope } from "./types";

export function buildItems({
  tickets,
  people,
  groups,
  history,
  now,
}: BuildItemsInput): RowItem[] {
  return tickets.map((ticket) => {
    const requester = people[ticket.solicitante_id];
    const company = requester?.empresa ? ` · ${requester.empresa}` : "";
    return {
      ticket,
      sla: slaInfo(ticket, now, pausedSince(ticket, history[ticket.id])),
      requester: `${requester?.nome ?? ""}${company}`,
      owner: ticket.responsavel_id
        ? people[ticket.responsavel_id]?.nome
        : undefined,
      group: groups[ticket.grupo_id]?.nome ?? "",
    };
  });
}

export function selectionScope(
  tickets: Ticket[],
  lockedGroupId: string | undefined,
): SelectionScope {
  const targetGroupId = lockedGroupId ?? tickets[0]?.grupo_id;
  const selectable = tickets.filter((t) => t.grupo_id === targetGroupId);
  return {
    targetGroupId,
    selectable,
    mixed: selectable.length < tickets.length,
  };
}

export function isLocked(
  ticket: Ticket,
  lockedGroupId: string | undefined,
): boolean {
  return lockedGroupId !== undefined && ticket.grupo_id !== lockedGroupId;
}
