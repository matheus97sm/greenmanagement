import { beforeEach, describe, expect, it } from "vitest";
import { getDb, initDb } from "./db";
import {
  addMessage,
  ApiError,
  assumeTicket,
  changeStatus,
  openTicket,
  reassignTicket,
} from "./ops";
import { HELENA_ID, MARINA_ID, rawData, RICARDO_ID } from "@/test-data";
import { Status, Priority, Profile, EventType } from "@/domain/enums";

const person = (id: string) =>
  getDb().usuarios.find((currentPerson) => currentPerson.id === id)!;
const ticketOf = (id: string) =>
  getDb().chamados.find((ticket) => ticket.id === id)!;

const find = (predicate: Parameters<typeof rawData.chamados.find>[0]) =>
  getDb().chamados.find(predicate)!;

beforeEach(() => {
  initDb(rawData);
});

describe("the real data set", () => {
  it("matches the personas of the brief", () => {
    const database = getDb();
    const marina = database.chamados.filter(
      (ticket) => ticket.responsavel_id === MARINA_ID,
    );
    expect(marina).toHaveLength(42);
    const queue = database.chamados.filter(
      (ticket) =>
        !ticket.responsavel_id &&
        ticket.grupo_id === person(MARINA_ID).grupo_id,
    );
    expect(queue).toHaveLength(35);
    expect(
      database.chamados.filter((ticket) => ticket.solicitante_id === HELENA_ID),
    ).toHaveLength(4);
  });
});

describe("assumeTicket", () => {
  it("takes a ticket from the queue of the consultant's own group", () => {
    const queued = find(
      (ticket) =>
        !ticket.responsavel_id &&
        ticket.grupo_id === person(MARINA_ID).grupo_id,
    );
    const events = assumeTicket(queued.id, MARINA_ID);
    expect(events.map((domainEvent) => domainEvent.tipo)).toEqual([
      EventType.TicketAssigned,
      EventType.StatusChanged,
    ]);
    expect(queued.responsavel_id).toBe(MARINA_ID);
    expect(queued.status).toBe(Status.InProgress);
  });

  it("refuses a ticket someone else already took", () => {
    const queued = find(
      (ticket) =>
        !ticket.responsavel_id &&
        ticket.grupo_id === person(MARINA_ID).grupo_id,
    );
    const colleague = getDb().usuarios.find(
      (currentPerson) =>
        currentPerson.perfil === Profile.Consultant &&
        currentPerson.id !== MARINA_ID &&
        currentPerson.grupo_id === queued.grupo_id,
    )!;
    assumeTicket(queued.id, colleague.id);
    expect(() => assumeTicket(queued.id, MARINA_ID)).toThrow(ApiError);
    expect(queued.responsavel_id).toBe(colleague.id);
  });

  it("refuses a ticket from another group", () => {
    const other = find(
      (ticket) =>
        !ticket.responsavel_id &&
        ticket.grupo_id !== person(MARINA_ID).grupo_id,
    );
    expect(() => assumeTicket(other.id, MARINA_ID)).toThrow(ApiError);
  });
});

