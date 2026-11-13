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
  it("puts the earliest deadline first, then paused, then finished", () => {
    const list = [
      ticket({
        id: "finished",
        status: "fechado",
        prazo_resolucao: at(-9 * HOUR),
      }),
      ticket({
        id: "paused",
        status: "aguardando_cliente",
        sla_pausado: true,
        prazo_resolucao: at(-5 * HOUR),
      }),
      ticket({ id: "later", prazo_resolucao: at(5 * HOUR) }),
      ticket({ id: "overdue", prazo_resolucao: at(-2 * HOUR) }),
    ].sort(compareBySla);
    expect(list.map((t) => t.id)).toEqual([
      "overdue",
      "later",
      "paused",
      "finished",
    ]);
  });

  it("lets a pending first response outrank a later resolution deadline", () => {
    const list = [
      ticket({ id: "resolution", prazo_resolucao: at(2 * HOUR) }),
      ticket({
        id: "first-response",
        primeira_resposta_em: null,
        prazo_primeira_resposta: at(HOUR),
        prazo_resolucao: at(20 * HOUR),
      }),
    ].sort(compareBySla);
    expect(list[0].id).toBe("first-response");
  });
});
