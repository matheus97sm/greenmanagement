import { describe, expect, it } from "vitest";
import { HistoryType, Priority, Status } from "./enums";
import type { HistoryEntry, Message, Ticket } from "./types";
import {
  heldIntervals,
  idleShare,
  teamWeek,
  weekByConsultant,
} from "./activity";
import { weekRange } from "./week";

const HOUR = 3_600_000;
const utc = (iso: string) => Date.parse(iso);
const iso = (ms: number) => new Date(ms).toISOString();

const MONDAY_8H = utc("2026-11-02T11:00:00Z");
const NOW = utc("2026-11-03T13:00:00Z");
const range = weekRange(NOW);

let seq = 0;

function ticket(overrides: Partial<Ticket> = {}): Ticket {
  seq += 1;
  return {
    id: `t${seq}`,
    numero: seq,
    titulo: "",
    descricao: "",
    categoria_id: "c",
    grupo_id: "g1",
    prioridade: Priority.Medium,
    status: Status.InProgress,
    solicitante_id: "s",
    responsavel_id: "a",
    aberto_em: iso(MONDAY_8H - 24 * HOUR),
    atualizado_em: iso(MONDAY_8H),
    primeira_resposta_em: null,
    prazo_primeira_resposta: iso(MONDAY_8H),
    prazo_resolucao: iso(MONDAY_8H),
    sla_pausado: false,
    resolvido_em: null,
    fechado_em: null,
    ...overrides,
  };
}

function assigned(t: Ticket, consultantId: string, at: number): HistoryEntry {
  return {
    id: `h${seq++}`,
    chamado_id: t.id,
    tipo: HistoryType.Assignment,
    de: null,
    para: null,
    usuario_id: consultantId,
    motivo: null,
    ocorrido_em: iso(at),
  };
}

function moved(
  t: Ticket,
  from: Status,
  to: Status,
  at: number,
  userId = "a",
): HistoryEntry {
  return {
    id: `h${seq++}`,
    chamado_id: t.id,
    tipo: HistoryType.Status,
    de: from,
    para: to,
    usuario_id: userId,
    motivo: "x",
    ocorrido_em: iso(at),
  };
}

function message(
  t: Ticket,
  authorId: string,
  at: number,
  internal = false,
): Message {
  return {
    id: `m${seq++}`,
    chamado_id: t.id,
    criada_em: iso(at),
    autor_id: authorId,
    texto: "x",
    interna: internal,
  };
}

function groupByTicket<T extends { chamado_id: string }>(
  items: T[],
): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) (out[item.chamado_id] ??= []).push(item);
  return out;
}

const spans = (list: { start: number; end: number }[]) =>
  list.map((i) => [(i.start - MONDAY_8H) / HOUR, (i.end - MONDAY_8H) / HOUR]);

