import { beforeEach, describe, expect, it } from "vitest";
import { getDb, initDb } from "./db";
import {
  addMessage,
  ApiError,
  assumeTicket,
  changeStatus,
  openTicket,
} from "./ops";
import { HELENA_ID, MARINA_ID, rawData, RICARDO_ID } from "@/test-data";
import { Status, Priority, Profile, EventType } from "@/domain/enums";

const person = (id: string) => getDb().usuarios.find((u) => u.id === id)!;
const ticketOf = (id: string) => getDb().chamados.find((t) => t.id === id)!;

const find = (predicate: Parameters<typeof rawData.chamados.find>[0]) =>
  getDb().chamados.find(predicate)!;

beforeEach(() => {
  initDb(rawData);
});

describe("the real data set", () => {
  it("matches the personas of the brief", () => {
    const db = getDb();
    const marina = db.chamados.filter((t) => t.responsavel_id === MARINA_ID);
    expect(marina).toHaveLength(42);
    const queue = db.chamados.filter(
      (t) => !t.responsavel_id && t.grupo_id === person(MARINA_ID).grupo_id,
    );
    expect(queue).toHaveLength(35);
    expect(
      db.chamados.filter((t) => t.solicitante_id === HELENA_ID),
    ).toHaveLength(4);
  });
});

describe("assumeTicket", () => {
  it("takes a ticket from the queue of the consultant's own group", () => {
    const queued = find(
      (t) => !t.responsavel_id && t.grupo_id === person(MARINA_ID).grupo_id,
    );
    const events = assumeTicket(queued.id, MARINA_ID);
    expect(events.map((e) => e.tipo)).toEqual([
      EventType.TicketAssigned,
      EventType.StatusChanged,
    ]);
    expect(queued.responsavel_id).toBe(MARINA_ID);
    expect(queued.status).toBe(Status.InProgress);
  });

  it("refuses a ticket someone else already took", () => {
    const queued = find(
      (t) => !t.responsavel_id && t.grupo_id === person(MARINA_ID).grupo_id,
    );
    const colleague = getDb().usuarios.find(
      (u) =>
        u.perfil === Profile.Consultant &&
        u.id !== MARINA_ID &&
        u.grupo_id === queued.grupo_id,
    )!;
    assumeTicket(queued.id, colleague.id);
    expect(() => assumeTicket(queued.id, MARINA_ID)).toThrow(ApiError);
    expect(queued.responsavel_id).toBe(colleague.id);
  });

  it("refuses a ticket from another group", () => {
    const other = find(
      (t) => !t.responsavel_id && t.grupo_id !== person(MARINA_ID).grupo_id,
    );
    expect(() => assumeTicket(other.id, MARINA_ID)).toThrow(ApiError);
  });
});

describe("changeStatus", () => {
  const marinas = () =>
    find(
      (t) => t.responsavel_id === MARINA_ID && t.status === Status.InProgress,
    );

  it("requires a reason and an allowed transition", () => {
    const ticket = marinas();
    const base = { ticketId: ticket.id, userId: MARINA_ID };
    expect(() =>
      changeStatus({ ...base, to: Status.Resolved, reason: " " }),
    ).toThrow(ApiError);
    expect(() =>
      changeStatus({ ...base, to: Status.Open, reason: "x" }),
    ).toThrow(ApiError);
  });

  it("lets only the assignee (or a manager) change the status", () => {
    const ticket = marinas();
    const colleague = getDb().usuarios.find(
      (u) => u.perfil === Profile.Consultant && u.id !== MARINA_ID,
    )!;
    const attempt = (userId: string) =>
      changeStatus({
        ticketId: ticket.id,
        to: Status.Resolved,
        reason: "ok",
        userId,
      });
    expect(() => attempt(colleague.id)).toThrow(ApiError);
    expect(() => attempt(HELENA_ID)).toThrow(ApiError);
    expect(() => attempt(RICARDO_ID)).not.toThrow();
  });

  it("marks reopened tickets in the reason and keeps the status as the truth", () => {
    const ticket = marinas();
    const base = { ticketId: ticket.id, userId: MARINA_ID };
    changeStatus({ ...base, to: Status.Resolved, reason: "Resolvido" });
    changeStatus({ ...base, to: Status.InProgress, reason: "Voltou" });
    expect(ticket.status).toBe(Status.InProgress);
    expect(getDb().historico.at(-1)?.motivo).toBe("Reaberto: Voltou");
  });
});

