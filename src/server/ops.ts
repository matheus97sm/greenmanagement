import { isActive, isReopen, TRANSITIONS } from "@/domain/status";
import {
  applyAssignment,
  applyMessage,
  applyStatusChange,
  groupIdsOf,
  isStaff,
} from "@/domain/rules";
import type {
  DomainEvent,
  HistoryEntry,
  Message,
  Person,
  Ticket,
} from "@/domain/types";
import { nowIso } from "@/lib/clock";
import { getDb, nextTicketNumber } from "./db";
import { ApiError } from "./errors";
import { publish } from "./socket";
import {
  ApiErrorCode,
  Status,
  Priority,
  Profile,
  EventType,
  HistoryType,
} from "@/domain/enums";

export { ApiError };

const HOUR = 3_600_000;

function person(id: string): Person | undefined {
  return getDb().usuarios.find((currentPerson) => currentPerson.id === id);
}

function findTicket(id: string): Ticket {
  const ticket = getDb().chamados.find(
    (currentTicket) => currentTicket.id === id,
  );
  if (!ticket) throw new ApiError(ApiErrorCode.TicketNotFound);
  return ticket;
}

function emit(event: DomainEvent): DomainEvent {
  publish(event);
  return event;
}

function historyOf(ticketId: string): HistoryEntry[] {
  return getDb().historico.filter(
    (historyEntry) => historyEntry.chamado_id === ticketId,
  );
}

