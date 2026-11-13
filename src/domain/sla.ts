import type { Ticket } from "./types";
import { Status, Priority, SlaKind, SlaClock } from "./enums";

export interface SlaInfo {
  kind: SlaKind;
  clock: SlaClock;
  remainingMs: number;
}

const HOUR = 3_600_000;
export const CRITICAL_MS = HOUR;
export const WARNING_MS = 4 * HOUR;

const PRIORITY_RANK: Record<Priority, number> = {
  [Priority.Critical]: 0,
  [Priority.High]: 1,
  [Priority.Medium]: 2,
  [Priority.Low]: 3,
};

function pendingDeadline(ticket: Ticket): number {
  const resolution = Date.parse(ticket.prazo_resolucao);
  return ticket.primeira_resposta_em
    ? resolution
    : Math.min(resolution, Date.parse(ticket.prazo_primeira_resposta));
}

export function slaInfo(
  ticket: Ticket,
  now: number,
  pausedAt: string = ticket.atualizado_em,
): SlaInfo {
  const resolution = Date.parse(ticket.prazo_resolucao);
  const firstResponse = ticket.primeira_resposta_em
    ? null
    : Date.parse(ticket.prazo_primeira_resposta);
  const clock =
    firstResponse !== null && firstResponse < resolution
      ? SlaClock.FirstResponse
      : SlaClock.Resolution;
  const deadline =
    clock === SlaClock.FirstResponse ? firstResponse! : resolution;

  if (ticket.status === Status.Resolved || ticket.status === Status.Closed) {
    return {
      kind: SlaKind.Finished,
      clock: SlaClock.Resolution,
      remainingMs: resolution - now,
    };
  }
  if (ticket.sla_pausado) {
    return {
      kind: SlaKind.Paused,
      clock: SlaClock.Resolution,
      remainingMs: resolution - Date.parse(pausedAt),
    };
  }

  const remainingMs = deadline - now;
  const kind =
    remainingMs < 0
      ? SlaKind.Breached
      : remainingMs < CRITICAL_MS
        ? SlaKind.Critical
        : remainingMs < WARNING_MS
          ? SlaKind.Warning
          : SlaKind.Ok;
  return { kind, clock, remainingMs };
}

function clockState(ticket: Ticket): 0 | 1 | 2 {
  if (ticket.status === Status.Closed || ticket.status === Status.Resolved)
    return 2;
  return ticket.sla_pausado ? 1 : 0;
}

function urgencyTier(ticket: Ticket, now: number): 0 | 1 | 2 {
  if (clockState(ticket) !== 0) return 0;
  const remaining = pendingDeadline(ticket) - now;
  if (remaining < 0) return 0;
  return remaining < WARNING_MS ? 1 : 2;
}

export function compareBySla(now: number) {
  return (a: Ticket, b: Ticket): number =>
    clockState(a) - clockState(b) ||
    urgencyTier(a, now) - urgencyTier(b, now) ||
    PRIORITY_RANK[a.prioridade] - PRIORITY_RANK[b.prioridade] ||
    pendingDeadline(a) - pendingDeadline(b);
}