describe("heldIntervals", () => {
  it("runs from the assignment until the ticket is resolved", () => {
    const t = ticket({ status: Status.Resolved });
    const history = [
      assigned(t, "a", MONDAY_8H + 1 * HOUR),
      moved(t, Status.Open, Status.InProgress, MONDAY_8H + 1 * HOUR),
      moved(t, Status.InProgress, Status.Resolved, MONDAY_8H + 5 * HOUR),
    ];
    expect(spans(heldIntervals(t, history))).toEqual([[1, 5]]);
    expect(heldIntervals(t, history)[0].consultantId).toBe("a");
  });

  it("keeps counting while the ticket waits for the customer", () => {
    const t = ticket({ status: Status.Resolved });
    const history = [
      assigned(t, "a", MONDAY_8H),
      moved(t, Status.Open, Status.InProgress, MONDAY_8H),
      moved(t, Status.InProgress, Status.WaitingCustomer, MONDAY_8H + 2 * HOUR),
      moved(t, Status.WaitingCustomer, Status.InProgress, MONDAY_8H + 4 * HOUR),
      moved(t, Status.InProgress, Status.Resolved, MONDAY_8H + 6 * HOUR),
    ];
    expect(spans(heldIntervals(t, history))).toEqual([[0, 6]]);
  });

  it("stays open while the ticket is still active", () => {
    const t = ticket();
    const [held] = heldIntervals(t, [assigned(t, "a", MONDAY_8H)]);
    expect(held.end).toBe(Infinity);
  });

  it("counts a ticket handed out while it was still waiting to be started", () => {
    const t = ticket({ status: Status.Open });
    const [held] = heldIntervals(t, [assigned(t, "a", MONDAY_8H + HOUR)]);
    expect(held.start).toBe(MONDAY_8H + HOUR);
  });

  it("splits into two stretches when a ticket is resolved and then reopened", () => {
    const t = ticket();
    const history = [
      assigned(t, "a", MONDAY_8H),
      moved(t, Status.Open, Status.InProgress, MONDAY_8H),
      moved(t, Status.InProgress, Status.Resolved, MONDAY_8H + 2 * HOUR),
      moved(t, Status.Resolved, Status.InProgress, MONDAY_8H + 5 * HOUR),
    ];
    const held = heldIntervals(t, history);
    expect(spans(held.slice(0, 1))).toEqual([[0, 2]]);
    expect(held[1].start).toBe(MONDAY_8H + 5 * HOUR);
    expect(held[1].end).toBe(Infinity);
  });

  it("hands the ticket from one consultant to the next on a reassignment", () => {
    const t = ticket({ responsavel_id: "b" });
    const history = [
      assigned(t, "a", MONDAY_8H),
      assigned(t, "b", MONDAY_8H + 3 * HOUR),
    ];
    const held = heldIntervals(t, history);
    expect(held.map((h) => h.consultantId)).toEqual(["a", "b"]);
    expect(spans(held.slice(0, 1))).toEqual([[0, 3]]);
    expect(held[1].end).toBe(Infinity);
  });

  it("is empty for a ticket nobody was given", () => {
    expect(heldIntervals(ticket({ responsavel_id: null }), [])).toEqual([]);
    expect(heldIntervals(ticket(), undefined)).toEqual([]);
  });

  it("does not depend on the order the history arrives in", () => {
    const t = ticket({ status: Status.Resolved });
    const history = [
      moved(t, Status.InProgress, Status.Resolved, MONDAY_8H + 5 * HOUR),
      assigned(t, "a", MONDAY_8H + HOUR),
      moved(t, Status.Open, Status.InProgress, MONDAY_8H + HOUR),
    ];
    expect(spans(heldIntervals(t, history))).toEqual([[1, 5]]);
  });
});

