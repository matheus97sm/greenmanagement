import { describe, expect, it } from "vitest";
import { CustomerStage, Expectation, Priority, Status } from "./enums";
import { canReopen, nextExpectation, stageOf } from "./customer";
import type { Ticket } from "./types";

const HOUR = 3_600_000;
const NOW = Date.parse("2026-11-03T13:00:00.000Z");
const at = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  return {
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
    aberto_em: at(-5 * HOUR),
    atualizado_em: at(-HOUR),
    primeira_resposta_em: at(-4 * HOUR),
    prazo_primeira_resposta: at(-3 * HOUR),
    prazo_resolucao: at(8 * HOUR),
    sla_pausado: false,
    resolvido_em: null,
    fechado_em: null,
    ...overrides,
  };
}

describe("stageOf", () => {
  it("says a ticket nobody has taken was only received", () => {
    expect(stageOf(ticket({ status: Status.Open, responsavel_id: null }))).toBe(
      CustomerStage.Received,
    );
  });

  it("says a ticket handed to someone who has not started is assigned", () => {
    expect(stageOf(ticket({ status: Status.Open }))).toBe(
      CustomerStage.Assigned,
    );
  });

  it("maps the other statuses one to one", () => {
    expect(stageOf(ticket({ status: Status.InProgress }))).toBe(
      CustomerStage.InProgress,
    );
    expect(stageOf(ticket({ status: Status.WaitingCustomer }))).toBe(
      CustomerStage.WaitingYou,
    );
    expect(stageOf(ticket({ status: Status.Resolved }))).toBe(
      CustomerStage.Resolved,
    );
    expect(stageOf(ticket({ status: Status.Closed }))).toBe(
      CustomerStage.Closed,
    );
  });

  it("has a stage for every status", () => {
    for (const status of Object.values(Status)) {
      expect(Object.values(CustomerStage)).toContain(
        stageOf(ticket({ status })),
      );
    }
  });
});

describe("nextExpectation", () => {
  it("promises the first response while nobody has answered", () => {
    const expectation = nextExpectation(
      ticket({
        status: Status.Open,
        primeira_resposta_em: null,
        prazo_primeira_resposta: at(HOUR),
      }),
      NOW,
    );
    expect(expectation).toEqual({
      kind: Expectation.FirstResponse,
      at: at(HOUR),
      overdue: false,
    });
  });

  it("promises the solution once someone has answered", () => {
    expect(nextExpectation(ticket(), NOW)).toEqual({
      kind: Expectation.Resolution,
      at: at(8 * HOUR),
      overdue: false,
    });
  });

  it("says when the date it promised has already passed", () => {
    const expectation = nextExpectation(
      ticket({ prazo_resolucao: at(-2 * HOUR) }),
      NOW,
    );
    expect(expectation.kind).toBe(Expectation.Resolution);
    expect(expectation.overdue).toBe(true);
  });

  it("promises nothing while the team waits for the customer", () => {
    expect(
      nextExpectation(
        ticket({ status: Status.WaitingCustomer, sla_pausado: true }),
        NOW,
      ),
    ).toEqual({ kind: Expectation.None, at: null, overdue: false });
  });

  it("promises nothing once the ticket is resolved or closed", () => {
    for (const status of [Status.Resolved, Status.Closed]) {
      expect(nextExpectation(ticket({ status }), NOW).kind).toBe(
        Expectation.None,
      );
    }
  });
});

describe("canReopen", () => {
  it("is true only for resolved and closed tickets", () => {
    const reopenable = Object.values(Status).filter((status) =>
      canReopen(ticket({ status })),
    );
    expect(reopenable).toEqual([Status.Resolved, Status.Closed]);
  });
});
