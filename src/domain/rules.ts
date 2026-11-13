import type { HistoryEntry, Message, Person, Status, Ticket } from "./types";

const later = (a: string, b: string) => (a > b ? a : b);

export function groupIdsOf(person: Person): string[] {
  return person.grupos_ids ?? (person.grupo_id ? [person.grupo_id] : []);
}

export function isStaff(person: Person | undefined): boolean {
  return person?.perfil === "consultor" || person?.perfil === "gestor";
}

export function pausedSince(
  ticket: Ticket,
  history: HistoryEntry[] | undefined,
): string {
  const entry = [...(history ?? [])]
    .reverse()
    .find((h) => h.tipo === "status" && h.para === "aguardando_cliente");

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

export function applyStatusChange(
  ticket: Ticket,
  change: { para: Status; ocorrido_em: string },
  history: HistoryEntry[] | undefined,
): Ticket {
  const next: Ticket = {
    ...ticket,
    status: change.para,
    atualizado_em: later(ticket.atualizado_em, change.ocorrido_em),
  };

  if (change.para === "aguardando_cliente") {
    next.sla_pausado = true;
  } else if (ticket.sla_pausado) {
    const stoppedMs =
      Date.parse(change.ocorrido_em) - Date.parse(pausedSince(ticket, history));
    next.prazo_resolucao = new Date(
      Date.parse(ticket.prazo_resolucao) + Math.max(0, stoppedMs),
    ).toISOString();
    next.sla_pausado = false;
  }

  if (change.para === "resolvido") next.resolvido_em = change.ocorrido_em;
  if (change.para === "fechado") next.fechado_em = change.ocorrido_em;
  return next;
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
