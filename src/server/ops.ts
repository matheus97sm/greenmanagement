import { isReopen, TRANSITIONS } from "../domain/status";
import {
  applyAssignment,
  applyMessage,
  applyStatusChange,
  isStaff,
} from "../domain/rules";
import type {
  DomainEvent,
  HistoryEntry,
  Message,
  Person,
  Priority,
  Status,
  Ticket,
} from "../domain/types";
import { nowIso } from "../lib/clock";
import { getDb, nextTicketNumber } from "./db";
import { publish } from "./socket";

export class ApiError extends Error {}

const HOUR = 3_600_000;

function person(id: string): Person | undefined {
  return getDb().usuarios.find((u) => u.id === id);
}

function nameOf(id: string | null): string {
  return (id && person(id)?.nome) || "outra pessoa";
}

function findTicket(id: string): Ticket {
  const ticket = getDb().chamados.find((t) => t.id === id);
  if (!ticket) throw new ApiError("Chamado não encontrado.");
  return ticket;
}

function emit(event: DomainEvent): DomainEvent {
  publish(event);
  return event;
}

function historyOf(ticketId: string): HistoryEntry[] {
  return getDb().historico.filter((h) => h.chamado_id === ticketId);
}

function commitStatus(
  ticket: Ticket,
  to: Status,
  reason: string,
  userId: string,
): DomainEvent {
  const db = getDb();
  const at = nowIso();
  const id = crypto.randomUUID();
  const from = ticket.status;
  Object.assign(
    ticket,
    applyStatusChange(
      ticket,
      { de: from, para: to, ocorrido_em: at },
      historyOf(ticket.id),
      db.sla,
    ),
  );
  db.historico.push({
    id,
    chamado_id: ticket.id,
    tipo: "status",
    de: from,
    para: to,
    usuario_id: userId,
    motivo: reason,
    ocorrido_em: at,
  });
  return emit({
    id,
    tipo: "status.alterado",
    ocorrido_em: at,
    payload: {
      chamado_id: ticket.id,
      de: from,
      para: to,
      motivo: reason,
      usuario_id: userId,
    },
  });
}

export function openTicket(input: {
  requesterId: string;
  categoryId: string;
  priority: Priority;
  title: string;
  description: string;
}): DomainEvent[] {
  const db = getDb();
  const requester = person(input.requesterId);
  if (requester?.perfil !== "cliente") {
    throw new ApiError("Só clientes abrem chamados.");
  }
  const category = db.categorias.find((c) => c.id === input.categoryId);
  if (!category) throw new ApiError("Categoria inválida.");
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) {
    throw new ApiError("Informe o título e a descrição.");
  }
  const policy = db.sla.find((s) => s.prioridade === input.priority);
  if (!policy) throw new ApiError("Prioridade inválida.");

  const at = nowIso();
  const opened = Date.parse(at);
  const ticket: Ticket = {
    id: crypto.randomUUID(),
    numero: nextTicketNumber(),
    titulo: title,
    descricao: description,
    categoria_id: category.id,
    grupo_id: category.grupo_id,
    prioridade: input.priority,
    status: "aberto",
    solicitante_id: requester.id,
    responsavel_id: null,
    aberto_em: at,
    atualizado_em: at,
    primeira_resposta_em: null,
    prazo_primeira_resposta: new Date(
      opened + policy.primeira_resposta_horas * HOUR,
    ).toISOString(),
    prazo_resolucao: new Date(
      opened + policy.resolucao_horas * HOUR,
    ).toISOString(),
    sla_pausado: false,
    resolvido_em: null,
    fechado_em: null,
  };
  db.chamados.push(ticket);
  return [
    emit({
      id: crypto.randomUUID(),
      tipo: "chamado.aberto",
      ocorrido_em: at,
      payload: structuredClone(ticket),
    }),
  ];
}

