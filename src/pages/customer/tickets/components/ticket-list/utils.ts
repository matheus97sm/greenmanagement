import { stageOf } from "@/domain/customer";
import { CustomerStage } from "@/domain/enums";
import { matchesSearch } from "@/domain/search";
import { unreadCount } from "@/store/ticketsStore";
import type { ListInput, ListItem } from "./types";

const FINISHED = new Set([CustomerStage.Resolved, CustomerStage.Closed]);

export function attentionRank(item: ListItem): number {
  if (item.stage === CustomerStage.WaitingYou) return 0;
  if (item.unread > 0) return 1;
  return FINISHED.has(item.stage) ? 3 : 2;
}

export function listItems({ state, meId, search }: ListInput): ListItem[] {
  return Object.values(state.tickets)
    .filter((ticket) => matchesSearch(ticket, search, state.people))
    .map((ticket) => ({
      ticket,
      stage: stageOf(ticket),
      handler: ticket.responsavel_id
        ? (state.people[ticket.responsavel_id]?.nome ?? null)
        : null,
      unread: unreadCount(state, ticket.id, meId),
    }))
    .sort(
      (first, second) =>
        attentionRank(first) - attentionRank(second) ||
        second.ticket.atualizado_em.localeCompare(first.ticket.atualizado_em),
    );
}

export function handlerLine(handler: string | null): string {
  return handler ? `Com ${handler}` : "Ainda sem responsável";
}

export function unreadLabel(unread: number): string {
  return unread === 1 ? "1 nova" : `${unread} novas`;
}
