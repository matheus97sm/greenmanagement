import { beforeEach, describe, expect, it } from "vitest";
import { CustomerStage } from "@/domain/enums";
import { ticketsStore } from "@/store/ticketsStore";
import { HELENA_ID, rawData } from "@/test-data";
import { loadStoreAs } from "@/test-utils";
import type { ListItem } from "./types";
import { attentionRank, handlerLine, listItems, unreadLabel } from "./utils";

const idOf = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero)!.id;

const numbers = (search = "") =>
  listItems({ state: ticketsStore.getState(), meId: HELENA_ID, search }).map(
    (item) => item.ticket.numero,
  );

describe("listItems", () => {
  beforeEach(() => {
    loadStoreAs(HELENA_ID);
  });

  it("lists every ticket of the customer", () => {
    expect([...numbers()].sort()).toEqual([10611, 10612, 10613, 10614]);
  });

  it("puts first what is waiting for her, then the active ones, and the finished last", () => {
    expect(numbers()).toEqual([10613, 10614, 10611, 10612]);
  });

  it("brings up a ticket that has news she has not seen", () => {
    ticketsStore.restoreRead({ [idOf(10611)]: "2026-10-20T00:00:00.000Z" });
    expect(numbers()).toEqual([10613, 10611, 10614, 10612]);
  });

  it("counts the unread messages of each ticket", () => {
    ticketsStore.restoreRead({ [idOf(10611)]: "2026-10-20T00:00:00.000Z" });
    const item = listItems({
      state: ticketsStore.getState(),
      meId: HELENA_ID,
      search: "",
    }).find((i) => i.ticket.id === idOf(10611))!;
    expect(item.unread).toBe(2);
  });

  it("names who has each ticket, or nobody", () => {
    const handlers = Object.fromEntries(
      listItems({
        state: ticketsStore.getState(),
        meId: HELENA_ID,
        search: "",
      }).map((i) => [i.ticket.numero, i.handler]),
    );
    expect(handlers).toEqual({
      10611: "Marina Almeida",
      10612: "Thiago Nascimento",
      10613: "Juliana Pereira",
      10614: null,
    });
  });

  it("filters by number or by words of the title", () => {
    expect(numbers("10612")).toEqual([10612]);
    expect(numbers("acesso")).toEqual([10613]);
    expect(numbers("vpn").sort()).toEqual([10612, 10614]);
  });

  it("finds nothing for something that matches nothing", () => {
    expect(numbers("zzzz")).toEqual([]);
  });
});

describe("attentionRank", () => {
  const item = (stage: CustomerStage, unread = 0): ListItem => ({
    ticket: {} as ListItem["ticket"],
    stage,
    handler: null,
    unread,
  });

  it("ranks waiting for her first, then news, then active, then finished", () => {
    expect(attentionRank(item(CustomerStage.WaitingYou))).toBe(0);
    expect(attentionRank(item(CustomerStage.InProgress, 3))).toBe(1);
    expect(attentionRank(item(CustomerStage.InProgress))).toBe(2);
    expect(attentionRank(item(CustomerStage.Received))).toBe(2);
    expect(attentionRank(item(CustomerStage.Resolved))).toBe(3);
    expect(attentionRank(item(CustomerStage.Closed))).toBe(3);
  });

  it("keeps waiting for her ahead of news", () => {
    expect(attentionRank(item(CustomerStage.WaitingYou, 5))).toBe(0);
  });

  it("ranks news on a finished ticket above the quiet active ones", () => {
    expect(attentionRank(item(CustomerStage.Closed, 1))).toBe(1);
  });
});

describe("handlerLine and unreadLabel", () => {
  it("says who has the ticket, or that nobody does", () => {
    expect(handlerLine("Marina Almeida")).toBe("Com Marina Almeida");
    expect(handlerLine(null)).toBe("Ainda sem responsável");
  });

  it("uses the singular for one new message", () => {
    expect(unreadLabel(1)).toBe("1 nova");
    expect(unreadLabel(3)).toBe("3 novas");
  });
});
