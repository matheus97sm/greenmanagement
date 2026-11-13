import type { Priority, Ticket } from "./types";

export type SlaKind =
  "breached" | "critical" | "warning" | "ok" | "paused" | "finished";

export interface SlaInfo {
  kind: SlaKind;
  clock: "primeira_resposta" | "resolucao";
  remainingMs: number;
}

const HOUR = 3_600_000;
export const CRITICAL_MS = HOUR;
export const WARNING_MS = 4 * HOUR;

const PRIORITY_RANK: Record<Priority, number> = {
  critica: 0,
  alta: 1,
  media: 2,
  baixa: 3,
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
      ? "primeira_resposta"
      : "resolucao";
  const deadline = clock === "primeira_resposta" ? firstResponse! : resolution;

  if (ticket.status === "resolvido" || ticket.status === "fechado") {
    return {
      kind: "finished",
      clock: "resolucao",
      remainingMs: resolution - now,
    };
  }
  if (ticket.sla_pausado) {
    return {
      kind: "paused",
      clock: "resolucao",
      remainingMs: resolution - Date.parse(pausedAt),
    };
  }

  const remainingMs = deadline - now;
  const kind =
    remainingMs < 0
      ? "breached"
      : remainingMs < CRITICAL_MS
        ? "critical"
        : remainingMs < WARNING_MS
          ? "warning"
          : "ok";
  return { kind, clock, remainingMs };
}

function clockState(ticket: Ticket): 0 | 1 | 2 {
  if (ticket.status === "fechado" || ticket.status === "resolvido") return 2;
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
