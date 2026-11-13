import type { Ticket } from "./types";

export type SlaKind =
  "breached" | "critical" | "warning" | "ok" | "paused" | "finished";

export interface SlaInfo {
  kind: SlaKind;
  clock: "primeira_resposta" | "resolucao";
  remainingMs: number;
}

const HOUR = 3_600_000;

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
      : remainingMs < HOUR
        ? "critical"
        : remainingMs < 4 * HOUR
          ? "warning"
          : "ok";
  return { kind, clock, remainingMs };
}

export function sortKey(ticket: Ticket): [number, number] {
  const group =
    ticket.status === "fechado" || ticket.status === "resolvido"
      ? 2
      : ticket.sla_pausado
        ? 1
        : 0;
  const resolution = Date.parse(ticket.prazo_resolucao);
  const firstResponse = ticket.primeira_resposta_em
    ? Infinity
    : Date.parse(ticket.prazo_primeira_resposta);
  return [group, Math.min(resolution, firstResponse)];
}

export function compareBySla(a: Ticket, b: Ticket): number {
  const [ga, pa] = sortKey(a);
  const [gb, pb] = sortKey(b);
  return ga - gb || pa - pb;
}
