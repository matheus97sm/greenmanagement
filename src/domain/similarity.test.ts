import { describe, expect, it } from "vitest";
import type { Ticket } from "./types";
import { similarTickets, tokensOf } from "./similarity";
import { HELENA_ID, rawData } from "@/test-data";

const helenas = rawData.chamados.filter((t) => t.solicitante_id === HELENA_ID);
const byNumber = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero) as Ticket;

const withTitle = (titulo: string, atualizado_em: string): Ticket => ({
  ...byNumber(10611),
  id: titulo,
  titulo,
  atualizado_em,
});

describe("tokensOf", () => {
  it("lower-cases and ignores accents", () => {
    expect(tokensOf("Conexão Instável")).toEqual(["conexao", "instavel"]);
  });

  it("drops short words and common ones", () => {
    expect(tokensOf("A VPN não liga em casa")).toEqual(["vpn", "liga", "casa"]);
  });

  it("splits on punctuation and keeps each word once", () => {
    expect(tokensOf("e-mail, e-mail; ERP/CRM!")).toEqual([
      "mail",
      "erp",
      "crm",
    ]);
  });

  it("is empty for text with nothing meaningful", () => {
    expect(tokensOf("")).toEqual([]);
    expect(tokensOf("o a de")).toEqual([]);
  });
});

describe("similarTickets", () => {
  it("finds the closed ticket about the same problem, even worded differently", () => {
    const hits = similarTickets(
      { title: "VPN não liga em casa", description: "" },
      helenas,
    );
    expect(hits.map((h) => h.ticket.numero)).toContain(10612);
  });

  it("also finds the duplicate that is still open", () => {
    const hits = similarTickets(
      { title: "VPN não liga em casa", description: "" },
      helenas,
    );
    expect(hits.map((h) => h.ticket.numero)).toContain(10614);
  });

  it("looks at the description too, not only at the title", () => {
    const hits = similarTickets(
      {
        title: "Problema de acesso",
        description: "Mensagens chegando com horas de atraso",
      },
      helenas,
    );
    expect(hits.map((h) => h.ticket.numero)).toContain(10611);
  });

  it("finds nothing for an unrelated problem", () => {
    expect(
      similarTickets(
        { title: "Impressora sem toner", description: "Trocar o cartucho" },
        helenas,
      ),
    ).toEqual([]);
  });

  it("does not guess from a single shared word", () => {
    expect(similarTickets({ title: "VPN", description: "" }, helenas)).toEqual(
      [],
    );
    expect(
      similarTickets({ title: "VPN lenta", description: "" }, helenas),
    ).toEqual([]);
  });

  it("stays quiet when there is almost nothing written yet", () => {
    expect(similarTickets({ title: "", description: "" }, helenas)).toEqual([]);
  });

  it("scores by how much of the old title the new text covers", () => {
    const [hit] = similarTickets(
      { title: "VPN não liga a partir de casa", description: "" },
      [byNumber(10612)],
    );
    expect(hit.score).toBe(1);
  });

  it("puts the closest first, then the most recently updated", () => {
    const exact = withTitle("vpn liga casa partir", "2026-01-01T00:00:00Z");
    const looser = withTitle(
      "vpn liga casa partir ligacao",
      "2026-02-01T00:00:00Z",
    );
    const newer = withTitle("vpn liga casa partir", "2026-03-01T00:00:00Z");
    const hits = similarTickets(
      { title: "vpn liga casa partir", description: "" },
      [looser, exact, newer],
    );
    expect(hits.map((h) => h.ticket.id)).toEqual([
      newer.id,
      exact.id,
      looser.id,
    ]);
  });

  it("returns at most three by default and as many as asked", () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      withTitle("vpn liga casa", `2026-01-0${i + 1}T00:00:00Z`),
    );
    const draft = { title: "vpn liga casa", description: "" };
    expect(similarTickets(draft, many)).toHaveLength(3);
    expect(similarTickets(draft, many, { limit: 5 })).toHaveLength(5);
  });

  it("can be made stricter", () => {
    const draft = { title: "VPN não liga em casa", description: "" };
    expect(
      similarTickets(draft, helenas, { minScore: 0.9 }).map(
        (h) => h.ticket.numero,
      ),
    ).toEqual([]);
  });
});
