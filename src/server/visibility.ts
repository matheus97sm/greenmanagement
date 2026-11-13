import { groupIdsOf } from "@/domain/rules";
import type { DomainEvent, Person, Snapshot, Ticket } from "@/domain/types";
import type { Db } from "./db";
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
  db: Db,
): DomainEvent | null {
  if (event.tipo === EventType.TicketOpened) {
    return canSeeTicket(viewer, event.payload) ? event : null;
  }
  const ticket = db.chamados.find((c) => c.id === event.payload.chamado_id);
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

export function scopedSnapshot(db: Db, viewer: Person): Snapshot {
  const chamados = db.chamados.filter((t) => canSeeTicket(viewer, t));
  const ids = new Set(chamados.map((t) => t.id));
  return structuredClone({
    agora: db.agora,
    grupos: db.grupos,
    categorias: db.categorias,
    sla: db.sla,

    usuarios:
      viewer.perfil === Profile.Customer
        ? db.usuarios.filter(
            (u) => u.perfil !== Profile.Customer || u.id === viewer.id,
          )
        : db.usuarios,
    chamados,
    mensagens: db.mensagens.filter(
      (m) =>
        ids.has(m.chamado_id) &&
        !(viewer.perfil === Profile.Customer && m.interna),
    ),
    historico: db.historico.filter((h) => ids.has(h.chamado_id)),
  });
}
