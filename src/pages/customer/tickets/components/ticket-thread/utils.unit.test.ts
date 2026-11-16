import { describe, expect, it } from "vitest";
import { Profile } from "@/domain/enums";
import type { Message, Person, Ticket } from "@/domain/types";
import { HELENA_ID, rawData } from "@/test-data";
import { threadItems } from "./utils";

const people: Record<string, Person> = Object.fromEntries(
  rawData.usuarios.map((person) => [person.id, person]),
);
const byNumber = (numero: number) =>
  rawData.chamados.find((ticket) => ticket.numero === numero) as Ticket;
const messagesOf = (ticket: Ticket): Message[] =>
  rawData.mensagens.filter((message) => message.chamado_id === ticket.id);

const items = (
  numero: number,
  since: string,
  extra: Partial<Message>[] = [],
) => {
  const ticket = byNumber(numero);
  return threadItems({
    ticket,
    messages: [
      ...messagesOf(ticket),
      ...extra.map((message, index) => ({
        id: `extra-${index}`,
        chamado_id: ticket.id,
        criada_em: "2026-11-03T10:00:00Z",
        autor_id: HELENA_ID,
        texto: "extra",
        interna: false,
        ...message,
      })),
    ],
    people,
    meId: HELENA_ID,
    since,
  });
};

describe("threadItems", () => {
  it("starts with what the customer wrote when she opened the ticket", () => {
    const [first] = items(10611, "2026-12-01T00:00:00Z");
    expect(first).toMatchObject({
      key: "description",
      text: byNumber(10611).descricao,
      author: "Helena Fernandes",
      isOwn: true,
      role: Profile.Customer,
    });
  });

  it("has the description and then every message, oldest first", () => {
    const list = items(10611, "2026-12-01T00:00:00Z");
    expect(list).toHaveLength(1 + messagesOf(byNumber(10611)).length);
    expect(list.map((threadItem) => threadItem.at)).toEqual(
      [...list.map((threadItem) => threadItem.at)].sort(),
    );
  });

  it("knows which messages are hers and who wrote the others", () => {
    const list = items(10611, "2026-12-01T00:00:00Z");
    const marina = list.find(
      (threadItem) => threadItem.author === "Marina Almeida",
    )!;
    expect(marina.isOwn).toBe(false);
    expect(marina.role).toBe(Profile.Consultant);
    expect(list.at(-1)?.isOwn).toBe(true);
  });

  it("flags as new the team messages that came after the last visit", () => {
    const list = items(10611, "2026-10-20T00:00:00Z");
    const fresh = list
      .filter((threadItem) => threadItem.isNew)
      .map((threadItem) => threadItem.at);
    expect(fresh).toEqual(["2026-10-20T14:42:09Z", "2026-10-21T17:22:09Z"]);
  });

  it("does not flag what she wrote herself", () => {
    const list = items(10611, "2026-01-01T00:00:00Z");
    expect(
      list
        .filter((threadItem) => threadItem.isOwn)
        .every((threadItem) => !threadItem.isNew),
    ).toBe(true);
  });

  it("flags nothing when she has seen everything", () => {
    expect(
      items(10611, "2026-12-01T00:00:00Z").some((item) => item.isNew),
    ).toBe(false);
  });

  it("flags a message that arrived exactly when she was last here as seen", () => {
    const list = items(10611, "2026-10-20T14:42:09Z");
    expect(
      list.find((threadItem) => threadItem.at === "2026-10-20T14:42:09Z")
        ?.isNew,
    ).toBe(false);
  });

  it("names an unknown author as the team instead of leaving it blank", () => {
    const list = items(10611, "2026-12-01T00:00:00Z", [
      { autor_id: "nobody", criada_em: "2026-11-03T11:00:00Z" },
    ]);
    expect(list.at(-1)).toMatchObject({ author: "Equipe", role: undefined });
  });

  it("copes with a ticket that has no messages", () => {
    const list = threadItems({
      ticket: byNumber(10614),
      messages: undefined,
      people,
      meId: HELENA_ID,
      since: "2026-01-01T00:00:00Z",
    });
    expect(list.map((threadItem) => threadItem.key)).toEqual(["description"]);
  });
});
