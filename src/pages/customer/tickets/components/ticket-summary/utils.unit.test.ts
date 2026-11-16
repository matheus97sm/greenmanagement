import { describe, expect, it } from "vitest";
import {
  CustomerStage,
  Expectation,
  HistoryType,
  Status,
} from "@/domain/enums";
import type { HistoryEntry, Person, Ticket } from "@/domain/types";
import { Language, setLanguage, translatorFor } from "@/i18n";
import { HELENA_ID, rawData } from "@/test-data";
import { locales } from "./locales";
import { expectationText, progressEvents, summaryOf } from "./utils";

const translate = translatorFor(locales);
const NOW = Date.parse(rawData.meta.agora);
const people: Record<string, Person> = Object.fromEntries(
  rawData.usuarios.map((person) => [person.id, person]),
);
const byNumber = (numero: number) =>
  rawData.chamados.find((ticket) => ticket.numero === numero) as Ticket;
const historyOf = (ticket: Ticket): HistoryEntry[] =>
  rawData.historico
    .filter((historyEntry) => historyEntry.chamado_id === ticket.id)
    .sort((firstHistoryEntry, historyEntry) =>
      firstHistoryEntry.ocorrido_em.localeCompare(historyEntry.ocorrido_em),
    );
const textsOf = (numero: number, meId = HELENA_ID) => {
  const ticket = byNumber(numero);
  return progressEvents({
    ticket,
    history: historyOf(ticket),
    people,
    meId,
    translate,
  }).map((progressEvent) => progressEvent.text);
};

describe("summaryOf", () => {
  const summary = (ticket: Ticket) =>
    summaryOf({ ticket, people, now: NOW, translate });

  it("tells the customer that nobody has taken a new ticket yet", () => {
    const result = summary(byNumber(10614));
    expect(result.stage).toBe(CustomerStage.Received);
    expect(result.handler).toBeNull();
    expect(result.headline).toMatch(/Ainda não foi pego/);
  });

  it("says who is looking after a ticket in progress", () => {
    const result = summary(byNumber(10611));
    expect(result.stage).toBe(CustomerStage.InProgress);
    expect(result.handler).toBe("Marina Almeida");
    expect(result.headline).toBe(
      "Marina Almeida está cuidando do seu chamado.",
    );
  });

  it("says the team needs an answer when it is waiting for the customer", () => {
    const result = summary(byNumber(10613));
    expect(result.stage).toBe(CustomerStage.WaitingYou);
    expect(result.headline).toBe(
      "Juliana Pereira precisa de uma resposta sua para continuar.",
    );
  });

  it("offers the way back for a closed ticket", () => {
    const result = summary(byNumber(10612));
    expect(result.stage).toBe(CustomerStage.Closed);
    expect(result.headline).toMatch(/reabri-lo/);
  });

  it("offers the way back for a resolved ticket too", () => {
    const resolved = { ...byNumber(10612), status: Status.Resolved };
    expect(summary(resolved).headline).toMatch(/resolvido.*reabri-lo/);
  });

  it("tells a ticket handed to someone who has not started", () => {
    const assigned = {
      ...byNumber(10614),
      responsavel_id: byNumber(10611).responsavel_id,
    };
    expect(summary(assigned).headline).toBe(
      "Marina Almeida vai atender o seu chamado.",
    );
  });

  it("does not name anyone it cannot find, and says the team instead", () => {
    const result = summaryOf({
      ticket: byNumber(10611),
      people: {},
      now: NOW,
      translate,
    });
    expect(result.handler).toBeNull();
    expect(result.headline).toBe("A equipe está cuidando do seu chamado.");
  });

  it("carries the next expectation", () => {
    expect(summary(byNumber(10614)).expectation.kind).toBe(
      Expectation.FirstResponse,
    );
    expect(summary(byNumber(10613)).expectation.kind).toBe(Expectation.None);
  });
});

describe("expectationText", () => {
  const format = (iso: string) => `em ${iso.slice(0, 10)}`;
  const at = "2026-11-04T09:00:00Z";

  it("says nothing when there is nothing to expect", () => {
    expect(
      expectationText(
        { kind: Expectation.None, at: null, overdue: false },
        format,
        translate,
      ),
    ).toBeNull();
  });

  it("promises the first response while nobody has answered", () => {
    expect(
      expectationText(
        { kind: Expectation.FirstResponse, at, overdue: false },
        format,
        translate,
      ),
    ).toBe("Primeira resposta prevista até em 2026-11-04");
  });

  it("promises the solution once someone has answered", () => {
    expect(
      expectationText(
        { kind: Expectation.Resolution, at, overdue: false },
        format,
        translate,
      ),
    ).toBe("Solução prevista até em 2026-11-04");
  });

  it("admits when the date has already passed", () => {
    expect(
      expectationText(
        { kind: Expectation.Resolution, at, overdue: true },
        format,
        translate,
      ),
    ).toBe("Solução prevista até em 2026-11-04 (esse prazo já passou)");
  });
});