export function assumeTicket(
  ticketId: string,
  consultantId: string,
): DomainEvent[] {
  const db = getDb();
  const ticket = findTicket(ticketId);
  const consultant = person(consultantId);
  if (consultant?.perfil !== "consultor") {
    throw new ApiError("Só consultores pegam chamados.");
  }
  if (ticket.responsavel_id === consultantId) return [];
  if (ticket.responsavel_id) {
    throw new ApiError(
      `Este chamado já foi pego por ${nameOf(ticket.responsavel_id)}.`,
    );
  }
  if (consultant.grupo_id !== ticket.grupo_id) {
    throw new ApiError("Este chamado é de outro grupo de atendimento.");
  }

  const at = nowIso();
  const id = crypto.randomUUID();
  Object.assign(ticket, applyAssignment(ticket, consultantId, at));
  db.historico.push({
    id,
    chamado_id: ticket.id,
    tipo: "atribuicao",
    de: null,
    para: null,
    usuario_id: consultantId,
    motivo: null,
    ocorrido_em: at,
  });
  const events: DomainEvent[] = [
    emit({
      id,
      tipo: "chamado.atribuido",
      ocorrido_em: at,
      payload: { chamado_id: ticket.id, consultor_id: consultantId },
    }),
  ];
  if (ticket.status === "aberto") {
    events.push(
      commitStatus(
        ticket,
        "em_atendimento",
        "Assumido para atendimento",
        consultantId,
      ),
    );
  }
  return events;
}

export function addMessage(input: {
  ticketId: string;
  authorId: string;
  text: string;
  internal: boolean;
}): DomainEvent[] {
  const db = getDb();
  const ticket = findTicket(input.ticketId);
  const author = person(input.authorId);
  const text = input.text.trim();
  if (!author) throw new ApiError("Autor desconhecido.");
  if (!text) throw new ApiError("A mensagem está vazia.");

  if (author.perfil === "cliente") {
    if (ticket.solicitante_id !== author.id) {
      throw new ApiError("Este chamado não é seu.");
    }
    if (input.internal) {
      throw new ApiError("Clientes não escrevem notas internas.");
    }
  } else if (
    !input.internal &&
    author.perfil === "consultor" &&
    ticket.responsavel_id !== author.id
  ) {
    throw new ApiError("Só quem atende o chamado responde ao cliente.");
  }

  const message: Message = {
    id: crypto.randomUUID(),
    chamado_id: ticket.id,
    criada_em: nowIso(),
    autor_id: author.id,
    texto: text,
    interna: input.internal,
  };
  db.mensagens.push(message);
  Object.assign(ticket, applyMessage(ticket, message, isStaff(author)));

  const events: DomainEvent[] = [
    emit({
      id: crypto.randomUUID(),
      tipo: "mensagem.adicionada",
      ocorrido_em: message.criada_em,
      payload: structuredClone(message),
    }),
  ];

  if (author.perfil === "cliente" && ticket.status === "aguardando_cliente") {
    events.push(
      commitStatus(ticket, "em_atendimento", "Cliente respondeu", author.id),
    );
  }
  return events;
}

export function changeStatus(input: {
  ticketId: string;
  to: Status;
  reason: string;
  userId: string;
}): DomainEvent[] {
  const ticket = findTicket(input.ticketId);
  const user = person(input.userId);
  const reason = input.reason.trim();
  if (!user || user.perfil === "cliente") {
    throw new ApiError("Você não pode alterar o status deste chamado.");
  }
  if (user.perfil === "consultor" && ticket.responsavel_id !== user.id) {
    throw new ApiError("Só quem atende o chamado altera o status.");
  }
  if (!reason) throw new ApiError("Informe o motivo da mudança.");
  if (!TRANSITIONS[ticket.status].includes(input.to)) {
    throw new ApiError("Essa mudança de status não é permitida.");
  }
  const storedReason = isReopen(ticket.status, input.to)
    ? `Reaberto: ${reason}`
    : reason;
  return [commitStatus(ticket, input.to, storedReason, user.id)];
}
