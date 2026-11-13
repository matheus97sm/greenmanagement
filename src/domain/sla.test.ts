import { describe, expect, it } from "vitest";
import { compareBySla, slaInfo } from "./sla";
import type { Ticket } from "./types";

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
    prioridade: "media",
    status: "em_atendimento",
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
    expect(kind(-1)).toBe("breached");
    expect(kind(30 * 60_000)).toBe("critical");
    expect(kind(2 * HOUR)).toBe("warning");
    expect(kind(10 * HOUR)).toBe("ok");
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
    expect(info.clock).toBe("primeira_resposta");
    expect(info.kind).toBe("critical");
  });

  it("ignores the first-response deadline once it was answered", () => {
    const info = slaInfo(
      ticket({
        prazo_primeira_resposta: at(-5 * HOUR),
        prazo_resolucao: at(10 * HOUR),
      }),
      NOW,
    );
    expect(info.clock).toBe("resolucao");
    expect(info.kind).toBe("ok");
  });

  it("freezes the remaining time while the clock is paused", () => {
    const info = slaInfo(
      ticket({
        status: "aguardando_cliente",
        sla_pausado: true,
        prazo_resolucao: at(5 * HOUR),
      }),
      NOW,
      at(-3 * HOUR),
    );
    expect(info.kind).toBe("paused");
    expect(info.remainingMs).toBe(8 * HOUR);
  });

  it("is finished for resolved and closed tickets, whatever the dates say", () => {
    const resolved = ticket({
      status: "resolvido",
      prazo_resolucao: at(-HOUR),
    });
    const closed = ticket({ status: "fechado", fechado_em: at(-HOUR) });
    expect(slaInfo(resolved, NOW).kind).toBe("finished");
    expect(slaInfo(closed, NOW).kind).toBe("finished");
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
          prioridade: "critica",
          prazo_resolucao: at(30 * HOUR),
        }),
        ticket({
          id: "breached-low",
          prioridade: "baixa",
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
          prioridade: "baixa",
          prazo_resolucao: at(-300 * HOUR),
        }),
        ticket({
          id: "high-a-bit-late",
          prioridade: "alta",
          prazo_resolucao: at(-HOUR),
        }),
        ticket({
          id: "critical",
          prioridade: "critica",
          prazo_resolucao: at(-2 * HOUR),
        }),
      ]),
    ).toEqual(["critical", "high-a-bit-late", "low-very-late"]);
  });

  it("serves the most overdue first within the same priority", () => {
    expect(
      order([
        ticket({
          id: "recent",
          prioridade: "media",
          prazo_resolucao: at(-HOUR),
        }),
        ticket({
          id: "old",
          prioridade: "media",
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
          prioridade: "critica",
          prazo_resolucao: at(30 * HOUR),
        }),
        ticket({
          id: "low-soon",
          prioridade: "baixa",
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
          prioridade: "media",
          prazo_resolucao: at(HOUR),
        }),
        ticket({
          id: "high-later",
          prioridade: "alta",
          prazo_resolucao: at(3 * HOUR),
        }),
        ticket({
          id: "high-sooner",
          prioridade: "alta",
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
          prioridade: "baixa",
          prazo_resolucao: at(10 * HOUR),
        }),
        ticket({
          id: "high-later",
          prioridade: "alta",
          prazo_resolucao: at(40 * HOUR),
        }),
        ticket({
          id: "high-sooner",
          prioridade: "alta",
          prazo_resolucao: at(20 * HOUR),
        }),
      ]),
    ).toEqual(["high-sooner", "high-later", "low"]);
  });

  it("keeps paused tickets after running ones, and finished tickets last", () => {
    expect(
      order([
        ticket({
          id: "finished",
          status: "fechado",
          prioridade: "critica",
          prazo_resolucao: at(-9 * HOUR),
        }),
        ticket({
          id: "paused",
          status: "aguardando_cliente",
          sla_pausado: true,
          prioridade: "critica",
          prazo_resolucao: at(-5 * HOUR),
        }),
        ticket({
          id: "running",
          prioridade: "baixa",
          prazo_resolucao: at(60 * HOUR),
        }),
      ]),
    ).toEqual(["running", "paused", "finished"]);
  });

  it("counts a pending first response as the deadline that matters", () => {
    expect(
      order([
        ticket({
          id: "resolution-soon",
          prioridade: "media",
          prazo_resolucao: at(2 * HOUR),
        }),
        ticket({
          id: "first-response-breached",
          prioridade: "media",
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
      prioridade: "baixa",
      prazo_resolucao: at(5 * HOUR),
    });
    const high = ticket({
      id: "high",
      prioridade: "alta",
      prazo_resolucao: at(20 * HOUR),
    });
    expect(order([low, high])).toEqual(["high", "low"]);
    expect(order([low, high], NOW + 2 * HOUR)).toEqual(["low", "high"]);
    expect(order([low, high], NOW + 6 * HOUR)).toEqual(["low", "high"]);
  });
});
