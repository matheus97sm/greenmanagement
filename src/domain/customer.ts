import { CustomerStage, Expectation, Status } from "./enums";
import { isActive } from "./status";
import type { Ticket } from "./types";

export interface NextExpectation {
  kind: Expectation;
  at: string | null;
  overdue: boolean;
}

export function stageOf(ticket: Ticket): CustomerStage {
  switch (ticket.status) {
    case Status.Open:
      return ticket.responsavel_id
        ? CustomerStage.Assigned
        : CustomerStage.Received;
    case Status.InProgress:
      return CustomerStage.InProgress;
    case Status.WaitingCustomer:
      return CustomerStage.WaitingYou;
    case Status.Resolved:
      return CustomerStage.Resolved;
    case Status.Closed:
      return CustomerStage.Closed;
  }
}

export function nextExpectation(ticket: Ticket, now: number): NextExpectation {
  if (!isActive(ticket.status) || ticket.sla_pausado) {
    return { kind: Expectation.None, at: null, overdue: false };
  }
  const waitingFirstResponse = ticket.primeira_resposta_em === null;
  const at = waitingFirstResponse
    ? ticket.prazo_primeira_resposta
    : ticket.prazo_resolucao;
  return {
    kind: waitingFirstResponse
      ? Expectation.FirstResponse
      : Expectation.Resolution,
    at,
    overdue: Date.parse(at) < now,
  };
}

export function canReopen(ticket: Ticket): boolean {
  return !isActive(ticket.status);
}
