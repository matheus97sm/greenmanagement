import { useSyncExternalStore } from "react";
import { ticketsStore } from "./ticketsStore";
import type { TicketsState } from "./ticketsStore";

export function useTickets(): TicketsState {
  return useSyncExternalStore(ticketsStore.subscribe, ticketsStore.getState);
}