describe("progressEvents", () => {
  it("starts with the opening of the ticket", () => {
    expect(textsOf(10614)).toEqual(["Chamado aberto"]);
  });

  it("tells who took the ticket, and then that it is waiting for the customer", () => {
    expect(textsOf(10613)).toEqual([
      "Chamado aberto",
      "Juliana Pereira assumiu o chamado",
      "Aguardando a sua resposta",
    ]);
  });

  it("tells a ticket from opening to closing, without saying the same thing twice", () => {
    expect(textsOf(10612)).toEqual([
      "Chamado aberto",
      "Thiago Nascimento assumiu o chamado",
      "Thiago Nascimento marcou o chamado como resolvido",
      "Chamado encerrado",
    ]);
  });

  it("tells a ticket that was reopened", () => {
    expect(textsOf(10611)).toEqual([
      "Chamado aberto",
      "Marina Almeida assumiu o chamado",
      "Marina Almeida marcou o chamado como resolvido",
      "Chamado encerrado",
      "Chamado reaberto",
    ]);
  });

  it("says the customer reopened it when she did", () => {
    const ticket = byNumber(10611);
    const reopening = historyOf(ticket).find(
      (historyEntry) =>
        historyEntry.de === Status.Closed &&
        historyEntry.para === Status.InProgress,
    )!;
    const texts = progressEvents({
      ticket,
      history: [{ ...reopening, usuario_id: HELENA_ID }],
      people,
      meId: HELENA_ID,
      translate,
    }).map((progressEvent) => progressEvent.text);
    expect(texts).toContain("Você reabriu o chamado");
  });

  it("says the work resumed when the customer answered", () => {
    const ticket = byNumber(10613);
    const history: HistoryEntry[] = [
      {
        id: "back",
        chamado_id: ticket.id,
        tipo: HistoryType.Status,
        de: Status.WaitingCustomer,
        para: Status.InProgress,
        usuario_id: HELENA_ID,
        motivo: "Cliente respondeu",
        ocorrido_em: "2026-11-02T10:00:00Z",
      },
    ];
    expect(
      progressEvents({
        ticket,
        history,
        people,
        meId: HELENA_ID,
        translate,
      }).map((progressEvent) => progressEvent.text),
    ).toContain("Atendimento retomado");
  });

  it("never shows the reasons the team wrote or any internal detail", () => {
    for (const numero of [10611, 10612, 10613]) {
      const joined = textsOf(numero).join(" ");
      expect(joined).not.toMatch(
        /Motivo|Pegando da fila|Fechado automaticamente/,
      );
    }
  });

  it("lists the events in the order they happened", () => {
    const ticket = byNumber(10611);
    const events = progressEvents({
      ticket,
      history: [...historyOf(ticket)].reverse(),
      people,
      meId: HELENA_ID,
      translate,
    });
    expect(events.map((progressEvent) => progressEvent.at)).toEqual(
      [...events.map((progressEvent) => progressEvent.at)].sort(),
    );
  });

  it("starts the list with only the opening when there is no history", () => {
    const ticket = byNumber(10613);
    expect(
      progressEvents({
        ticket,
        history: undefined,
        people,
        meId: HELENA_ID,
        translate,
      }),
    ).toHaveLength(1);
  });

  it("does not name anyone it cannot find", () => {
    const ticket = byNumber(10613);
    const texts = progressEvents({
      ticket,
      history: historyOf(ticket),
      people: {},
      meId: HELENA_ID,
      translate,
    }).map((progressEvent) => progressEvent.text);
    expect(texts).toContain("A equipe assumiu o chamado");
  });
});

describe("in English", () => {
  const ticketOf = (numero: number) => byNumber(numero);

  it("tells the story of a ticket in English", async () => {
    await setLanguage(Language.EnUs);
    expect(textsOf(10612)).toEqual([
      "Ticket opened",
      "Thiago Nascimento took the ticket",
      "Thiago Nascimento marked the ticket as resolved",
      "Ticket closed",
    ]);
  });

  it("says who is looking after a ticket in English", async () => {
    await setLanguage(Language.EnUs);
    const result = summaryOf({
      ticket: ticketOf(10611),
      people,
      now: NOW,
      translate,
    });
    expect(result.headline).toBe(
      "Marina Almeida is taking care of your ticket.",
    );
  });

  it("promises a date in English", async () => {
    await setLanguage(Language.EnUs);
    expect(
      expectationText(
        {
          kind: Expectation.Resolution,
          at: "2026-11-04T09:00:00Z",
          overdue: true,
        },
        (iso) => iso.slice(0, 10),
        translate,
      ),
    ).toBe("Solution expected by 2026-11-04 (that date has already passed)");
  });

  it("never shows internal terms to the customer in English", async () => {
    await setLanguage(Language.EnUs);
    for (const numero of [10611, 10612, 10613, 10614]) {
      const ticket = ticketOf(numero);
      const headline = summaryOf({
        ticket,
        people,
        now: NOW,
        translate,
      }).headline;
      const joined = [headline, ...textsOf(numero)].join(" ");
      expect(joined).not.toMatch(
        /Reason|queue|priority|SLA|category|internal|status/i,
      );
    }
  });
});