describe("reassignTicket", () => {
  const colleagueOf = (groupId: string, except: string | null) =>
    getDb().usuarios.find(
      (currentPerson) =>
        currentPerson.perfil === Profile.Consultant &&
        currentPerson.grupo_id === groupId &&
        currentPerson.id !== except,
    )!;

  const marinas = () =>
    find(
      (ticket) =>
        ticket.responsavel_id === MARINA_ID &&
        ticket.status === Status.InProgress,
    );

  it("moves a ticket to another consultant of the same group", () => {
    const ticket = marinas();
    const target = colleagueOf(ticket.grupo_id, MARINA_ID);
    const events = reassignTicket({
      ticketId: ticket.id,
      consultantId: target.id,
      managerId: RICARDO_ID,
    });
    expect(events.map((domainEvent) => domainEvent.tipo)).toEqual([
      EventType.TicketAssigned,
    ]);
    expect(ticket.responsavel_id).toBe(target.id);
    expect(ticket.status).toBe(Status.InProgress);
    expect(getDb().historico.at(-1)).toMatchObject({
      chamado_id: ticket.id,
      usuario_id: target.id,
    });
  });

  it("hands out a ticket nobody has taken, leaving its status alone", () => {
    const queued = find((ticket) => !ticket.responsavel_id);
    const target = colleagueOf(queued.grupo_id, null);
    const status = queued.status;
    reassignTicket({
      ticketId: queued.id,
      consultantId: target.id,
      managerId: RICARDO_ID,
    });
    expect(queued.responsavel_id).toBe(target.id);
    expect(queued.status).toBe(status);
  });

  it("does nothing when the ticket already belongs to that consultant", () => {
    const ticket = marinas();
    expect(
      reassignTicket({
        ticketId: ticket.id,
        consultantId: MARINA_ID,
        managerId: RICARDO_ID,
      }),
    ).toEqual([]);
  });

  it("refuses anyone who is not a manager", () => {
    const ticket = marinas();
    const target = colleagueOf(ticket.grupo_id, MARINA_ID);
    for (const managerId of [MARINA_ID, HELENA_ID]) {
      expect(() =>
        reassignTicket({
          ticketId: ticket.id,
          consultantId: target.id,
          managerId,
        }),
      ).toThrow(ApiError);
    }
    expect(ticket.responsavel_id).toBe(MARINA_ID);
  });

  it("refuses a consultant from another group", () => {
    const ticket = marinas();
    const outsider = getDb().usuarios.find(
      (currentPerson) =>
        currentPerson.perfil === Profile.Consultant &&
        currentPerson.grupo_id !== ticket.grupo_id,
    )!;
    expect(() =>
      reassignTicket({
        ticketId: ticket.id,
        consultantId: outsider.id,
        managerId: RICARDO_ID,
      }),
    ).toThrow(ApiError);
  });

  it("refuses someone who is not a consultant", () => {
    const ticket = marinas();
    expect(() =>
      reassignTicket({
        ticketId: ticket.id,
        consultantId: HELENA_ID,
        managerId: RICARDO_ID,
      }),
    ).toThrow(ApiError);
  });

  it("refuses tickets that are resolved or closed", () => {
    const done = find(
      (ticket) => ticket.status === Status.Closed && !!ticket.responsavel_id,
    );
    const target = colleagueOf(done.grupo_id, done.responsavel_id);
    expect(() =>
      reassignTicket({
        ticketId: done.id,
        consultantId: target.id,
        managerId: RICARDO_ID,
      }),
    ).toThrow(ApiError);
  });
});

describe("changeStatus", () => {
  const marinas = () =>
    find(
      (ticket) =>
        ticket.responsavel_id === MARINA_ID &&
        ticket.status === Status.InProgress,
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
      (currentPerson) =>
        currentPerson.perfil === Profile.Consultant &&
        currentPerson.id !== MARINA_ID,
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
      (ticket) =>
        ticket.responsavel_id === MARINA_ID &&
        ticket.status === Status.InProgress,
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
      (currentPerson) =>
        currentPerson.perfil === Profile.Customer &&
        currentPerson.id !== ticket.solicitante_id,
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
      (currentPerson) =>
        currentPerson.perfil === Profile.Consultant &&
        currentPerson.id !== MARINA_ID &&
        currentPerson.grupo_id === ticket.grupo_id,
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
      (currentTicket) =>
        currentTicket.status === Status.InProgress &&
        currentTicket.primeira_resposta_em === null,
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
    const ticket = find(
      (currentTicket) => currentTicket.status === Status.WaitingCustomer,
    );
    const deadlineBefore = ticket.prazo_resolucao;
    const events = addMessage({
      ticketId: ticket.id,
      authorId: ticket.solicitante_id,
      text: "Segue o que pediram.",
      internal: false,
    });
    expect(events.map((domainEvent) => domainEvent.tipo)).toEqual([
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
    getDb().sla.find((slaPolicy) => slaPolicy.prioridade === priority)!;

  it("renews the SLA when a closed ticket is reopened", () => {
    const ticket = find(
      (currentTicket) => currentTicket.status === Status.Closed,
    );
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
    const ticket = find(
      (currentTicket) => currentTicket.status === Status.Resolved,
    );
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
    const original = rawData.chamados.find(
      (ticket) => ticket.numero === 10611,
    )!;
    const loaded = find((ticket) => ticket.numero === 10611);
    const reopenedAt = Date.parse(
      getDb()
        .historico.filter(
          (historyEntry) =>
            historyEntry.chamado_id === loaded.id &&
            historyEntry.de === Status.Closed &&
            historyEntry.para === Status.InProgress,
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
    const untouched = rawData.chamados.filter(
      (ticket) => ticket.numero !== 10611,
    );
    for (const original of untouched) {
      const loaded = getDb().chamados.find(
        (ticket) => ticket.id === original.id,
      )!;
      expect(loaded.prazo_resolucao).toBe(original.prazo_resolucao);
      expect(loaded.prazo_primeira_resposta).toBe(
        original.prazo_primeira_resposta,
      );
    }
  });
});
