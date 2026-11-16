import { describe, expect, it } from "vitest";
import type { ConsultantWeek } from "@/domain/activity";
import { LoadLevel, Profile } from "@/domain/enums";
import { SortKey } from "./enums";
import type { Row } from "./types";
import { dayHeaders, mostIdle, sortRows, weekOptions } from "./utils";

const HOUR = 3_600_000;
const NOW = Date.parse("2026-11-03T13:00:00Z");

function row(
  nome: string,
  week: Partial<ConsultantWeek> = {},
  businessMs = 10 * HOUR,
): Row {
  return {
    consultant: {
      id: nome,
      nome,
      email: "",
      perfil: Profile.Consultant,
      locale: "pt-BR",
      zoneinfo: "America/Sao_Paulo",
      grupo_id: "g",
    },
    groupName: "Grupo",
    week: {
      consultantId: nome,
      businessMs,
      idleMs: 0,
      days: [],
      assigned: 0,
      resolved: 0,
      replies: 0,
      ...week,
    },
    workload: {
      consultant: {} as Row["consultant"],
      active: 0,
      waitingCustomer: 0,
      breached: 0,
      atRisk: 0,
      level: LoadLevel.Normal,
    },
  };
}

const names = (rows: Row[]) => rows.map((r) => r.consultant.nome);

describe("weekOptions", () => {
  const options = weekOptions(NOW);

  it("offers the current week and the seven before it", () => {
    expect(options).toHaveLength(8);
    expect(options.map((o) => o.value)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
    ]);
  });

  it("names the current and the previous week with their dates", () => {
    expect(options[0].label).toBe("Esta semana (02/11 a 08/11)");
    expect(options[1].label).toBe("Semana passada (26/10 a 01/11)");
  });

  it("gives older weeks just their dates", () => {
    expect(options[2].label).toBe("Semana de 19/10 a 25/10");
  });
});

describe("dayHeaders", () => {
  it("labels the five working days with their dates", () => {
    expect(dayHeaders(Date.parse("2026-11-02T03:00:00Z"))).toEqual([
      "Seg 02/11",
      "Ter 03/11",
      "Qua 04/11",
      "Qui 05/11",
      "Sex 06/11",
    ]);
  });
});

describe("sortRows", () => {
  const rows = [
    row("Carla", { idleMs: 2 * HOUR, resolved: 9, assigned: 1, replies: 5 }),
    row("Alice", { idleMs: 8 * HOUR, resolved: 1, assigned: 7, replies: 2 }),
    row("Bruno", { idleMs: 8 * HOUR, resolved: 4, assigned: 3, replies: 9 }),
  ];

  it("puts who spent the biggest share of the week idle first, ties by name", () => {
    expect(names(sortRows(rows, SortKey.Idle))).toEqual([
      "Alice",
      "Bruno",
      "Carla",
    ]);
  });

  it("compares shares, not hours, when the working time differs", () => {
    const list = [
      row("Long", { idleMs: 10 * HOUR }, 50 * HOUR),
      row("Short", { idleMs: 5 * HOUR }, 10 * HOUR),
    ];
    expect(names(sortRows(list, SortKey.Idle))).toEqual(["Short", "Long"]);
  });

  it("sorts by resolved, assigned and replies, most first", () => {
    expect(names(sortRows(rows, SortKey.Resolved))).toEqual([
      "Carla",
      "Bruno",
      "Alice",
    ]);
    expect(names(sortRows(rows, SortKey.Assigned))).toEqual([
      "Alice",
      "Bruno",
      "Carla",
    ]);
    expect(names(sortRows(rows, SortKey.Replies))).toEqual([
      "Bruno",
      "Carla",
      "Alice",
    ]);
  });

  it("sorts by name", () => {
    expect(names(sortRows(rows, SortKey.Name))).toEqual([
      "Alice",
      "Bruno",
      "Carla",
    ]);
  });

  it("does not change the list it was given", () => {
    const copy = [...rows];
    sortRows(rows, SortKey.Name);
    expect(rows).toEqual(copy);
  });
});

describe("mostIdle", () => {
  it("returns the consultant with the biggest idle share", () => {
    const list = [row("A", { idleMs: HOUR }), row("B", { idleMs: 9 * HOUR })];
    expect(mostIdle(list)?.consultant.nome).toBe("B");
  });

  it("returns nobody when everyone had work all the time", () => {
    expect(mostIdle([row("A"), row("B")])).toBeUndefined();
    expect(mostIdle([])).toBeUndefined();
  });
});
