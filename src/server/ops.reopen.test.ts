import { beforeEach, describe, expect, it } from "vitest";
import { ApiErrorCode, EventType, Status } from "@/domain/enums";
import { HELENA_ID, MARINA_ID, rawData, RICARDO_ID } from "@/test-data";
import { getDb, initDb } from "./db";
import { addMessage, ApiError, reopenTicket } from "./ops";

const find = (predicate: Parameters<typeof rawData.chamados.find>[0]) =>
  getDb().chamados.find(predicate)!;

const closedOfHelena = () =>
  find(
    (ticket) =>
      ticket.solicitante_id === HELENA_ID && ticket.status === Status.Closed,
  );

beforeEach(() => {
  initDb(rawData);
});

describe("writing on a finished ticket", () => {
  it("is refused to the customer, who has to reopen the ticket first", () => {
    const ticket = closedOfHelena();
    expect(() =>
      addMessage({
        ticketId: ticket.id,
        authorId: HELENA_ID,
        text: "Ainda não funciona",
        internal: false,
      }),
    ).toThrow(ApiError);
    expect(
      getDb().mensagens.some(
        (message) => message.texto === "Ainda não funciona",
      ),
    ).toBe(false);
  });

  it("is also refused on a resolved ticket", () => {
    const ticket = closedOfHelena();
    ticket.status = Status.Resolved;
    expect(() =>
      addMessage({
        ticketId: ticket.id,
        authorId: HELENA_ID,
        text: "Oi",
        internal: false,
      }),
    ).toThrow(ApiErrorCode.TicketFinishedReopenToWrite);
  });

  it("is still allowed to the team, for notes after the ticket was closed", () => {
    const ticket = closedOfHelena();
    expect(() =>
      addMessage({
        ticketId: ticket.id,
        authorId: ticket.responsavel_id!,
        text: "Nota depois do fechamento",
        internal: true,
      }),
    ).not.toThrow();
  });
});

describe("reopenTicket", () => {
  const reopen = (ticketId: string, reason = "A VPN voltou a falhar") =>
    reopenTicket({ ticketId, customerId: HELENA_ID, reason });

  it("brings a closed ticket back into work, with the reason in the history and in the conversation", () => {
    const ticket = closedOfHelena();
    const events = reopen(ticket.id);

    expect(events.map((domainEvent) => domainEvent.tipo)).toEqual([
      EventType.StatusChanged,
      EventType.MessageAdded,
    ]);
    expect(ticket.status).toBe(Status.InProgress);
    const entry = getDb().historico.findLast(
      (historyEntry) => historyEntry.chamado_id === ticket.id,
    );
    expect(entry).toMatchObject({
      para: Status.InProgress,
      usuario_id: HELENA_ID,
      motivo: "Reaberto: A VPN voltou a falhar",
    });
    expect(getDb().mensagens.at(-1)).toMatchObject({
      chamado_id: ticket.id,
      autor_id: HELENA_ID,
      texto: "A VPN voltou a falhar",
      interna: false,
    });
  });

  it("renews the deadlines of a closed ticket and asks for a first response again", () => {
    const ticket = closedOfHelena();
    const before = ticket.prazo_resolucao;
    reopen(ticket.id);
    expect(ticket.prazo_resolucao > before).toBe(true);
    expect(ticket.primeira_resposta_em).toBeNull();
  });

  it("keeps the deadlines of a resolved ticket, as nobody confirmed it was solved", () => {
    const ticket = closedOfHelena();
    ticket.status = Status.Resolved;
    const before = ticket.prazo_resolucao;
    reopen(ticket.id);
    expect(ticket.status).toBe(Status.InProgress);
    expect(ticket.prazo_resolucao).toBe(before);
  });

  it("leaves the ticket with the same consultant", () => {
    const ticket = closedOfHelena();
    const owner = ticket.responsavel_id;
    reopen(ticket.id);
    expect(ticket.responsavel_id).toBe(owner);
  });

  it("lets the customer write again once it is reopened", () => {
    const ticket = closedOfHelena();
    reopen(ticket.id);
    expect(() =>
      addMessage({
        ticketId: ticket.id,
        authorId: HELENA_ID,
        text: "Mais um detalhe",
        internal: false,
      }),
    ).not.toThrow();
  });

  it("refuses a ticket of another customer", () => {
    const other = find(
      (ticket) =>
        ticket.solicitante_id !== HELENA_ID && ticket.status === Status.Closed,
    );
    expect(() => reopen(other.id)).toThrow(ApiError);
    expect(other.status).toBe(Status.Closed);
  });

  it("refuses anyone who is not a customer", () => {
    const ticket = closedOfHelena();
    for (const customerId of [MARINA_ID, RICARDO_ID]) {
      expect(() =>
        reopenTicket({ ticketId: ticket.id, customerId, reason: "x" }),
      ).toThrow(ApiError);
    }
    expect(ticket.status).toBe(Status.Closed);
  });

  it("refuses a ticket that is still being worked on", () => {
    const active = find(
      (ticket) =>
        ticket.solicitante_id === HELENA_ID &&
        ticket.status === Status.WaitingCustomer,
    );
    expect(() => reopen(active.id)).toThrow(ApiErrorCode.TicketStillActive);
  });

  it("asks for the reason and changes nothing without one", () => {
    const ticket = closedOfHelena();
    const messages = getDb().mensagens.length;
    expect(() => reopen(ticket.id, "   ")).toThrow(ApiError);
    expect(ticket.status).toBe(Status.Closed);
    expect(getDb().mensagens).toHaveLength(messages);
  });

  it("refuses a ticket that does not exist", () => {
    expect(() => reopen("nope")).toThrow(ApiError);
  });
});
