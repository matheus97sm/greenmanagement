import { describe, expect, it } from "vitest";
import type { Person, Ticket } from "./types";
import { rawData } from "@/test-data";
import { matchesSearch } from "./search";

const people: Record<string, Person> = Object.fromEntries(
  rawData.usuarios.map((u) => [u.id, u]),
);
const byNumber = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero) as Ticket;

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
