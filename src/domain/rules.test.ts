import { describe, expect, it } from "vitest";
import {
  applyAssignment,
  applyMessage,
  applyStatusChange,
  pausedSince,
} from "./rules";
import type { HistoryEntry, Message, Ticket } from "./types";

const HOUR = 3_600_000;
const T0 = Date.parse("2026-11-03T10:00:00.000Z");
const at = (hours: number) => new Date(T0 + hours * HOUR).toISOString();

const base: Ticket = {
  id: "t",
  numero: 1,
  titulo: "",
  descricao: "",
  categoria_id: "c",
  grupo_id: "g",
  prioridade: "media",
  status: "em_atendimento",
  solicitante_id: "s",
  responsavel_id: "r",
  aberto_em: at(-5),
  atualizado_em: at(-1),
  primeira_resposta_em: null,
  prazo_primeira_resposta: at(3),
  prazo_resolucao: at(20),
  sla_pausado: false,
  resolvido_em: null,
  fechado_em: null,
};

const waiting: HistoryEntry = {
  id: "h1",
  chamado_id: "t",
  tipo: "status",
  de: "em_atendimento",
  para: "aguardando_cliente",
  usuario_id: "r",
  motivo: "Aguardando retorno",
  ocorrido_em: at(1),
};

describe("applyStatusChange", () => {
  it("stops the SLA clock when the ticket starts waiting for the customer", () => {
    const next = applyStatusChange(
      base,
      { para: "aguardando_cliente", ocorrido_em: at(1) },
      [],
    );
    expect(next.status).toBe("aguardando_cliente");
    expect(next.sla_pausado).toBe(true);
    expect(next.prazo_resolucao).toBe(base.prazo_resolucao);
  });

  it("pushes the resolution deadline by however long the clock was stopped", () => {
    const paused = {
      ...base,
      status: "aguardando_cliente",
      sla_pausado: true,
    } as Ticket;
    const next = applyStatusChange(
      paused,
      { para: "em_atendimento", ocorrido_em: at(6) },
      [waiting],
    );
    expect(next.sla_pausado).toBe(false);

    expect(next.prazo_resolucao).toBe(at(25));
  });

  it("records when a ticket is resolved or closed", () => {
    const resolved = applyStatusChange(
      base,
      { para: "resolvido", ocorrido_em: at(2) },
      [],
    );
    expect(resolved.resolvido_em).toBe(at(2));
    const closed = applyStatusChange(
      resolved,
      { para: "fechado", ocorrido_em: at(3) },
      [],
    );
    expect(closed.fechado_em).toBe(at(3));
  });

  it("never moves the last-activity date backwards", () => {
    const next = applyStatusChange(
      base,
      { para: "resolvido", ocorrido_em: at(-3) },
      [],
    );
    expect(next.atualizado_em).toBe(base.atualizado_em);
  });
});

describe("pausedSince", () => {
  it("uses the latest entry that stopped the clock", () => {
    expect(pausedSince(base, [waiting])).toBe(at(1));
  });

  it("falls back to the last activity when the history is incomplete", () => {
    expect(pausedSince(base, [])).toBe(base.atualizado_em);
    expect(pausedSince(base, undefined)).toBe(base.atualizado_em);
  });
});

describe("applyMessage", () => {
  const message = (overrides: Partial<Message>): Message => ({
    id: "m",
    chamado_id: "t",
    criada_em: at(2),
    autor_id: "r",
    texto: "oi",
    interna: false,
    ...overrides,
  });

  it("counts a public staff reply as the first response", () => {
    expect(applyMessage(base, message({}), true).primeira_resposta_em).toBe(
      at(2),
    );
  });

  it("does not count internal notes or customer messages", () => {
    expect(
      applyMessage(base, message({ interna: true }), true).primeira_resposta_em,
    ).toBeNull();
    expect(
      applyMessage(base, message({}), false).primeira_resposta_em,
    ).toBeNull();
  });

  it("keeps the original first response", () => {
    const answered = { ...base, primeira_resposta_em: at(-2) };
    expect(applyMessage(answered, message({}), true).primeira_resposta_em).toBe(
      at(-2),
    );
  });
});

describe("applyAssignment", () => {
  it("sets the assignee and bumps the last activity", () => {
    const next = applyAssignment(base, "other", at(1));
    expect(next.responsavel_id).toBe("other");
    expect(next.atualizado_em).toBe(at(1));
  });
});
