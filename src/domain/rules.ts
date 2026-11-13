import type { HistoryEntry, Message, Person, SlaPolicy, Ticket } from "./types";
import { Status, Profile, HistoryType } from "./enums";

const HOUR = 3_600_000;

const later = (a: string, b: string) => (a > b ? a : b);

export function groupIdsOf(person: Person): string[] {
  return person.grupos_ids ?? (person.grupo_id ? [person.grupo_id] : []);
}

export function isStaff(person: Person | undefined): boolean {
  return (
    person?.perfil === Profile.Consultant || person?.perfil === Profile.Manager
  );
}

export function pausedSince(
  ticket: Ticket,
  history: HistoryEntry[] | undefined,
): string {
  const entry = [...(history ?? [])]
    .reverse()
    .find(
      (h) => h.tipo === HistoryType.Status && h.para === Status.WaitingCustomer,
    );

  return entry?.ocorrido_em ?? ticket.atualizado_em;
}

export function applyAssignment(
  ticket: Ticket,
  consultantId: string,
  at: string,
): Ticket {
  return {
    ...ticket,
    responsavel_id: consultantId,
    atualizado_em: later(ticket.atualizado_em, at),
  };
}

export function renewSla(
  ticket: Ticket,
  from: string,
  policies: SlaPolicy[],
  firstResponseAt: string | null = null,
): Ticket {
  const policy = policies.find((p) => p.prioridade === ticket.prioridade);
  if (!policy) return ticket;
  const start = Date.parse(from);
  return {
    ...ticket,
    primeira_resposta_em: firstResponseAt,
    prazo_primeira_resposta: new Date(
      start + policy.primeira_resposta_horas * HOUR,
    ).toISOString(),
    prazo_resolucao: new Date(
      start + policy.resolucao_horas * HOUR,
    ).toISOString(),
  };
}

export function applyStatusChange(
  ticket: Ticket,
  change: { de: Status; para: Status; ocorrido_em: string },
  history: HistoryEntry[] | undefined,
  policies: SlaPolicy[],
): Ticket {
  const next: Ticket = {
    ...ticket,
    status: change.para,
    atualizado_em: later(ticket.atualizado_em, change.ocorrido_em),
  };

  if (change.para === Status.WaitingCustomer) {
    next.sla_pausado = true;
  } else if (ticket.sla_pausado) {
    const stoppedMs =
      Date.parse(change.ocorrido_em) - Date.parse(pausedSince(ticket, history));
    next.prazo_resolucao = new Date(
      Date.parse(ticket.prazo_resolucao) + Math.max(0, stoppedMs),
    ).toISOString();
    next.sla_pausado = false;
  }

  if (change.para === Status.Resolved) next.resolvido_em = change.ocorrido_em;
  if (change.para === Status.Closed) next.fechado_em = change.ocorrido_em;

  const reopenedFromClosed =
    change.de === Status.Closed && change.para === Status.InProgress;
  return reopenedFromClosed
    ? renewSla(next, change.ocorrido_em, policies)
    : next;
}

export function applyMessage(
  ticket: Ticket,
  message: Message,
  authorIsStaff: boolean,
): Ticket {
  return {
    ...ticket,
    atualizado_em: later(ticket.atualizado_em, message.criada_em),
    primeira_resposta_em:
      ticket.primeira_resposta_em ??
      (authorIsStaff && !message.interna ? message.criada_em : null),
  };
}
