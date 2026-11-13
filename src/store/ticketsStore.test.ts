import { describe, expect, it } from "vitest";
import type { DomainEvent, Snapshot, Ticket } from "../domain/types";
import { createTicketsStore, unreadCount } from "./ticketsStore";

const HOUR = 3_600_000;
const NOW = "2026-11-03T13:00:00.000Z";
const at = (hours: number) =>
  new Date(Date.parse(NOW) + hours * HOUR).toISOString();

const ticket: Ticket = {
  id: "ch-1",
  numero: 1,
  titulo: "Teste",
  descricao: "Descrição",
  categoria_id: "cat",
  grupo_id: "g1",
  prioridade: "media",
  status: "em_atendimento",
  solicitante_id: "cli",
  responsavel_id: "cons",
  aberto_em: at(-10),
  atualizado_em: at(-2),
  primeira_resposta_em: at(-9),
  prazo_primeira_resposta: at(-2),
  prazo_resolucao: at(14),
  sla_pausado: false,
  resolvido_em: null,
  fechado_em: null,
};

const snapshot: Snapshot = {
  agora: NOW,
  grupos: [],
  categorias: [],
  sla: [],
  usuarios: [
    {
      id: "cons",
      nome: "Consultor",
      email: "c@x",
      perfil: "consultor",
      locale: "pt-BR",
      zoneinfo: "America/Sao_Paulo",
    },
    {
      id: "cli",
      nome: "Cliente",
      email: "k@x",
      perfil: "cliente",
      locale: "pt-PT",
      zoneinfo: "Europe/Lisbon",
    },
  ],
  chamados: [ticket],
  mensagens: [],
  historico: [],
};

function message(
  id: string,
  when: string,
  author = "cli",
  internal = false,
): DomainEvent {
  return {
    id: `e-${id}`,
    tipo: "mensagem.adicionada",
    ocorrido_em: when,
    payload: {
      id,
      chamado_id: "ch-1",
      criada_em: when,
      autor_id: author,
      texto: "oi",
      interna: internal,
    },
  };
}

function statusEvent(
  eventId: string,
  to: "em_atendimento" | "aguardando_cliente" | "resolvido",
  when: string,
  from: "em_atendimento" | "aguardando_cliente" = "em_atendimento",
): DomainEvent {
  return {
    id: eventId,
    tipo: "status.alterado",
    ocorrido_em: when,
    payload: {
      chamado_id: "ch-1",
      de: from,
      para: to,
      motivo: "teste",
      usuario_id: "cons",
    },
  };
}

function newStore() {
  const store = createTicketsStore();
  store.loadSnapshot(snapshot);
  return store;
}

describe("ticketsStore", () => {
  it("ignores the same event delivered twice", () => {
    const store = newStore();
    const e = message("m1", at(1));
    expect(store.applyEvent(e)).toBe(true);
    expect(store.applyEvent(e)).toBe(false);
    expect(store.getState().messages["ch-1"]).toHaveLength(1);
  });

  it("does not duplicate a message that came with different event ids", () => {
    const store = newStore();
    store.applyEvent(message("m1", at(1)));
    store.applyEvent({ ...message("m1", at(1)), id: "another-event" });
    expect(store.getState().messages["ch-1"]).toHaveLength(1);
  });

  it("keeps messages in chronological order even if they arrive swapped", () => {
    const store = newStore();
    store.applyEvent(message("m2", at(2)));
    store.applyEvent(message("m1", at(1)));
    expect(store.getState().messages["ch-1"].map((m) => m.id)).toEqual([
      "m1",
      "m2",
    ]);
  });

  it("does not let an old status overwrite a newer one", () => {
    const store = newStore();
    store.applyEvent(statusEvent("s2", "resolvido", at(3)));
    store.applyEvent(statusEvent("s1", "aguardando_cliente", at(2)));
    const state = store.getState();
    expect(state.tickets["ch-1"].status).toBe("resolvido");
    expect(state.history["ch-1"]).toHaveLength(2);
  });

  it("holds events for an unknown ticket until it arrives", () => {
    const store = createTicketsStore();
    store.loadSnapshot({ ...snapshot, chamados: [] });
    store.applyEvent(statusEvent("s1", "aguardando_cliente", at(1)));
    expect(store.getState().tickets["ch-1"]).toBeUndefined();
    store.applyEvent({
      id: "opened",
      tipo: "chamado.aberto",
      ocorrido_em: ticket.aberto_em,
      payload: ticket,
    });
    expect(store.getState().tickets["ch-1"].status).toBe("aguardando_cliente");
  });

  it("stops the SLA clock and restarts it, pushing the deadline", () => {
    const store = newStore();
    store.applyEvent(statusEvent("pause", "aguardando_cliente", at(1)));
    expect(store.getState().tickets["ch-1"].sla_pausado).toBe(true);
    store.applyEvent(
      statusEvent("resume", "em_atendimento", at(4), "aguardando_cliente"),
    );
    const resumed = store.getState().tickets["ch-1"];
    expect(resumed.sla_pausado).toBe(false);

    expect(resumed.prazo_resolucao).toBe(at(17));
  });

  it("counts a public staff reply as the first response", () => {
    const store = createTicketsStore();
    store.loadSnapshot({
      ...snapshot,
      chamados: [{ ...ticket, primeira_resposta_em: null }],
    });
    store.applyEvent(message("m1", at(1), "cons"));
    expect(store.getState().tickets["ch-1"].primeira_resposta_em).toBe(at(1));
  });

  it("applies an assignment event to the ticket", () => {
    const store = createTicketsStore();
    store.loadSnapshot({
      ...snapshot,
      chamados: [{ ...ticket, responsavel_id: null, status: "aberto" }],
    });
    store.applyEvent({
      id: "assign",
      tipo: "chamado.atribuido",
      ocorrido_em: at(1),
      payload: { chamado_id: "ch-1", consultor_id: "cons" },
    });
    expect(store.getState().tickets["ch-1"].responsavel_id).toBe("cons");
  });

  it("counts as unread only other people's messages after the last read", () => {
    const store = newStore();
    const later = at(5);
    store.applyEvent(message("m1", later, "cli"));
    store.applyEvent(message("m2", later, "cons"));
    expect(unreadCount(store.getState(), "ch-1", "cons")).toBe(1);
    store.markRead("ch-1");
    store.applyEvent(message("m3", at(-5), "cli"));
    expect(unreadCount(store.getState(), "ch-1", "cons")).toBe(1);
  });

  it("forgets everything on reset", () => {
    const store = newStore();
    store.applyEvent(message("m1", at(1)));
    store.reset();
    expect(store.getState().status).toBe("idle");
    expect(store.getState().tickets).toEqual({});

    store.loadSnapshot(snapshot);
    expect(store.applyEvent(message("m1", at(1)))).toBe(true);
  });
});
