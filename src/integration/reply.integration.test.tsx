import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventType } from "@/domain/enums";
import type { DomainEvent } from "@/domain/types";
import { addMessage } from "@/server/ops";
import { getDb } from "@/server/db";
import { ticketsStore } from "@/store/ticketsStore";
import { MARINA_ID, rawData } from "@/test-data";
import {
  LOAD_TIMEOUT,
  recordDeliveries,
  renderApp,
  resetWorld,
  SETTLE_MS,
  sleep,
} from "./helpers";
import type { Delivery } from "./helpers";

vi.mock("@/server/simulator", () => ({ startSimulator: () => () => {} }));

vi.mock("@/server/socket", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/server/socket")>();
  return {
    ...original,
    publish: (event: DomainEvent) => {
      original.publish(event);
      original.publish(event);
    },
  };
});

const ticket = rawData.chamados.find(
  (currentTicket) => currentTicket.numero === 10503,
)!;

async function openTheMostUrgentTicket() {
  const user = userEvent.setup();
  const view = renderApp({ route: "/consultant/tickets", userId: MARINA_ID });
  await screen.findByText("Meus (42)", {}, { timeout: LOAD_TIMEOUT });
  await user.click(view.container.querySelector(".ticket-row")!);
  await screen.findByRole("heading", { name: /#10503 ·/ });
  return { user, ...view };
}

const composer = () =>
  screen.getByPlaceholderText(/Responder ao cliente|Nota interna: o cliente/);

function messageDeliveries(log: Delivery[], text: string) {
  return log.filter(
    (delivery) =>
      delivery.event.tipo === EventType.MessageAdded &&
      delivery.event.payload.texto === text,
  );
}

describe("replying to a ticket", () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it("shows a public reply once, even though the socket delivers it twice", async () => {
    const log = recordDeliveries();
    const { user } = await openTheMostUrgentTicket();
    const text = "Integração: já estamos analisando o seu chamado";

    expect(screen.getByText(/1ª resposta até/)).toBeInTheDocument();
    await user.type(composer(), text);
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(
      () =>
        expect(messageDeliveries(log, text).length).toBeGreaterThanOrEqual(3),
      { timeout: LOAD_TIMEOUT },
    );
    await sleep(SETTLE_MS);

    const deliveries = messageDeliveries(log, text);
    expect(deliveries.length).toBeGreaterThanOrEqual(3);
    expect(deliveries[0].applied).toBe(true);
    expect(deliveries.slice(1).every((delivery) => !delivery.applied)).toBe(
      true,
    );

    expect(screen.getAllByText(text)).toHaveLength(1);
    expect(composer()).toHaveValue("");
    expect(
      getDb().mensagens.filter((message) => message.texto === text),
    ).toHaveLength(1);
  });

  it("counts the public reply as the first response and stops that clock", async () => {
    const { user } = await openTheMostUrgentTicket();
    expect(
      ticketsStore.getState().tickets[ticket.id].primeira_resposta_em,
    ).toBeNull();

    await user.type(composer(), "Integração: primeira resposta");
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(
      () =>
        expect(
          ticketsStore.getState().tickets[ticket.id].primeira_resposta_em,
        ).not.toBeNull(),
      { timeout: LOAD_TIMEOUT },
    );
    expect(screen.queryByText(/1ª resposta até/)).not.toBeInTheDocument();
    expect(
      getDb().chamados.find((currentTicket) => currentTicket.id === ticket.id)!
        .primeira_resposta_em,
    ).not.toBeNull();
  });

  it("keeps an internal note out of the first response", async () => {
    const log = recordDeliveries();
    const { user } = await openTheMostUrgentTicket();
    const text = "Integração: nota só para a equipe";

    await user.click(screen.getByRole("switch", { name: "Nota interna" }));
    await user.type(composer(), text);
    await user.click(screen.getByRole("button", { name: "Salvar nota" }));

    await waitFor(
      () =>
        expect(messageDeliveries(log, text).length).toBeGreaterThanOrEqual(3),
      { timeout: LOAD_TIMEOUT },
    );
    await sleep(SETTLE_MS);
    expect(screen.getAllByText(text)).toHaveLength(1);
    expect(
      getDb().mensagens.find((message) => message.texto === text)?.interna,
    ).toBe(true);
    expect(
      ticketsStore.getState().tickets[ticket.id].primeira_resposta_em,
    ).toBeNull();
    expect(screen.getByText(/1ª resposta até/)).toBeInTheDocument();
  });

  it("keeps what she is typing when the customer writes in the same ticket", async () => {
    const { user, container } = await openTheMostUrgentTicket();
    const draft = "Integração: ainda estou escrevendo";
    await user.type(composer(), draft);

    const customerText = "Integração: o cliente voltou a escrever";
    addMessage({
      ticketId: ticket.id,
      authorId: ticket.solicitante_id,
      text: customerText,
      internal: false,
    });

    expect(
      await screen.findByText(customerText, {}, { timeout: LOAD_TIMEOUT }),
    ).toBeInTheDocument();
    expect(composer()).toHaveValue(draft);

    const firstRow = container.querySelector<HTMLElement>(".ticket-row")!;
    await waitFor(() =>
      expect(within(firstRow).queryByText("1")).not.toBeInTheDocument(),
    );
  });
});
