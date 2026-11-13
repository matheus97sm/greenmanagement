import { describe, expect, it } from "vitest";
import { HistoryType, Priority, Profile, Status } from "@/domain/enums";
import type { HistoryEntry, Message, Person, Ticket } from "@/domain/types";
import { TimelineKind } from "./enums";
import {
  availableActions,
  buildTimeline,
  footerHint,
  isClosedStatus,
  lastItems,
  personName,
} from "./utils";

const at = (minutes: number) =>
  new Date(
    Date.parse("2026-11-03T10:00:00.000Z") + minutes * 60_000,
  ).toISOString();

const ticket: Ticket = {
  id: "t1",
  numero: 1,
  titulo: "VPN",
  descricao: "A VPN nao liga.",
  categoria_id: "c",
  grupo_id: "g",
  prioridade: Priority.Medium,
  status: Status.InProgress,
  solicitante_id: "customer",
  responsavel_id: "consultant",
  aberto_em: at(0),
  atualizado_em: at(0),
  primeira_resposta_em: null,
  prazo_primeira_resposta: at(480),
  prazo_resolucao: at(1440),
  sla_pausado: false,
  resolvido_em: null,
  fechado_em: null,
};

const person = (id: string, nome: string, perfil: Profile): Person => ({
  id,
  nome,
  email: `${id}@x`,
  perfil,
  locale: "pt-BR",
  zoneinfo: "America/Sao_Paulo",
});

const people: Record<string, Person> = {
  customer: person("customer", "Helena", Profile.Customer),
  consultant: person("consultant", "Marina", Profile.Consultant),
  other: person("other", "Rafael", Profile.Consultant),
};

const message = (
  id: string,
  minutes: number,
  overrides: Partial<Message> = {},
): Message => ({
  id,
  chamado_id: "t1",
  criada_em: at(minutes),
  autor_id: "consultant",
  texto: `texto ${id}`,
  interna: false,
  ...overrides,
});

const entry = (
  id: string,
  minutes: number,
  overrides: Partial<HistoryEntry>,
): HistoryEntry => ({
  id,
  chamado_id: "t1",
  tipo: HistoryType.Status,
  de: Status.Open,
  para: Status.InProgress,
  usuario_id: "consultant",
  motivo: "Assumido para atendimento",
  ocorrido_em: at(minutes),
  ...overrides,
});

describe("personName", () => {
  it("returns the name of a known person", () => {
    expect(personName(people, "consultant")).toBe("Marina");
  });

  it("falls back for an unknown or missing person", () => {
    expect(personName(people, "ghost")).toBe("Desconhecido");
    expect(personName(people, null)).toBe("Desconhecido");
  });
});

describe("isClosedStatus", () => {
  it("is true only for resolved and closed", () => {
    expect(isClosedStatus(Status.Resolved)).toBe(true);
    expect(isClosedStatus(Status.Closed)).toBe(true);
    expect(isClosedStatus(Status.Open)).toBe(false);
    expect(isClosedStatus(Status.InProgress)).toBe(false);
    expect(isClosedStatus(Status.WaitingCustomer)).toBe(false);
  });
});

