import { beforeEach, describe, expect, it } from "vitest";
import type { DomainEvent } from "../domain/types";
import { getDb, initDb } from "./db";
import { addMessage, assumeTicket } from "./ops";
import { canSeeTicket, eventFor, scopedSnapshot } from "./visibility";
import { HELENA_ID, MARINA_ID, rawData, RICARDO_ID } from "../test-data";

const person = (id: string) => getDb().usuarios.find((u) => u.id === id)!;

beforeEach(() => {
  initDb(rawData);
});

describe("scopedSnapshot", () => {
  it("gives a customer only their own tickets", () => {
    const snap = scopedSnapshot(getDb(), person(HELENA_ID));
    expect(snap.chamados).toHaveLength(4);
    expect(snap.chamados.every((t) => t.solicitante_id === HELENA_ID)).toBe(
      true,
    );
  });

  it("never sends internal notes, nor other customers, to a customer", () => {
    const db = getDb();
    const withNote = db.mensagens.find((m) => m.interna)!;
    const owner = db.chamados.find((t) => t.id === withNote.chamado_id)!;
    const snap = scopedSnapshot(db, person(owner.solicitante_id));

    expect(snap.mensagens.some((m) => m.interna)).toBe(false);
    expect(snap.mensagens.some((m) => m.id === withNote.id)).toBe(false);
    const customers = snap.usuarios.filter((u) => u.perfil === "cliente");
    expect(customers.map((u) => u.id)).toEqual([owner.solicitante_id]);

    expect(snap.mensagens.length).toBeGreaterThan(0);
  });

  it("gives a consultant their group's tickets plus anything assigned to them", () => {
    const db = getDb();
    const marina = person(MARINA_ID);
    const snap = scopedSnapshot(db, marina);
    const ids = new Set(snap.chamados.map((t) => t.id));

    expect(
      db.chamados
        .filter((t) => t.grupo_id === marina.grupo_id)
        .every((t) => ids.has(t.id)),
    ).toBe(true);

    expect(snap.chamados.some((t) => t.numero === 10608)).toBe(true);
    expect(snap.chamados.length).toBeLessThan(db.chamados.length);

    expect(snap.mensagens.some((m) => m.interna)).toBe(true);
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
      (t) => t.solicitante_id === HELENA_ID,
    )!;
    const note: DomainEvent = {
      id: "e",
      tipo: "mensagem.adicionada",
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
    const db = getDb();
    const strangers = db.chamados.find((t) => t.solicitante_id !== HELENA_ID)!;
    const event: DomainEvent = {
      id: "e",
      tipo: "chamado.atribuido",
      ocorrido_em: "2026-11-03T13:00:00.000Z",
      payload: { chamado_id: strangers.id, consultor_id: MARINA_ID },
    };
    expect(eventFor(helena(), event, db)).toBeNull();
  });

  it("delivers a colleague taking a ticket from the queue to the whole group", () => {
    const db = getDb();
    const marina = person(MARINA_ID);
    const queued = db.chamados.find(
      (t) => !t.responsavel_id && t.grupo_id === marina.grupo_id,
    )!;
    const colleague = db.usuarios.find(
      (u) =>
        u.perfil === "consultor" &&
        u.id !== MARINA_ID &&
        u.grupo_id === queued.grupo_id,
    )!;
    const [assigned] = assumeTicket(queued.id, colleague.id);
    expect(eventFor(marina, assigned, db)).toBe(assigned);
  });
});

describe("canSeeTicket", () => {
  it("keeps consultants out of other groups' unassigned tickets", () => {
    const db = getDb();
    const marina = person(MARINA_ID);
    const foreign = db.chamados.find(
      (t) => t.grupo_id !== marina.grupo_id && t.responsavel_id !== MARINA_ID,
    )!;
    expect(canSeeTicket(marina, foreign)).toBe(false);
  });

  it("follows a message to the customer who owns the ticket", () => {
    const ticket = getDb().chamados.find(
      (t) => t.responsavel_id && t.status === "em_atendimento",
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
