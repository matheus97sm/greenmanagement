import { groupIdsOf } from "@/domain/rules";
import type { DomainEvent, Person, Snapshot, Ticket } from "@/domain/types";
import type { Database } from "./db";
import { Profile, EventType } from "@/domain/enums";

export function canSeeTicket(viewer: Person, ticket: Ticket): boolean {
  switch (viewer.perfil) {
    case Profile.Customer:
      return ticket.solicitante_id === viewer.id;
    case Profile.Consultant:
      return (
        ticket.grupo_id === viewer.grupo_id ||
        ticket.responsavel_id === viewer.id
      );
    case Profile.Manager:
      return groupIdsOf(viewer).includes(ticket.grupo_id);
  }
}

export function eventFor(
  viewer: Person,
  event: DomainEvent,
  database: Database,
): DomainEvent | null {
  if (event.tipo === EventType.TicketOpened) {
    return canSeeTicket(viewer, event.payload) ? event : null;
  }
  const ticket = database.chamados.find(
    (currentTicket) => currentTicket.id === event.payload.chamado_id,
  );
  if (!ticket || !canSeeTicket(viewer, ticket)) return null;
  if (
    event.tipo === EventType.MessageAdded &&
    event.payload.interna &&
    viewer.perfil === Profile.Customer
  ) {
    return null;
  }
  return event;
}

export function scopedSnapshot(database: Database, viewer: Person): Snapshot {
  const chamados = database.chamados.filter((ticket) =>
    canSeeTicket(viewer, ticket),
  );
  const ids = new Set(chamados.map((ticket) => ticket.id));
  return structuredClone({
    agora: database.agora,
    grupos: database.grupos,
    categorias: database.categorias,
    sla: database.sla,

    usuarios:
      viewer.perfil === Profile.Customer
        ? database.usuarios.filter(
            (person) =>
              person.perfil !== Profile.Customer || person.id === viewer.id,
          )
        : database.usuarios,
    chamados,
    mensagens: database.mensagens.filter(
      (message) =>
        ids.has(message.chamado_id) &&
        !(viewer.perfil === Profile.Customer && message.interna),
    ),
    historico: database.historico.filter((historyEntry) =>
      ids.has(historyEntry.chamado_id),
    ),
  });
}
