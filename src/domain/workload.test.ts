import { describe, expect, it } from "vitest";
import { LoadLevel, Priority, Profile, Status } from "./enums";
import type { Person, Ticket } from "./types";
import {
  activeTicketsOf,
  compareWorkload,
  consultantsOf,
  levelOf,
  needsAttention,
  riskTickets,
  teamSummary,
  unassignedTickets,
  workloadByConsultant,
} from "./workload";
import type { Workload } from "./workload";

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
    grupo_id: "g1",
    prioridade: Priority.Medium,
    status: Status.InProgress,
    solicitante_id: "s",
    responsavel_id: "a",
    aberto_em: at(-10 * HOUR),
    atualizado_em: at(-HOUR),
    primeira_resposta_em: at(-9 * HOUR),
    prazo_primeira_resposta: at(-8 * HOUR),
    prazo_resolucao: at(20 * HOUR),
    sla_pausado: false,
    resolvido_em: null,
    fechado_em: null,
    ...overrides,
  };
}

function person(id: string, group: string, perfil = Profile.Consultant) {
  return {
    id,
    nome: id.toUpperCase(),
    email: "",
    perfil,
    locale: "pt-BR",
    zoneinfo: "America/Sao_Paulo",
    grupo_id: group,
  } satisfies Person;
}

let seq = 0;
const many = (count: number, overrides: Partial<Ticket> = {}) =>
  Array.from({ length: count }, () =>
    ticket({ id: `t${seq++}`, numero: seq, ...overrides }),
  );

describe("consultantsOf", () => {
  it("keeps only consultants of the given groups", () => {
    const people = [
      person("a", "g1"),
      person("b", "g2"),
      person("c", "g3"),
      person("m", "g1", Profile.Manager),
      person("h", "g1", Profile.Customer),
    ];
    expect(
      consultantsOf(people, ["g1", "g2"]).map(
        (currentPerson) => currentPerson.id,
      ),
    ).toEqual(["a", "b"]);
  });
});

describe("needsAttention", () => {
  it("flags breached tickets and those due in under four hours", () => {
    const due = (ms: number) =>
      needsAttention(ticket({ prazo_resolucao: at(ms) }), NOW);
    expect(due(-HOUR)).toBe(true);
    expect(due(HOUR / 2)).toBe(true);
    expect(due(3 * HOUR)).toBe(true);
    expect(due(5 * HOUR)).toBe(false);
  });

  it("ignores paused and finished tickets, even when past the deadline", () => {
    const late = { prazo_resolucao: at(-HOUR) };
    expect(
      needsAttention(
        ticket({ ...late, status: Status.WaitingCustomer, sla_pausado: true }),
        NOW,
      ),
    ).toBe(false);
    expect(
      needsAttention(ticket({ ...late, status: Status.Resolved }), NOW),
    ).toBe(false);
    expect(
      needsAttention(ticket({ ...late, status: Status.Closed }), NOW),
    ).toBe(false);
  });

  it("uses the first response deadline while it is still pending", () => {
    expect(
      needsAttention(
        ticket({
          status: Status.Open,
          primeira_resposta_em: null,
          prazo_primeira_resposta: at(-HOUR),
        }),
        NOW,
      ),
    ).toBe(true);
  });
});

describe("riskTickets", () => {
  it("lists only tickets that need attention, most urgent first", () => {
    const calm = ticket({ id: "calm" });
    const late = ticket({
      id: "late",
      prazo_resolucao: at(-HOUR),
      prioridade: Priority.Low,
    });
    const soonCritical = ticket({
      id: "soon",
      prazo_resolucao: at(2 * HOUR),
      prioridade: Priority.Critical,
    });
    expect(
      riskTickets([calm, soonCritical, late], NOW).map(
        (currentTicket) => currentTicket.id,
      ),
    ).toEqual(["late", "soon"]);
  });
});

describe("unassignedTickets", () => {
  it("lists active tickets without an owner", () => {
    const queued = ticket({
      id: "q",
      responsavel_id: null,
      status: Status.Open,
    });
    const taken = ticket({ id: "taken" });
    const closed = ticket({
      id: "closed",
      responsavel_id: null,
      status: Status.Closed,
    });
    expect(
      unassignedTickets([taken, closed, queued], NOW).map(
        (currentTicket) => currentTicket.id,
      ),
    ).toEqual(["q"]);
  });
});

describe("activeTicketsOf", () => {
  it("returns the active tickets of one consultant, most urgent first", () => {
    const calm = ticket({ id: "calm" });
    const late = ticket({ id: "late", prazo_resolucao: at(-HOUR) });
    const other = ticket({ id: "other", responsavel_id: "b" });
    const done = ticket({ id: "done", status: Status.Resolved });
    expect(
      activeTicketsOf([calm, other, done, late], "a", NOW).map(
        (currentTicket) => currentTicket.id,
      ),
    ).toEqual(["late", "calm"]);
  });
});

