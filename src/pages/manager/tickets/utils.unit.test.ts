import { describe, expect, it } from "vitest";
import { Status } from "@/domain/enums";
import { compareBySla } from "@/domain/sla";
import type { Person, Ticket } from "@/domain/types";
import {
  activeTicketsOf,
  riskTickets,
  unassignedTickets,
} from "@/domain/workload";
import { rawData } from "@/test-data";
import { ALL_GROUPS } from "./constants";
import { FocusKind } from "./enums";
import type { Focus } from "./types";
import {
  filterByGroup,
  findTickets,
  focusAfterPicking,
  keepVisible,
  ticketsInFocus,
  toggled,
  unassignedCountByGroup,
  viewOptions,
} from "./utils";

const NOW = Date.parse(rawData.meta.agora);
const [infra, apps] = rawData.grupos;
const people: Record<string, Person> = Object.fromEntries(
  rawData.usuarios.map((person) => [person.id, person]),
);
const byNumber = (numero: number) =>
  rawData.chamados.find((ticket) => ticket.numero === numero) as Ticket;
const thiago = rawData.usuarios.find((person) =>
  person.nome.startsWith("Thiago"),
)!;

describe("filterByGroup", () => {
  it("keeps everything when no group is picked", () => {
    expect(filterByGroup(rawData.chamados, ALL_GROUPS)).toBe(rawData.chamados);
  });

  it("keeps only the tickets of the chosen group", () => {
    const result = filterByGroup(rawData.chamados, infra.id);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(rawData.chamados.length);
    expect(result.every((ticket) => ticket.grupo_id === infra.id)).toBe(true);
    expect(
      filterByGroup(rawData.chamados, apps.id).length + result.length,
    ).toBe(rawData.chamados.length);
  });
});

describe("findTickets", () => {
  const find = (term: string, groupId = ALL_GROUPS) =>
    findTickets({
      tickets: rawData.chamados,
      term,
      people,
      now: NOW,
      groupId,
    });

  it("finds a ticket by its number", () => {
    expect(find("10503").map((ticket) => ticket.numero)).toContain(10503);
  });

  it("looks at every ticket, finished ones included", () => {
    const closed = rawData.chamados.find(
      (ticket) => ticket.status === Status.Closed,
    )!;
    expect(find(String(closed.numero)).map((ticket) => ticket.id)).toContain(
      closed.id,
    );
  });

  it("puts the most urgent first", () => {
    const result = find("10");
    const sorted = [...result].sort(compareBySla(NOW));
    expect(result.map((ticket) => ticket.id)).toEqual(
      sorted.map((ticket) => ticket.id),
    );
  });

  it("returns every ticket, ordered, when the search is empty", () => {
    expect(find("")).toHaveLength(rawData.chamados.length);
  });

  it("keeps only the chosen group", () => {
    const all = find("104");
    const inGroup = find("104", infra.id);
    expect(inGroup.length).toBeLessThan(all.length);
    expect(inGroup.every((ticket) => ticket.grupo_id === infra.id)).toBe(true);
  });

  it("finds nothing for something that matches nothing", () => {
    expect(find("zzzzzz")).toEqual([]);
  });

  it("does not change the list it was given", () => {
    const copy = [...rawData.chamados];
    find("1");
    expect(rawData.chamados).toEqual(copy);
  });
});

describe("ticketsInFocus", () => {
  const risk = riskTickets(rawData.chamados, NOW);
  const unassigned = unassignedTickets(rawData.chamados, NOW);
  const inFocus = (focus: Focus) =>
    ticketsInFocus({
      focus,
      tickets: rawData.chamados,
      now: NOW,
      risk,
      unassigned,
    });

  it("shows the tickets at risk for the risk view", () => {
    expect(inFocus({ kind: FocusKind.Risk })).toBe(risk);
  });

  it("shows the queue for the unassigned view", () => {
    expect(inFocus({ kind: FocusKind.Unassigned })).toBe(unassigned);
  });

  it("shows everything one consultant carries for a picked consultant", () => {
    const result = inFocus({
      kind: FocusKind.Consultant,
      consultantId: thiago.id,
    });
    expect(result).toEqual(activeTicketsOf(rawData.chamados, thiago.id, NOW));
    expect(result).toHaveLength(75);
  });
});

describe("unassignedCountByGroup", () => {
  it("counts the queue of each group", () => {
    const counts = unassignedCountByGroup(rawData.chamados, NOW);
    expect(counts[infra.id]).toBe(35);
    expect(counts[apps.id]).toBe(26);
  });

  it("leaves out groups with nothing waiting", () => {
    expect(unassignedCountByGroup([], NOW)).toEqual({});
  });
});

describe("keepVisible", () => {
  const visible = [byNumber(10503), byNumber(10001)];

  it("keeps the selected tickets that are still on the list", () => {
    expect(
      keepVisible(new Set([visible[0].id, visible[1].id]), visible),
    ).toEqual(new Set([visible[0].id, visible[1].id]));
  });

  it("drops the ones that left the list", () => {
    expect(keepVisible(new Set([visible[0].id, "gone"]), visible)).toEqual(
      new Set([visible[0].id]),
    );
  });

  it("is empty when nothing was selected", () => {
    expect(keepVisible(new Set(), visible).size).toBe(0);
  });
});

describe("toggled", () => {
  it("adds a ticket that was not selected", () => {
    expect(toggled(new Set(["a"]), "b")).toEqual(new Set(["a", "b"]));
  });

  it("removes a ticket that was selected", () => {
    expect(toggled(new Set(["a", "b"]), "a")).toEqual(new Set(["b"]));
  });

  it("does not change the selection it was given", () => {
    const before = new Set(["a"]);
    toggled(before, "b");
    expect(before).toEqual(new Set(["a"]));
  });
});

describe("focusAfterPicking", () => {
  const picked: Focus = { kind: FocusKind.Consultant, consultantId: "c1" };

  it("focuses the consultant that was picked", () => {
    expect(focusAfterPicking({ kind: FocusKind.Risk }, "c1")).toEqual(picked);
    expect(focusAfterPicking({ kind: FocusKind.Unassigned }, "c1")).toEqual(
      picked,
    );
  });

  it("moves from one consultant to another", () => {
    expect(focusAfterPicking(picked, "c2")).toEqual({
      kind: FocusKind.Consultant,
      consultantId: "c2",
    });
  });

  it("goes back to the risk view when the same consultant is picked again", () => {
    expect(focusAfterPicking(picked, "c1")).toEqual({ kind: FocusKind.Risk });
  });
});

describe("viewOptions", () => {
  it("offers the risk and the unassigned views with their counts", () => {
    expect(
      viewOptions({
        riskCount: 7,
        unassignedCount: 3,
        consultant: undefined,
        consultantCount: 0,
      }),
    ).toEqual([
      { value: FocusKind.Risk, label: "Em risco (7)" },
      { value: FocusKind.Unassigned, label: "Sem responsável (3)" },
    ]);
  });

  it("adds a view for the consultant that was picked", () => {
    const options = viewOptions({
      riskCount: 7,
      unassignedCount: 3,
      consultant: thiago,
      consultantCount: 75,
    });
    expect(options).toHaveLength(3);
    expect(options[2]).toEqual({
      value: FocusKind.Consultant,
      label: "Thiago Nascimento (75)",
    });
  });
});