describe("buildTimeline", () => {
  it("starts with the description, written by the requester", () => {
    const [first] = buildTimeline({
      ticket,
      messages: [],
      history: [],
      people,
    });
    expect(first).toMatchObject({
      kind: TimelineKind.Message,
      author: "customer",
      text: "A VPN nao liga.",
      internal: false,
    });
  });

  it("merges messages and status changes in chronological order", () => {
    const items = buildTimeline({
      ticket,
      messages: [
        message("m2", 30),
        message("m1", 10, { autor_id: "customer" }),
      ],
      history: [
        entry("h1", 20, {
          de: Status.InProgress,
          para: Status.WaitingCustomer,
          motivo: "Aguardando prints",
        }),
      ],
      people,
    });
    expect(items.map((i) => i.key)).toEqual(["description", "m1", "h1", "m2"]);
  });

  it("describes a status change with who, from, to and the reason", () => {
    const items = buildTimeline({
      ticket,
      messages: [],
      history: [
        entry("h1", 20, {
          de: Status.InProgress,
          para: Status.Resolved,
          motivo: "Correcao aplicada",
        }),
      ],
      people,
    });
    const event = items.find((i) => i.key === "h1");
    expect(event).toMatchObject({ kind: TimelineKind.Event });
    expect(event?.text).toBe(
      "Marina alterou o status de Em atendimento para Resolvido. Motivo: Correcao aplicada",
    );
  });

  it("hides the assignment row when it is just taking the ticket from the queue", () => {
    const items = buildTimeline({
      ticket,
      messages: [],
      history: [
        entry("assign", 5, {
          tipo: HistoryType.Assignment,
          de: null,
          para: null,
          motivo: null,
        }),
        entry("take", 5, {}),
      ],
      people,
    });
    expect(items.map((i) => i.key)).toEqual(["description", "take"]);
  });

  it("shows the assignment row when someone else was given the ticket", () => {
    const items = buildTimeline({
      ticket,
      messages: [],
      history: [
        entry("assign", 50, {
          tipo: HistoryType.Assignment,
          de: null,
          para: null,
          motivo: null,
          usuario_id: "other",
        }),
      ],
      people,
    });
    expect(items.find((i) => i.key === "assign")?.text).toBe(
      "Rafael assumiu o chamado.",
    );
  });

  it("ignores status entries that miss the from or to status", () => {
    const items = buildTimeline({
      ticket,
      messages: [],
      history: [entry("broken", 5, { de: null })],
      people,
    });
    expect(items.map((i) => i.key)).toEqual(["description"]);
  });

  it("keeps internal notes flagged so the screen can style them", () => {
    const items = buildTimeline({
      ticket,
      messages: [message("note", 10, { interna: true })],
      history: [],
      people,
    });
    expect(items.find((i) => i.key === "note")).toMatchObject({
      internal: true,
    });
  });

  it("copes with missing messages and history", () => {
    expect(
      buildTimeline({
        ticket,
        messages: undefined,
        history: undefined,
        people,
      }),
    ).toHaveLength(1);
  });
});

describe("lastItems", () => {
  const items = buildTimeline({
    ticket,
    messages: Array.from({ length: 10 }, (_, i) => message(`m${i}`, i + 1)),
    history: [],
    people,
  });

  it("returns everything when it fits", () => {
    const result = lastItems(items, 100);
    expect(result.hidden).toBe(0);
    expect(result.visible).toBe(items);
  });

  it("keeps only the most recent items and counts the hidden ones", () => {
    const result = lastItems(items, 4);
    expect(result.hidden).toBe(items.length - 4);
    expect(result.visible).toHaveLength(4);
    expect(result.visible.at(-1)).toBe(items.at(-1));
  });
});

describe("availableActions", () => {
  it("lets a running ticket advance but not be reopened", () => {
    expect(availableActions(Status.InProgress)).toEqual({
      canAdvance: true,
      canReopen: false,
    });
    expect(availableActions(Status.WaitingCustomer)).toEqual({
      canAdvance: true,
      canReopen: false,
    });
    expect(availableActions(Status.Open)).toEqual({
      canAdvance: true,
      canReopen: false,
    });
  });

  it("lets a resolved ticket be closed or reopened", () => {
    expect(availableActions(Status.Resolved)).toEqual({
      canAdvance: true,
      canReopen: true,
    });
  });

  it("only lets a closed ticket be reopened", () => {
    expect(availableActions(Status.Closed)).toEqual({
      canAdvance: false,
      canReopen: true,
    });
  });
});

describe("footerHint", () => {
  const nameOf = (id: string | null) => personName(people, id);
  const hint = (
    overrides: Partial<Ticket>,
    flags: { isMine?: boolean; isClosed?: boolean; canTake?: boolean },
  ) =>
    footerHint({
      ticket: { ...ticket, ...overrides },
      isMine: flags.isMine ?? false,
      isClosed: flags.isClosed ?? false,
      canTake: flags.canTake ?? false,
      nameOf,
    });

  it("invites to take an unassigned ticket of the own group", () => {
    expect(hint({ responsavel_id: null }, { canTake: true })).toBe(
      "Pegue o chamado para responder.",
    );
  });

  it("explains an unassigned ticket the viewer cannot take", () => {
    expect(hint({ responsavel_id: null }, {})).toBe(
      "Este chamado ainda não tem responsável.",
    );
  });

  it("asks to reopen the viewer's own closed ticket", () => {
    expect(hint({}, { isMine: true, isClosed: true })).toBe(
      "Chamado encerrado. Reabra para voltar a responder.",
    );
  });

  it("names who handled a closed ticket of someone else", () => {
    expect(hint({}, { isClosed: true })).toBe(
      "Chamado encerrado (atendido por Marina).",
    );
  });

  it("names who is handling an active ticket of someone else", () => {
    expect(hint({}, {})).toBe("Atendido por Marina.");
  });
});
