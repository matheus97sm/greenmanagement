import { describe, expect, it } from "vitest";
import {
  applyAssignment,
  applyMessage,
  applyStatusChange,
  pausedSince,
  renewSla,
} from "./rules";
import type { HistoryEntry, Message, SlaPolicy, Ticket } from "./types";
import { Status, Priority, HistoryType } from "./enums";

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
  prioridade: Priority.Medium,
  status: Status.InProgress,
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

const policies: SlaPolicy[] = [
  {
    prioridade: Priority.Medium,
    primeira_resposta_horas: 8,
    resolucao_horas: 24,
  },
];

const waiting: HistoryEntry = {
  id: "h1",
  chamado_id: "t",
  tipo: HistoryType.Status,
  de: Status.InProgress,
  para: Status.WaitingCustomer,
  usuario_id: "r",
  motivo: "Aguardando retorno",
  ocorrido_em: at(1),
};

describe("applyStatusChange", () => {
  it("stops the SLA clock when the ticket starts waiting for the customer", () => {
    const next = applyStatusChange(
      base,
      {
        de: Status.InProgress,
        para: Status.WaitingCustomer,
        ocorrido_em: at(1),
      },
      [],
      policies,
    );
    expect(next.status).toBe(Status.WaitingCustomer);
    expect(next.sla_pausado).toBe(true);
    expect(next.prazo_resolucao).toBe(base.prazo_resolucao);
  });

  it("pushes the resolution deadline by however long the clock was stopped", () => {
    const paused = {
      ...base,
      status: Status.WaitingCustomer,
      sla_pausado: true,
    } as Ticket;
    const next = applyStatusChange(
      paused,
      {
        de: Status.WaitingCustomer,
        para: Status.InProgress,
        ocorrido_em: at(6),
      },
      [waiting],
      policies,
    );
    expect(next.sla_pausado).toBe(false);
    expect(next.prazo_resolucao).toBe(at(25));
  });

  it("records when a ticket is resolved or closed", () => {
    const resolved = applyStatusChange(
      base,
      { de: Status.InProgress, para: Status.Resolved, ocorrido_em: at(2) },
      [],
      policies,
    );
    expect(resolved.resolvido_em).toBe(at(2));
    const closed = applyStatusChange(
      resolved,
      { de: Status.Resolved, para: Status.Closed, ocorrido_em: at(3) },
      [],
      policies,
    );
    expect(closed.fechado_em).toBe(at(3));
  });

  it("never moves the last-activity date backwards", () => {
    const next = applyStatusChange(
      base,
      { de: Status.InProgress, para: Status.Resolved, ocorrido_em: at(-3) },
      [],
      policies,
    );
    expect(next.atualizado_em).toBe(base.atualizado_em);
  });
});

describe("reopening", () => {
  const answered = { ...base, primeira_resposta_em: at(-4) };
  const closed = {
    ...answered,
    status: Status.Closed,
    fechado_em: at(-2),
  } as Ticket;
  const resolved = {
    ...answered,
    status: Status.Resolved,
    resolvido_em: at(-2),
  } as Ticket;

  it("renews the SLA when a closed ticket is reopened", () => {
    const next = applyStatusChange(
      closed,
      { de: Status.Closed, para: Status.InProgress, ocorrido_em: at(2) },
      [],
      policies,
    );
    expect(next.status).toBe(Status.InProgress);
    expect(next.prazo_primeira_resposta).toBe(at(10));
    expect(next.prazo_resolucao).toBe(at(26));
    expect(next.primeira_resposta_em).toBeNull();
  });

  it("keeps the SLA when a resolved ticket is reopened", () => {
    const next = applyStatusChange(
      resolved,
      { de: Status.Resolved, para: Status.InProgress, ocorrido_em: at(2) },
      [],
      policies,
    );
    expect(next.status).toBe(Status.InProgress);
    expect(next.prazo_primeira_resposta).toBe(answered.prazo_primeira_resposta);
    expect(next.prazo_resolucao).toBe(answered.prazo_resolucao);
    expect(next.primeira_resposta_em).toBe(answered.primeira_resposta_em);
  });

  it("does not touch the SLA on other transitions", () => {
    const next = applyStatusChange(
      answered,
      { de: Status.InProgress, para: Status.Resolved, ocorrido_em: at(2) },
      [],
      policies,
    );
    expect(next.prazo_resolucao).toBe(answered.prazo_resolucao);
  });
});

describe("renewSla", () => {
  it("counts the deadlines from the given instant, by priority", () => {
    const next = renewSla(base, at(0), policies);
    expect(next.prazo_primeira_resposta).toBe(at(8));
    expect(next.prazo_resolucao).toBe(at(24));
  });

  it("keeps the ticket as it is when its priority has no policy", () => {
    expect(renewSla(base, at(0), [])).toBe(base);
  });

  it("can carry a first response that already happened after the reopening", () => {
    expect(renewSla(base, at(0), policies, at(3)).primeira_resposta_em).toBe(
      at(3),
    );
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
