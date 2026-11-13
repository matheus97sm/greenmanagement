import { describe, expect, it } from "vitest";
import { Status } from "@/domain/enums";
import type { Person, Ticket } from "@/domain/types";
import { MARINA_ID, rawData } from "@/test-data";
import { StatusOption, Tab } from "./enums";
import {
  matchesSearch,
  matchesStatus,
  selectRows,
  splitTickets,
  statusFilterOptions,
} from "./utils";

const NOW = Date.parse(rawData.meta.agora);
const people: Record<string, Person> = Object.fromEntries(
  rawData.usuarios.map((u) => [u.id, u]),
);
const marina = people[MARINA_ID];
const byNumber = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero) as Ticket;

describe("splitTickets", () => {
  const { mine, queue } = splitTickets(
    rawData.chamados,
    MARINA_ID,
    marina.grupo_id,
  );

  it("separates the tickets assigned to the consultant", () => {
    expect(mine).toHaveLength(42);
    expect(mine.every((t) => t.responsavel_id === MARINA_ID)).toBe(true);
  });

  it("builds the queue from open, unassigned tickets of her group", () => {
    expect(queue).toHaveLength(35);
    expect(
      queue.every(
        (t) =>
          t.responsavel_id === null &&
          t.status === Status.Open &&
          t.grupo_id === marina.grupo_id,
      ),
    ).toBe(true);
  });

  it("has an empty queue when the group is unknown", () => {
    expect(splitTickets(rawData.chamados, MARINA_ID, undefined).queue).toEqual(
      [],
    );
  });
});

describe("matchesStatus", () => {
  const inProgress = byNumber(10503);
  const closed = rawData.chamados.find((t) => t.status === Status.Closed)!;

  it("treats the active option as everything not resolved nor closed", () => {
    expect(matchesStatus(inProgress, StatusOption.Active)).toBe(true);
    expect(matchesStatus(closed, StatusOption.Active)).toBe(false);
  });

  it("accepts every ticket for the all option", () => {
    expect(matchesStatus(inProgress, StatusOption.All)).toBe(true);
    expect(matchesStatus(closed, StatusOption.All)).toBe(true);
  });

  it("matches a specific status exactly", () => {
    expect(matchesStatus(closed, Status.Closed)).toBe(true);
    expect(matchesStatus(closed, Status.Open)).toBe(false);
  });
});

describe("matchesSearch", () => {
  const ticket = byNumber(10503);
  const requester = people[ticket.solicitante_id];

  it("accepts an empty search", () => {
    expect(matchesSearch(ticket, "   ", people)).toBe(true);
  });

  it("matches the ticket number", () => {
    expect(matchesSearch(ticket, "10503", people)).toBe(true);
    expect(matchesSearch(ticket, "99999", people)).toBe(false);
  });

  it("matches the title regardless of case", () => {
    expect(matchesSearch(ticket, ticket.titulo.toUpperCase(), people)).toBe(
      true,
    );
  });

  it("matches the requester name and company", () => {
    expect(matchesSearch(ticket, requester.nome.slice(0, 4), people)).toBe(
      true,
    );
    expect(matchesSearch(ticket, requester.empresa ?? "", people)).toBe(true);
  });

  it("copes with an unknown requester", () => {
    expect(matchesSearch(ticket, "10503", {})).toBe(true);
    expect(matchesSearch(ticket, "zzz", {})).toBe(false);
  });
});

describe("selectRows", () => {
  const { mine, queue } = splitTickets(
    rawData.chamados,
    MARINA_ID,
    marina.grupo_id,
  );
  const base = {
    mine,
    queue,
    tab: Tab.Mine,
    statusFilter: StatusOption.Active,
    search: "",
    people,
    now: NOW,
  };

  it("starts with the most urgent ticket: critical and breached", () => {
    const rows = selectRows(base);
    expect(rows[0].numero).toBe(10503);
  });

  it("returns only the queue on the queue tab", () => {
    const rows = selectRows({ ...base, tab: Tab.Queue });
    expect(rows).toHaveLength(35);
    expect(rows.every((t) => t.status === Status.Open)).toBe(true);
  });

  it("applies the search on top of the tab", () => {
    const rows = selectRows({ ...base, search: "10527" });
    expect(rows.map((t) => t.numero)).toEqual([10527]);
  });

  it("applies the status filter", () => {
    expect(selectRows({ ...base, statusFilter: Status.Closed })).toHaveLength(
      0,
    );
    expect(
      selectRows({ ...base, statusFilter: Status.InProgress }),
    ).toHaveLength(42);
  });

  it("does not reorder the input lists", () => {
    const before = mine.map((t) => t.id);
    selectRows(base);
    expect(mine.map((t) => t.id)).toEqual(before);
  });
});

describe("statusFilterOptions", () => {
  it("offers the two shortcuts followed by every status", () => {
    const options = statusFilterOptions();
    expect(options.slice(0, 2).map((o) => o.value)).toEqual([
      StatusOption.Active,
      StatusOption.All,
    ]);
    expect(options).toHaveLength(2 + Object.values(Status).length);
    expect(options.find((o) => o.value === Status.WaitingCustomer)?.label).toBe(
      "Aguardando cliente",
    );
  });
});