function commitStatus(
  ticket: Ticket,
  to: Status,
  reason: string,
  userId: string,
): DomainEvent {
  const database = getDb();
  const at = nowIso();
  const id = crypto.randomUUID();
  const from = ticket.status;
  Object.assign(
    ticket,
    applyStatusChange(
      ticket,
      { de: from, para: to, ocorrido_em: at },
      historyOf(ticket.id),
      database.sla,
    ),
  );
  database.historico.push({
    id,
    chamado_id: ticket.id,
    tipo: HistoryType.Status,
    de: from,
    para: to,
    usuario_id: userId,
    motivo: reason,
    ocorrido_em: at,
  });
  return emit({
    id,
    tipo: EventType.StatusChanged,
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

function commitAssignment(ticket: Ticket, consultantId: string): DomainEvent {
  const at = nowIso();
  const id = crypto.randomUUID();
  Object.assign(ticket, applyAssignment(ticket, consultantId, at));
  getDb().historico.push({
    id,
    chamado_id: ticket.id,
    tipo: HistoryType.Assignment,
    de: null,
    para: null,
    usuario_id: consultantId,
    motivo: null,
    ocorrido_em: at,
  });
  return emit({
    id,
    tipo: EventType.TicketAssigned,
    ocorrido_em: at,
    payload: { chamado_id: ticket.id, consultor_id: consultantId },
  });
}

export function openTicket(input: {
  requesterId: string;
  categoryId: string;
  priority: Priority;
  title: string;
  description: string;
}): DomainEvent[] {
  const database = getDb();
  const requester = person(input.requesterId);
  if (requester?.perfil !== Profile.Customer) {
    throw new ApiError(ApiErrorCode.OnlyCustomersOpenTickets);
  }
  const category = database.categorias.find(
    (currentCategory) => currentCategory.id === input.categoryId,
  );
  if (!category) throw new ApiError(ApiErrorCode.InvalidCategory);
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) {
    throw new ApiError(ApiErrorCode.TitleAndDescriptionRequired);
  }
  const policy = database.sla.find(
    (slaPolicy) => slaPolicy.prioridade === input.priority,
  );
  if (!policy) throw new ApiError(ApiErrorCode.InvalidPriority);

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
    status: Status.Open,
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
  database.chamados.push(ticket);
  return [
    emit({
      id: crypto.randomUUID(),
      tipo: EventType.TicketOpened,
      ocorrido_em: at,
      payload: structuredClone(ticket),
    }),
  ];
}

export function assumeTicket(
  ticketId: string,
  consultantId: string,
): DomainEvent[] {
  const ticket = findTicket(ticketId);
  const consultant = person(consultantId);
  if (consultant?.perfil !== Profile.Consultant) {
    throw new ApiError(ApiErrorCode.OnlyConsultantsTakeTickets);
  }
  if (ticket.responsavel_id === consultantId) return [];
  if (ticket.responsavel_id) {
    const holder = person(ticket.responsavel_id)?.nome;
    throw holder
      ? new ApiError(ApiErrorCode.TicketTakenByPerson, { name: holder })
      : new ApiError(ApiErrorCode.TicketTakenBySomeone);
  }
  if (consultant.grupo_id !== ticket.grupo_id) {
    throw new ApiError(ApiErrorCode.TicketOfOtherGroup);
  }

  const events: DomainEvent[] = [commitAssignment(ticket, consultantId)];
  if (ticket.status === Status.Open) {
    events.push(
      commitStatus(
        ticket,
        Status.InProgress,
        "Assumido para atendimento",
        consultantId,
      ),
    );
  }
  return events;
}

export function reassignTicket(input: {
  ticketId: string;
  consultantId: string;
  managerId: string;
}): DomainEvent[] {
  const ticket = findTicket(input.ticketId);
  const manager = person(input.managerId);
  const consultant = person(input.consultantId);
  if (
    manager?.perfil !== Profile.Manager ||
    !groupIdsOf(manager).includes(ticket.grupo_id)
  ) {
    throw new ApiError(ApiErrorCode.OnlyManagerReassigns);
  }
  if (consultant?.perfil !== Profile.Consultant) {
    throw new ApiError(ApiErrorCode.OnlyConsultantsReceiveTickets);
  }
  if (consultant.grupo_id !== ticket.grupo_id) {
    throw new ApiError(ApiErrorCode.ConsultantOfOtherGroup);
  }
  if (!isActive(ticket.status)) {
    throw new ApiError(ApiErrorCode.FinishedTicketsStay);
  }
  if (ticket.responsavel_id === consultant.id) return [];
  return [commitAssignment(ticket, consultant.id)];
}

export function addMessage(input: {
  ticketId: string;
  authorId: string;
  text: string;
  internal: boolean;
}): DomainEvent[] {
  const database = getDb();
  const ticket = findTicket(input.ticketId);
  const author = person(input.authorId);
  const text = input.text.trim();
  if (!author) throw new ApiError(ApiErrorCode.UnknownAuthor);
  if (!text) throw new ApiError(ApiErrorCode.EmptyMessage);

  if (author.perfil === Profile.Customer) {
    if (ticket.solicitante_id !== author.id) {
      throw new ApiError(ApiErrorCode.NotYourTicket);
    }
    if (!isActive(ticket.status)) {
      throw new ApiError(ApiErrorCode.TicketFinishedReopenToWrite);
    }
    if (input.internal) {
      throw new ApiError(ApiErrorCode.CustomersWriteNoInternalNotes);
    }
  } else if (
    !input.internal &&
    author.perfil === Profile.Consultant &&
    ticket.responsavel_id !== author.id
  ) {
    throw new ApiError(ApiErrorCode.OnlyAssigneeRepliesToCustomer);
  }

  const message: Message = {
    id: crypto.randomUUID(),
    chamado_id: ticket.id,
    criada_em: nowIso(),
    autor_id: author.id,
    texto: text,
    interna: input.internal,
  };
  database.mensagens.push(message);
  Object.assign(ticket, applyMessage(ticket, message, isStaff(author)));

  const events: DomainEvent[] = [
    emit({
      id: crypto.randomUUID(),
      tipo: EventType.MessageAdded,
      ocorrido_em: message.criada_em,
      payload: structuredClone(message),
    }),
  ];

  if (
    author.perfil === Profile.Customer &&
    ticket.status === Status.WaitingCustomer
  ) {
    events.push(
      commitStatus(ticket, Status.InProgress, "Cliente respondeu", author.id),
    );
  }
  return events;
}

export function reopenTicket(input: {
  ticketId: string;
  customerId: string;
  reason: string;
}): DomainEvent[] {
  const ticket = findTicket(input.ticketId);
  const customer = person(input.customerId);
  if (
    customer?.perfil !== Profile.Customer ||
    ticket.solicitante_id !== customer.id
  ) {
    throw new ApiError(ApiErrorCode.NotYourTicket);
  }
  if (isActive(ticket.status)) {
    throw new ApiError(ApiErrorCode.TicketStillActive);
  }
  const reason = input.reason.trim();
  if (!reason) throw new ApiError(ApiErrorCode.ReopenReasonRequired);

  const reopened = commitStatus(
    ticket,
    Status.InProgress,
    `Reaberto: ${reason}`,
    customer.id,
  );
  return [
    reopened,
    ...addMessage({
      ticketId: ticket.id,
      authorId: customer.id,
      text: reason,
      internal: false,
    }),
  ];
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
  if (!user || user.perfil === Profile.Customer) {
    throw new ApiError(ApiErrorCode.CannotChangeStatus);
  }
  if (user.perfil === Profile.Consultant && ticket.responsavel_id !== user.id) {
    throw new ApiError(ApiErrorCode.OnlyAssigneeChangesStatus);
  }
  if (!reason) throw new ApiError(ApiErrorCode.StatusReasonRequired);
  if (!TRANSITIONS[ticket.status].includes(input.to)) {
    throw new ApiError(ApiErrorCode.StatusChangeNotAllowed);
  }
  const storedReason = isReopen(ticket.status, input.to)
    ? `Reaberto: ${reason}`
    : reason;
  return [commitStatus(ticket, input.to, storedReason, user.id)];
}
