import { beforeEach, describe, expect, it } from "vitest";
import type { ConsultantWeek } from "@/domain/activity";
import { Language, setLanguage, translatorFor } from "@/i18n";
import { LoadLevel, Profile } from "@/domain/enums";
import type { Group, HistoryEntry, Message } from "@/domain/types";
import { weekRange } from "@/domain/week";
import { consultantsOf } from "@/domain/workload";
import { rawData } from "@/test-data";
import { SortKey } from "./enums";
import { locales } from "./locales";
import type { Row } from "./types";
import {
  buildRows,
  dayHeaders,
  mostIdle,
  sortRows,
  weekOptions,
} from "./utils";

const HOUR = 3_600_000;
const translate = translatorFor(locales);
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

const names = (rows: Row[]) =>
  rows.map((currentRow) => currentRow.consultant.nome);

describe("weekOptions", () => {
  const options = weekOptions(NOW, translate, Language.PtBr);

  it("offers the current week and the seven before it", () => {
    expect(options).toHaveLength(8);
    expect(options.map((weekOption) => weekOption.value)).toEqual([
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
    expect(
      dayHeaders(Date.parse("2026-11-02T03:00:00Z"), translate, Language.PtBr),
    ).toEqual([
      "Seg 02/11",
      "Ter 03/11",
      "Qua 04/11",
      "Qui 05/11",
      "Sex 06/11",
    ]);
  });
});

describe("in English", () => {
  beforeEach(() => setLanguage(Language.EnUs));

  it("names the weeks in English", () => {
    const options = weekOptions(NOW, translate, Language.EnUs);
    expect(options[0].label).toBe("This week (11/02 to 11/08)");
    expect(options[1].label).toBe("Last week (10/26 to 11/01)");
    expect(options[2].label).toBe("Week of 10/19 to 10/25");
  });

  it("labels the working days in English", () => {
    expect(
      dayHeaders(Date.parse("2026-11-02T03:00:00Z"), translate, Language.EnUs),
    ).toEqual([
      "Mon 11/02",
      "Tue 11/03",
      "Wed 11/04",
      "Thu 11/05",
      "Fri 11/06",
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

describe("buildRows", () => {
  const history: Record<string, HistoryEntry[]> = {};
  for (const entry of rawData.historico) {
    (history[entry.chamado_id] ??= []).push(entry);
  }
  const messages: Record<string, Message[]> = {};
  for (const message of rawData.mensagens) {
    (messages[message.chamado_id] ??= []).push(message);
  }
  const groups: Record<string, Group> = Object.fromEntries(
    rawData.grupos.map((group) => [group.id, group]),
  );
  const consultants = consultantsOf(
    rawData.usuarios,
    rawData.grupos.map((group) => group.id),
  );
  const now = Date.parse(rawData.meta.agora);

  const rows = buildRows({
    consultants,
    tickets: rawData.chamados,
    history,
    messages,
    groups,
    range: weekRange(now),
    now,
  });

  it("makes one row per consultant, in the same order", () => {
    expect(rows.map((currentRow) => currentRow.consultant.id)).toEqual(
      consultants.map((person) => person.id),
    );
  });

  it("puts each consultant next to their own week and their own load", () => {
    for (const row of rows) {
      expect(row.week.consultantId).toBe(row.consultant.id);
      expect(row.workload.consultant.id).toBe(row.consultant.id);
    }
  });

  it("names the group of each consultant", () => {
    const leandro = rows.find(
      (currentRow) => currentRow.consultant.nome === "Leandro Alves",
    )!;
    const marina = rows.find(
      (currentRow) => currentRow.consultant.nome === "Marina Almeida",
    )!;
    expect(leandro.groupName).toBe("Aplicações");
    expect(marina.groupName).toBe("Infraestrutura");
  });

  it("carries the week of the range it was given", () => {
    const leandro = rows.find(
      (currentRow) => currentRow.consultant.nome === "Leandro Alves",
    )!;
    expect(leandro.week.idleMs).toBe(leandro.week.businessMs);
    expect(leandro.workload.active).toBe(0);
  });

  it("leaves the group name empty when the group is unknown", () => {
    const [row] = buildRows({
      consultants: consultants.slice(0, 1),
      tickets: [],
      history: {},
      messages: {},
      groups: {},
      range: weekRange(now),
      now,
    });
    expect(row.groupName).toBe("");
  });

  it("makes no rows for no consultants", () => {
    expect(
      buildRows({
        consultants: [],
        tickets: rawData.chamados,
        history,
        messages,
        groups,
        range: weekRange(now),
        now,
      }),
    ).toEqual([]);
  });
});
