import { beforeEach, describe, expect, it } from "vitest";
import type { DomainEvent } from "@/domain/types";
import { getDb, initDb } from "./db";
import { addMessage, assumeTicket } from "./ops";
import { canSeeTicket, eventFor, scopedSnapshot } from "./visibility";
import { HELENA_ID, MARINA_ID, rawData, RICARDO_ID } from "@/test-data";
import { Status, Profile, EventType } from "@/domain/enums";

const person = (id: string) =>
  getDb().usuarios.find((currentPerson) => currentPerson.id === id)!;

beforeEach(() => {
  initDb(rawData);
});

describe("scopedSnapshot", () => {
  it("gives a customer only their own tickets", () => {
    const snap = scopedSnapshot(getDb(), person(HELENA_ID));
    expect(snap.chamados).toHaveLength(4);
    expect(
      snap.chamados.every((ticket) => ticket.solicitante_id === HELENA_ID),
    ).toBe(true);
  });

  it("never sends internal notes, nor other customers, to a customer", () => {
    const database = getDb();
    const withNote = database.mensagens.find((message) => message.interna)!;
    const owner = database.chamados.find(
      (ticket) => ticket.id === withNote.chamado_id,
    )!;
    const snap = scopedSnapshot(database, person(owner.solicitante_id));

    expect(snap.mensagens.some((message) => message.interna)).toBe(false);
    expect(snap.mensagens.some((message) => message.id === withNote.id)).toBe(
      false,
    );
    const customers = snap.usuarios.filter(
      (currentPerson) => currentPerson.perfil === Profile.Customer,
    );
    expect(customers.map((currentPerson) => currentPerson.id)).toEqual([
      owner.solicitante_id,
    ]);

    expect(snap.mensagens.length).toBeGreaterThan(0);
  });

  it("gives a consultant their group's tickets plus anything assigned to them", () => {
    const database = getDb();
    const marina = person(MARINA_ID);
    const snap = scopedSnapshot(database, marina);
    const ids = new Set(snap.chamados.map((ticket) => ticket.id));

    expect(
      database.chamados
        .filter((ticket) => ticket.grupo_id === marina.grupo_id)
        .every((ticket) => ids.has(ticket.id)),
    ).toBe(true);

    expect(snap.chamados.some((ticket) => ticket.numero === 10608)).toBe(true);
    expect(snap.chamados.length).toBeLessThan(database.chamados.length);

    expect(snap.mensagens.some((message) => message.interna)).toBe(true);
  });

  it("gives the manager everything from the groups they look after", () => {
    const snap = scopedSnapshot(getDb(), person(RICARDO_ID));
    expect(snap.chamados).toHaveLength(getDb().chamados.length);
  });
});

describe("eventFor", () => {
  const helena = () => person(HELENA_ID);

  it("hides internal notes from customers but not from staff", () => {
    const ticket = getDb().chamados.find(
      (currentTicket) => currentTicket.solicitante_id === HELENA_ID,
    )!;
    const note: DomainEvent = {
      id: "e",
      tipo: EventType.MessageAdded,
      ocorrido_em: "2026-11-03T13:00:00.000Z",
      payload: {
        id: "m",
        chamado_id: ticket.id,
        criada_em: "2026-11-03T13:00:00.000Z",
        autor_id: MARINA_ID,
        texto: "nota",
        interna: true,
      },
    };
    expect(eventFor(helena(), note, getDb())).toBeNull();
    expect(eventFor(person(RICARDO_ID), note, getDb())).toBe(note);
  });

  it("hides events of tickets the viewer cannot see", () => {
    const database = getDb();
    const strangers = database.chamados.find(
      (ticket) => ticket.solicitante_id !== HELENA_ID,
    )!;
    const event: DomainEvent = {
      id: "e",
      tipo: EventType.TicketAssigned,
      ocorrido_em: "2026-11-03T13:00:00.000Z",
      payload: { chamado_id: strangers.id, consultor_id: MARINA_ID },
    };
    expect(eventFor(helena(), event, database)).toBeNull();
  });

  it("delivers a colleague taking a ticket from the queue to the whole group", () => {
    const database = getDb();
    const marina = person(MARINA_ID);
    const queued = database.chamados.find(
      (ticket) => !ticket.responsavel_id && ticket.grupo_id === marina.grupo_id,
    )!;
    const colleague = database.usuarios.find(
      (currentPerson) =>
        currentPerson.perfil === Profile.Consultant &&
        currentPerson.id !== MARINA_ID &&
        currentPerson.grupo_id === queued.grupo_id,
    )!;
    const [assigned] = assumeTicket(queued.id, colleague.id);
    expect(eventFor(marina, assigned, database)).toBe(assigned);
  });
});

describe("canSeeTicket", () => {
  it("keeps consultants out of other groups' unassigned tickets", () => {
    const database = getDb();
    const marina = person(MARINA_ID);
    const foreign = database.chamados.find(
      (ticket) =>
        ticket.grupo_id !== marina.grupo_id &&
        ticket.responsavel_id !== MARINA_ID,
    )!;
    expect(canSeeTicket(marina, foreign)).toBe(false);
  });

  it("follows a message to the customer who owns the ticket", () => {
    const ticket = getDb().chamados.find(
      (currentTicket) =>
        currentTicket.responsavel_id &&
        currentTicket.status === Status.InProgress,
    )!;
    const [event] = addMessage({
      ticketId: ticket.id,
      authorId: ticket.responsavel_id!,
      text: "Olá",
      internal: false,
    });
    const owner = person(ticket.solicitante_id);
    expect(eventFor(owner, event, getDb())).toBe(event);
  });
});
