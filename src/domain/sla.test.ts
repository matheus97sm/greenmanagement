import { describe, expect, it } from "vitest";
import { compareBySla, slaInfo } from "./sla";
import type { Ticket } from "./types";
import { Status, Priority, SlaKind, SlaClock } from "./enums";

const NOW = Date.parse("2026-11-03T13:00:00.000Z");
const HOUR = 3_600_000;
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
    aberto_em: at(-10 * HOUR),
    atualizado_em: at(-HOUR),
    primeira_resposta_em: at(-9 * HOUR),
    prazo_primeira_resposta: at(-2 * HOUR),
    prazo_resolucao: at(10 * HOUR),
    sla_pausado: false,
    resolvido_em: null,
    fechado_em: null,
    ...overrides,
  };
}

describe("slaInfo", () => {
  it("classifies by the remaining resolution time", () => {
    const kind = (ms: number) =>
      slaInfo(ticket({ prazo_resolucao: at(ms) }), NOW).kind;
    expect(kind(-1)).toBe(SlaKind.Breached);
    expect(kind(30 * 60_000)).toBe(SlaKind.Critical);
    expect(kind(2 * HOUR)).toBe(SlaKind.Warning);
    expect(kind(10 * HOUR)).toBe(SlaKind.Ok);
  });

  it("counts down the first response while it is pending and closer", () => {
    const info = slaInfo(
      ticket({
        primeira_resposta_em: null,
        prazo_primeira_resposta: at(30 * 60_000),
        prazo_resolucao: at(10 * HOUR),
      }),
      NOW,
    );
    expect(info.clock).toBe(SlaClock.FirstResponse);
    expect(info.kind).toBe(SlaKind.Critical);
  });

  it("ignores the first-response deadline once it was answered", () => {
    const info = slaInfo(
      ticket({
        prazo_primeira_resposta: at(-5 * HOUR),
        prazo_resolucao: at(10 * HOUR),
      }),
      NOW,
    );
    expect(info.clock).toBe(SlaClock.Resolution);
    expect(info.kind).toBe(SlaKind.Ok);
  });

  it("freezes the remaining time while the clock is paused", () => {
    const info = slaInfo(
      ticket({
        status: Status.WaitingCustomer,
        sla_pausado: true,
        prazo_resolucao: at(5 * HOUR),
      }),
      NOW,
      at(-3 * HOUR),
    );
    expect(info.kind).toBe(SlaKind.Paused);
    expect(info.remainingMs).toBe(8 * HOUR);
  });

  it("is finished for resolved and closed tickets, whatever the dates say", () => {
    const resolved = ticket({
      status: Status.Resolved,
      prazo_resolucao: at(-HOUR),
    });
    const closed = ticket({ status: Status.Closed, fechado_em: at(-HOUR) });
    expect(slaInfo(resolved, NOW).kind).toBe(SlaKind.Finished);
    expect(slaInfo(closed, NOW).kind).toBe(SlaKind.Finished);
  });
});

