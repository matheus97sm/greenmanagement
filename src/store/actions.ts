import { notifications } from "@mantine/notifications";
import type { DomainEvent } from "@/domain/types";
import * as api from "@/server/api";
import { ticketsStore } from "./ticketsStore";
import { Status } from "@/domain/enums";

async function run(call: () => Promise<DomainEvent[]>): Promise<boolean> {
  try {
    const events = await call();
    events.forEach((e) => ticketsStore.applyEvent(e));
    return true;
  } catch (error) {
    notifications.show({
      color: "red",
      title: "Não foi possível concluir",
      message: error instanceof Error ? error.message : "Erro inesperado.",
    });
    return false;
  }
}

export const takeTicket = (ticketId: string, consultantId: string) =>
  run(() => api.assumeTicket(ticketId, consultantId));

export const sendMessage = (input: {
  ticketId: string;
  authorId: string;
  text: string;
  internal: boolean;
}) => run(() => api.sendMessage(input));

export const changeStatus = (input: {
  ticketId: string;
  to: Status;
  reason: string;
  userId: string;
}) => run(() => api.changeStatus(input));