describe("weekByConsultant", () => {
  const compute = (
    tickets: Ticket[],
    history: HistoryEntry[],
    messages: Message[] = [],
    ids = ["a", "b"],
  ) =>
    weekByConsultant({
      consultantIds: ids,
      tickets,
      history: groupByTicket(history),
      messages: groupByTicket(messages),
      range,
    });

  it("counts the whole working time so far as idle for someone with nothing", () => {
    const [a] = compute([], []);
    expect(a.businessMs / HOUR).toBe(12);
    expect(a.idleMs).toBe(a.businessMs);
    expect(idleShare(a)).toBe(1);
  });

  it("counts no idle time while a ticket is held the whole week", () => {
    const t = ticket();
    const [a, b] = compute([t], [assigned(t, "a", MONDAY_8H - 5 * HOUR)]);
    expect(a.idleMs).toBe(0);
    expect(b.idleMs).toBe(b.businessMs);
  });

  it("counts only the hours with no ticket", () => {
    const t = ticket({ status: Status.Resolved });
    const [a] = compute(
      [t],
      [
        assigned(t, "a", MONDAY_8H),
        moved(t, Status.Open, Status.InProgress, MONDAY_8H),
        moved(t, Status.InProgress, Status.Resolved, MONDAY_8H + 4 * HOUR),
      ],
    );
    expect(a.idleMs / HOUR).toBe(8);
    expect(a.days[0].idleMs / HOUR).toBe(6);
    expect(a.days[1].idleMs / HOUR).toBe(2);
  });

  it("does not count overlapping tickets twice", () => {
    const first = ticket({ status: Status.Resolved });
    const second = ticket({ status: Status.Resolved });
    const [a] = compute(
      [first, second],
      [
        assigned(first, "a", MONDAY_8H),
        moved(first, Status.Open, Status.InProgress, MONDAY_8H),
        moved(first, Status.InProgress, Status.Resolved, MONDAY_8H + 6 * HOUR),
        assigned(second, "a", MONDAY_8H + 2 * HOUR),
        moved(second, Status.Open, Status.InProgress, MONDAY_8H + 2 * HOUR),
        moved(second, Status.InProgress, Status.Resolved, MONDAY_8H + 8 * HOUR),
      ],
    );
    expect(a.days[0].idleMs / HOUR).toBe(2);
  });

  it("ignores work done outside business hours", () => {
    const t = ticket({ status: Status.Resolved });
    const sundayNight = MONDAY_8H - 12 * HOUR;
    const [a] = compute(
      [t],
      [
        assigned(t, "a", sundayNight),
        moved(t, Status.Open, Status.InProgress, sundayNight),
        moved(t, Status.InProgress, Status.Resolved, MONDAY_8H - 2 * HOUR),
      ],
    );
    expect(a.idleMs).toBe(a.businessMs);
  });

  it("leaves the days that have not started with no working time", () => {
    const [a] = compute([], []);
    expect(a.days.map((d) => d.businessMs / HOUR)).toEqual([10, 2, 0, 0, 0]);
  });

  it("moves the idle time to whoever received a reassigned ticket", () => {
    const t = ticket({ responsavel_id: "b" });
    const [a, b] = compute(
      [t],
      [
        assigned(t, "a", MONDAY_8H - HOUR),
        assigned(t, "b", MONDAY_8H + 4 * HOUR),
      ],
    );
    expect(a.days[0].idleMs / HOUR).toBe(6);
    expect(b.days[0].idleMs / HOUR).toBe(4);
  });

  it("counts what each consultant did inside the week", () => {
    const t = ticket({ status: Status.Resolved });
    const history = [
      assigned(t, "a", MONDAY_8H + HOUR),
      assigned(t, "a", MONDAY_8H - 3 * 24 * HOUR),
      moved(t, Status.InProgress, Status.Resolved, MONDAY_8H + 3 * HOUR, "a"),
      moved(t, Status.Resolved, Status.Closed, MONDAY_8H + 4 * HOUR, "a"),
      moved(t, Status.InProgress, Status.Resolved, MONDAY_8H + 5 * HOUR, "b"),
    ];
    const messages = [
      message(t, "a", MONDAY_8H + HOUR),
      message(t, "a", MONDAY_8H + 2 * HOUR),
      message(t, "a", MONDAY_8H + 2 * HOUR, true),
      message(t, "a", MONDAY_8H - 12 * HOUR),
      message(t, "s", MONDAY_8H + HOUR),
    ];
    const [a, b] = compute([t], history, messages);
    expect(a).toMatchObject({ assigned: 1, resolved: 1, replies: 2 });
    expect(b).toMatchObject({ assigned: 0, resolved: 1, replies: 0 });
  });

  it("leaves out anything after the end of the window", () => {
    const t = ticket();
    const [a] = compute([t], [assigned(t, "a", NOW + HOUR)]);
    expect(a.assigned).toBe(0);
  });
});

describe("teamWeek", () => {
  it("adds the consultants up and works out the idle share of the team", () => {
    const base = {
      consultantId: "x",
      days: [],
      assigned: 1,
      resolved: 2,
      replies: 3,
    };
    expect(
      teamWeek([
        { ...base, businessMs: 10 * HOUR, idleMs: 5 * HOUR },
        { ...base, businessMs: 10 * HOUR, idleMs: 0 },
      ]),
    ).toEqual({
      businessMs: 20 * HOUR,
      idleMs: 5 * HOUR,
      idleShare: 0.25,
      assigned: 2,
      resolved: 4,
      replies: 6,
    });
  });

  it("is zero for an empty team", () => {
    expect(teamWeek([]).idleShare).toBe(0);
  });
});