describe("compareBySla", () => {
  const order = (tickets: Ticket[], now = NOW) =>
    [...tickets].sort(compareBySla(now)).map((t) => t.id);

  it("puts breached tickets first, whatever their priority", () => {
    expect(
      order([
        ticket({
          id: "ok-critical",
          prioridade: Priority.Critical,
          prazo_resolucao: at(30 * HOUR),
        }),
        ticket({
          id: "breached-low",
          prioridade: Priority.Low,
          prazo_resolucao: at(-HOUR),
        }),
      ]),
    ).toEqual(["breached-low", "ok-critical"]);
  });

  it("ranks breached tickets by priority before how late they are", () => {
    expect(
      order([
        ticket({
          id: "low-very-late",
          prioridade: Priority.Low,
          prazo_resolucao: at(-300 * HOUR),
        }),
        ticket({
          id: "high-a-bit-late",
          prioridade: Priority.High,
          prazo_resolucao: at(-HOUR),
        }),
        ticket({
          id: SlaKind.Critical,
          prioridade: Priority.Critical,
          prazo_resolucao: at(-2 * HOUR),
        }),
      ]),
    ).toEqual([SlaKind.Critical, "high-a-bit-late", "low-very-late"]);
  });

  it("serves the most overdue first within the same priority", () => {
    expect(
      order([
        ticket({
          id: "recent",
          prioridade: Priority.Medium,
          prazo_resolucao: at(-HOUR),
        }),
        ticket({
          id: "old",
          prioridade: Priority.Medium,
          prazo_resolucao: at(-50 * HOUR),
        }),
      ]),
    ).toEqual(["old", "recent"]);
  });

  it("puts tickets about to breach before the rest, whatever their priority", () => {
    expect(
      order([
        ticket({
          id: "critical-far",
          prioridade: Priority.Critical,
          prazo_resolucao: at(30 * HOUR),
        }),
        ticket({
          id: "low-soon",
          prioridade: Priority.Low,
          prazo_resolucao: at(HOUR + 60_000),
        }),
      ]),
    ).toEqual(["low-soon", "critical-far"]);
  });

  it("ranks by priority, then deadline, inside the about-to-breach tier", () => {
    expect(
      order([
        ticket({
          id: "medium-sooner",
          prioridade: Priority.Medium,
          prazo_resolucao: at(HOUR),
        }),
        ticket({
          id: "high-later",
          prioridade: Priority.High,
          prazo_resolucao: at(3 * HOUR),
        }),
        ticket({
          id: "high-sooner",
          prioridade: Priority.High,
          prazo_resolucao: at(2 * HOUR),
        }),
      ]),
    ).toEqual(["high-sooner", "high-later", "medium-sooner"]);
  });

  it("ranks by priority, then deadline, in the comfortable tier", () => {
    expect(
      order([
        ticket({
          id: "low",
          prioridade: Priority.Low,
          prazo_resolucao: at(10 * HOUR),
        }),
        ticket({
          id: "high-later",
          prioridade: Priority.High,
          prazo_resolucao: at(40 * HOUR),
        }),
        ticket({
          id: "high-sooner",
          prioridade: Priority.High,
          prazo_resolucao: at(20 * HOUR),
        }),
      ]),
    ).toEqual(["high-sooner", "high-later", "low"]);
  });

  it("keeps paused tickets after running ones, and finished tickets last", () => {
    expect(
      order([
        ticket({
          id: SlaKind.Finished,
          status: Status.Closed,
          prioridade: Priority.Critical,
          prazo_resolucao: at(-9 * HOUR),
        }),
        ticket({
          id: SlaKind.Paused,
          status: Status.WaitingCustomer,
          sla_pausado: true,
          prioridade: Priority.Critical,
          prazo_resolucao: at(-5 * HOUR),
        }),
        ticket({
          id: "running",
          prioridade: Priority.Low,
          prazo_resolucao: at(60 * HOUR),
        }),
      ]),
    ).toEqual(["running", SlaKind.Paused, SlaKind.Finished]);
  });

  it("counts a pending first response as the deadline that matters", () => {
    expect(
      order([
        ticket({
          id: "resolution-soon",
          prioridade: Priority.Medium,
          prazo_resolucao: at(2 * HOUR),
        }),
        ticket({
          id: "first-response-breached",
          prioridade: Priority.Medium,
          primeira_resposta_em: null,
          prazo_primeira_resposta: at(-HOUR),
          prazo_resolucao: at(20 * HOUR),
        }),
      ]),
    ).toEqual(["first-response-breached", "resolution-soon"]);
  });

  it("moves a ticket up as time brings its deadline closer", () => {
    const low = ticket({
      id: "low",
      prioridade: Priority.Low,
      prazo_resolucao: at(5 * HOUR),
    });
    const high = ticket({
      id: "high",
      prioridade: Priority.High,
      prazo_resolucao: at(20 * HOUR),
    });
    expect(order([low, high])).toEqual(["high", "low"]);
    expect(order([low, high], NOW + 2 * HOUR)).toEqual(["low", "high"]);
    expect(order([low, high], NOW + 6 * HOUR)).toEqual(["low", "high"]);
  });
});