describe("levelOf", () => {
  it("is idle with nothing assigned", () => {
    expect(levelOf(0, 10)).toBe(LoadLevel.Idle);
  });

  it("is overloaded from one and a half times the group average", () => {
    expect(levelOf(14, 10)).toBe(LoadLevel.Normal);
    expect(levelOf(15, 10)).toBe(LoadLevel.Overloaded);
  });
});

describe("workloadByConsultant", () => {
  const consultants = [person("a", "g1"), person("b", "g1"), person("c", "g1")];

  it("counts what each consultant carries and how much of it is at risk", () => {
    const tickets = [
      ...many(2, { responsavel_id: "a" }),
      ticket({ id: "b1", responsavel_id: "a", prazo_resolucao: at(-HOUR) }),
      ticket({ id: "b2", responsavel_id: "a", prazo_resolucao: at(HOUR) }),
      ticket({
        id: "w",
        responsavel_id: "a",
        status: Status.WaitingCustomer,
        sla_pausado: true,
      }),
      ticket({ id: "r", responsavel_id: "a", status: Status.Resolved }),
      ...many(1, { responsavel_id: "b" }),
    ];
    const [firstWorkload, secondWorkload, thirdWorkload] = workloadByConsultant(
      tickets,
      consultants,
      NOW,
    );
    expect(firstWorkload).toMatchObject({
      active: 5,
      breached: 1,
      atRisk: 1,
      waitingCustomer: 1,
    });
    expect(secondWorkload).toMatchObject({
      active: 1,
      breached: 0,
      atRisk: 0,
    });
    expect(thirdWorkload).toMatchObject({ active: 0 });
  });

  it("compares each consultant with the average of their own group", () => {
    const team = [
      person("a", "g1"),
      person("b", "g1"),
      person("c", "g1"),
      person("x", "g2"),
      person("y", "g2"),
    ];
    const tickets = [
      ...many(12, { responsavel_id: "a" }),
      ...many(2, { responsavel_id: "b" }),
      ...many(1, { responsavel_id: "c" }),
      ...many(12, { responsavel_id: "x", grupo_id: "g2" }),
      ...many(10, { responsavel_id: "y", grupo_id: "g2" }),
    ];
    const level = Object.fromEntries(
      workloadByConsultant(tickets, team, NOW).map((workload) => [
        workload.consultant.id,
        workload.level,
      ]),
    );
    expect(level).toEqual({
      a: LoadLevel.Overloaded,
      b: LoadLevel.Normal,
      c: LoadLevel.Normal,
      x: LoadLevel.Normal,
      y: LoadLevel.Normal,
    });
  });

  it("marks a consultant with nothing assigned as idle", () => {
    const tickets = many(3, { responsavel_id: "a" });
    const result = workloadByConsultant(tickets, consultants, NOW);
    expect(
      result.find((workload) => workload.consultant.id === "b")?.level,
    ).toBe(LoadLevel.Idle);
  });
});

describe("compareWorkload", () => {
  const entry = (id: string, overrides: Partial<Workload> = {}): Workload => ({
    consultant: person(id, "g1"),
    active: 5,
    waitingCustomer: 0,
    breached: 0,
    atRisk: 0,
    level: LoadLevel.Normal,
    ...overrides,
  });

  it("puts idle people first, then the overloaded, then the most at risk", () => {
    const list = [
      entry("calm"),
      entry("risky", { atRisk: 3 }),
      entry("breached", { breached: 1 }),
      entry("overloaded", { level: LoadLevel.Overloaded, active: 20 }),
      entry("idle", { level: LoadLevel.Idle, active: 0 }),
    ];
    expect(
      [...list].sort(compareWorkload).map((workload) => workload.consultant.id),
    ).toEqual(["idle", "overloaded", "breached", "risky", "calm"]);
  });
});

describe("teamSummary", () => {
  it("totals the active tickets, the ones at risk and the idle people", () => {
    const consultants = [person("a", "g1"), person("b", "g1")];
    const tickets = [
      ...many(3, { responsavel_id: "a" }),
      ticket({ id: "late", prazo_resolucao: at(-HOUR) }),
      ticket({ id: "soon", prazo_resolucao: at(HOUR) }),
      ticket({ id: "q", responsavel_id: null, status: Status.Open }),
      ticket({
        id: "paused",
        status: Status.WaitingCustomer,
        sla_pausado: true,
        prazo_resolucao: at(-HOUR),
      }),
      ticket({ id: "done", status: Status.Closed, prazo_resolucao: at(-HOUR) }),
    ];
    const workloads = workloadByConsultant(tickets, consultants, NOW);
    expect(teamSummary(tickets, workloads, NOW)).toEqual({
      active: 7,
      breached: 1,
      atRisk: 1,
      unassigned: 1,
      idle: 1,
    });
  });
});