describe("addMessage", () => {
  const marinas = () =>
    find(
      (t) => t.responsavel_id === MARINA_ID && t.status === Status.InProgress,
    );

  it("refuses an empty message", () => {
    expect(() =>
      addMessage({
        ticketId: marinas().id,
        authorId: MARINA_ID,
        text: "  ",
        internal: false,
      }),
    ).toThrow(ApiError);
  });

  it("gives customers only their own tickets and never internal notes", () => {
    const ticket = marinas();
    expect(() =>
      addMessage({
        ticketId: ticket.id,
        authorId: ticket.solicitante_id,
        text: "oi",
        internal: true,
      }),
    ).toThrow(ApiError);
    const stranger = getDb().usuarios.find(
      (u) => u.perfil === Profile.Customer && u.id !== ticket.solicitante_id,
    )!;
    expect(() =>
      addMessage({
        ticketId: ticket.id,
        authorId: stranger.id,
        text: "oi",
        internal: false,
      }),
    ).toThrow(ApiError);
  });

  it("lets a colleague leave an internal note but not answer the customer", () => {
    const ticket = marinas();
    const colleague = getDb().usuarios.find(
      (u) =>
        u.perfil === Profile.Consultant &&
        u.id !== MARINA_ID &&
        u.grupo_id === ticket.grupo_id,
    )!;
    const post = (internal: boolean) =>
      addMessage({
        ticketId: ticket.id,
        authorId: colleague.id,
        text: "nota",
        internal,
      });
    expect(() => post(true)).not.toThrow();
    expect(() => post(false)).toThrow(ApiError);
  });

  it("registers the first response on the first public staff reply", () => {
    const ticket = find(
      (t) => t.status === Status.InProgress && t.primeira_resposta_em === null,
    );
    addMessage({
      ticketId: ticket.id,
      authorId: ticket.responsavel_id!,
      text: "Olá!",
      internal: true,
    });
    expect(ticket.primeira_resposta_em).toBeNull();
    addMessage({
      ticketId: ticket.id,
      authorId: ticket.responsavel_id!,
      text: "Olá!",
      internal: false,
    });
    expect(ticket.primeira_resposta_em).not.toBeNull();
  });

  it("resumes a ticket that was waiting when the customer answers", () => {
    const ticket = find((t) => t.status === Status.WaitingCustomer);
    const deadlineBefore = ticket.prazo_resolucao;
    const events = addMessage({
      ticketId: ticket.id,
      authorId: ticket.solicitante_id,
      text: "Segue o que pediram.",
      internal: false,
    });
    expect(events.map((e) => e.tipo)).toEqual([
      EventType.MessageAdded,
      EventType.StatusChanged,
    ]);
    expect(ticket.status).toBe(Status.InProgress);
    expect(ticket.sla_pausado).toBe(false);
    expect(Date.parse(ticket.prazo_resolucao)).toBeGreaterThan(
      Date.parse(deadlineBefore),
    );
  });
});

describe("openTicket", () => {
  it("derives the group and the deadlines from the category and priority", () => {
    const category = getDb().categorias[0];
    const [event] = openTicket({
      requesterId: HELENA_ID,
      categoryId: category.id,
      priority: Priority.Critical,
      title: "Sem acesso",
      description: "Não consigo entrar.",
    });
    if (event.tipo !== EventType.TicketOpened)
      throw new Error("unexpected event");
    const created = ticketOf(event.payload.id);
    expect(created.grupo_id).toBe(category.grupo_id);
    expect(created.status).toBe(Status.Open);

    const opened = Date.parse(created.aberto_em);
    expect(Date.parse(created.prazo_primeira_resposta) - opened).toBe(
      3_600_000,
    );
    expect(Date.parse(created.prazo_resolucao) - opened).toBe(4 * 3_600_000);
  });

  it("is reserved for customers", () => {
    expect(() =>
      openTicket({
        requesterId: MARINA_ID,
        categoryId: getDb().categorias[0].id,
        priority: Priority.Low,
        title: "x",
        description: "y",
      }),
    ).toThrow(ApiError);
  });
});

describe("reopening and the SLA", () => {
  const HOUR = 3_600_000;
  const hoursFor = (priority: string) =>
    getDb().sla.find((s) => s.prioridade === priority)!;

  it("renews the SLA when a closed ticket is reopened", () => {
    const ticket = find((t) => t.status === Status.Closed);
    const policy = hoursFor(ticket.prioridade);
    changeStatus({
      ticketId: ticket.id,
      to: Status.InProgress,
      reason: "O problema voltou",
      userId: RICARDO_ID,
    });
    const reopenedAt = Date.parse(getDb().historico.at(-1)!.ocorrido_em);
    expect(Date.parse(ticket.prazo_resolucao)).toBe(
      reopenedAt + policy.resolucao_horas * HOUR,
    );
    expect(Date.parse(ticket.prazo_primeira_resposta)).toBe(
      reopenedAt + policy.primeira_resposta_horas * HOUR,
    );
    expect(ticket.primeira_resposta_em).toBeNull();
  });

  it("keeps the SLA when a resolved ticket is reopened", () => {
    const ticket = find((t) => t.status === Status.Resolved);
    const before = {
      resolution: ticket.prazo_resolucao,
      firstResponse: ticket.prazo_primeira_resposta,
      answeredAt: ticket.primeira_resposta_em,
    };
    changeStatus({
      ticketId: ticket.id,
      to: Status.InProgress,
      reason: "O cliente nao confirmou",
      userId: RICARDO_ID,
    });
    expect(ticket.status).toBe(Status.InProgress);
    expect(ticket.prazo_resolucao).toBe(before.resolution);
    expect(ticket.prazo_primeira_resposta).toBe(before.firstResponse);
    expect(ticket.primeira_resposta_em).toBe(before.answeredAt);
  });

  it("renews, when loading, the ticket that was reopened in the data", () => {
    const original = rawData.chamados.find((t) => t.numero === 10611)!;
    const loaded = find((t) => t.numero === 10611);
    const reopenedAt = Date.parse(
      getDb()
        .historico.filter(
          (h) =>
            h.chamado_id === loaded.id &&
            h.de === Status.Closed &&
            h.para === Status.InProgress,
        )
        .at(-1)!.ocorrido_em,
    );
    const policy = hoursFor(loaded.prioridade);

    expect(Date.parse(original.prazo_resolucao)).toBeLessThan(reopenedAt);
    expect(Date.parse(loaded.prazo_resolucao)).toBe(
      reopenedAt + policy.resolucao_horas * HOUR,
    );
    expect(loaded.primeira_resposta_em).toBeNull();
  });

  it("does not change tickets that were never reopened from closed", () => {
    const untouched = rawData.chamados.filter((t) => t.numero !== 10611);
    for (const original of untouched) {
      const loaded = getDb().chamados.find((t) => t.id === original.id)!;
      expect(loaded.prazo_resolucao).toBe(original.prazo_resolucao);
      expect(loaded.prazo_primeira_resposta).toBe(
        original.prazo_primeira_resposta,
      );
    }
  });
});
