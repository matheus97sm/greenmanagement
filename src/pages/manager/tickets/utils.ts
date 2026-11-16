import type { Ticket } from "@/domain/types";
import { ALL_GROUPS } from "./constants";

export function filterByGroup(tickets: Ticket[], groupId: string): Ticket[] {
  return groupId === ALL_GROUPS
    ? tickets
    : tickets.filter((t) => t.grupo_id === groupId);
}
