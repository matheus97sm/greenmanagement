import { describe, expect, it } from "vitest";
import { SlaKind } from "@/domain/enums";
import type { Group, HistoryEntry, Person, Ticket } from "@/domain/types";
import { rawData } from "@/test-data";
import { buildItems, isLocked, selectionScope } from "./utils";

const NOW = Date.parse(rawData.meta.agora);
const byNumber = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero) as Ticket;

const people: Record<string, Person> = Object.fromEntries(
  rawData.usuarios.map((u) => [u.id, u]),
);
const groups: Record<string, Group> = Object.fromEntries(
  rawData.grupos.map((g) => [g.id, g]),
);
const history: Record<string, HistoryEntry[]> = {};
for (const entry of rawData.historico) {
  (history[entry.chamado_id] ??= []).push(entry);
}

const [infra, apps] = rawData.grupos;
const infraTicket = byNumber(10503);
const appsTicket = rawData.chamados.find((t) => t.grupo_id === apps.id)!;
const otherInfraTicket = rawData.chamados.find(
  (t) => t.grupo_id === infra.id && t.id !== infraTicket.id,
)!;

describe("buildItems", () => {
  const items = buildItems({
    tickets: [infraTicket, appsTicket],
    people,
    groups,
    history,
    now: NOW,
  });

  it("makes one item per ticket, in the same order", () => {
    expect(items.map((i) => i.ticket.id)).toEqual([
      infraTicket.id,
      appsTicket.id,
    ]);
  });

  it("names the requester with the company, to tell namesakes apart", () => {
    const requester = people[infraTicket.solicitante_id];
    expect(items[0].requester).toBe(`${requester.nome} · ${requester.empresa}`);
  });

  it("names who has the ticket, or nobody when nobody does", () => {
    expect(items[0].owner).toBe(people[infraTicket.responsavel_id!].nome);
    const queued = rawData.chamados.find((t) => !t.responsavel_id)!;
    const [item] = buildItems({
      tickets: [queued],
      people,
      groups,
      history,
      now: NOW,
    });
    expect(item.owner).toBeUndefined();
  });

  it("names the group of the ticket", () => {
    expect(items[0].group).toBe("Infraestrutura");
    expect(items[1].group).toBe("Aplicações");
  });

  it("works out the deadline state at the given time", () => {
    expect(items[0].sla.kind).toBe(SlaKind.Breached);
  });

  it("copes with a requester or a group it does not know", () => {
    const [item] = buildItems({
      tickets: [infraTicket],
      people: {},
      groups: {},
      history: {},
      now: NOW,
    });
    expect(item.requester).toBe("");
    expect(item.owner).toBeUndefined();
    expect(item.group).toBe("");
  });
});

describe("selectionScope", () => {
  const mixed = [infraTicket, appsTicket, otherInfraTicket];

  it("takes the group of the first ticket when nothing is locked", () => {
    const scope = selectionScope(mixed, undefined);
    expect(scope.targetGroupId).toBe(infra.id);
    expect(scope.selectable.map((t) => t.id)).toEqual([
      infraTicket.id,
      otherInfraTicket.id,
    ]);
  });

  it("takes the locked group, even when it is not the first one", () => {
    const scope = selectionScope(mixed, apps.id);
    expect(scope.targetGroupId).toBe(apps.id);
    expect(scope.selectable.map((t) => t.id)).toEqual([appsTicket.id]);
  });

  it("says the list is mixed when some tickets are left out", () => {
    expect(selectionScope(mixed, undefined).mixed).toBe(true);
  });

  it("says the list is not mixed when every ticket belongs to one group", () => {
    const scope = selectionScope([infraTicket, otherInfraTicket], undefined);
    expect(scope.mixed).toBe(false);
    expect(scope.selectable).toHaveLength(2);
  });

  it("has nothing to select in an empty list", () => {
    expect(selectionScope([], undefined)).toEqual({
      targetGroupId: undefined,
      selectable: [],
      mixed: false,
    });
  });
});

describe("isLocked", () => {
  it("locks nothing while no group is locked", () => {
    expect(isLocked(infraTicket, undefined)).toBe(false);
    expect(isLocked(appsTicket, undefined)).toBe(false);
  });

  it("locks the tickets of every other group", () => {
    expect(isLocked(appsTicket, infra.id)).toBe(true);
  });

  it("leaves the tickets of the locked group free", () => {
    expect(isLocked(infraTicket, infra.id)).toBe(false);
  });
});
