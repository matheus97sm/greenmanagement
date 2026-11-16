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

export const markRead = (ticketId: string) => ticketsStore.markRead(ticketId);

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

export interface ReassignResult {
  done: number;
  failed: number;
}

export async function reassignTickets(input: {
  ticketIds: string[];
  consultantId: string;
  managerId: string;
}): Promise<ReassignResult> {
  const { ticketIds, ...rest } = input;
  const results = await Promise.allSettled(
    ticketIds.map((ticketId) => api.reassignTicket({ ticketId, ...rest })),
  );
  let done = 0;
  const errors: string[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      result.value.forEach((e) => ticketsStore.applyEvent(e));
      done += 1;
    } else {
      errors.push(
        result.reason instanceof Error
          ? result.reason.message
          : "Erro inesperado.",
      );
    }
  }
  if (done > 0) {
    notifications.show({
      color: "green",
      message:
        done === 1
          ? "1 chamado redistribuído."
          : `${done} chamados redistribuídos.`,
    });
  }
  if (errors.length > 0) {
    notifications.show({
      color: "red",
      title: `${errors.length} não ${errors.length === 1 ? "foi redistribuído" : "foram redistribuídos"}`,
      message: errors[0],
    });
  }
  return { done, failed: errors.length };
}

export const reopenTicket = (input: {
  ticketId: string;
  customerId: string;
  reason: string;
}) => run(() => api.reopenTicket(input));
