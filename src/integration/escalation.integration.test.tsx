import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Status } from "@/domain/enums";
import { getDb } from "@/server/db";
import { ticketsStore } from "@/store/ticketsStore";
import { RICARDO_ID, rawData } from "@/test-data";
import { LOAD_TIMEOUT, renderApp, resetWorld } from "./helpers";

vi.mock("@/server/simulator", () => ({ startSimulator: () => () => {} }));

const ticket = rawData.chamados.find((t) => t.numero === 10503)!;
const personNamed = (nome: string) =>
  getDb().usuarios.find((u) => u.nome === nome)!;

async function openEscalation() {
  const user = userEvent.setup();
  const view = renderApp({
    route: `/manager/tickets/${ticket.id}`,
    userId: RICARDO_ID,
  });
  await screen.findByRole(
    "heading",
    { name: /#10503 · / },
    { timeout: LOAD_TIMEOUT },
  );
  return { user, ...view };
}

const composer = () => screen.getByPlaceholderText(/Responder ao cliente/);

describe("a ticket escalated to the manager", () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it("opens the conversation straight from a shared link", async () => {
    await openEscalation();
    expect(screen.getByText(ticket.descricao)).toBeInTheDocument();
    expect(screen.getByText("Conversa do chamado")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Pegar chamado" }),
    ).not.toBeInTheDocument();
  });

  it("opens from the list and goes back to the team view when closed", async () => {
    const user = userEvent.setup();
    const { router } = renderApp({
      route: "/manager/tickets",
      userId: RICARDO_ID,
    });
    await user.click(
      await screen.findByRole(
        "button",
        { name: "Abrir conversa do chamado 10503" },
        { timeout: LOAD_TIMEOUT },
      ),
    );
    expect(router.state.location.pathname).toBe(
      `/manager/tickets/${ticket.id}`,
    );
    await screen.findByRole("heading", { name: /#10503 · / });

    await user.click(screen.getByRole("button", { name: "Fechar conversa" }));
    expect(router.state.location.pathname).toBe("/manager/tickets");
  });

  it("finds a ticket by number even when it is finished, and opens it", async () => {
    const user = userEvent.setup();
    renderApp({ route: "/manager/tickets", userId: RICARDO_ID });
    const closed = rawData.chamados.find((t) => t.status === Status.Closed)!;

    await user.type(
      await screen.findByLabelText(
        "Buscar chamado",
        {},
        { timeout: LOAD_TIMEOUT },
      ),
      String(closed.numero),
    );
    await user.click(
      await screen.findByRole("button", {
        name: `Abrir conversa do chamado ${closed.numero}`,
      }),
    );
    expect(
      await screen.findByRole("heading", {
        name: new RegExp(`#${closed.numero} · `),
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reabrir" })).toBeInTheDocument();
  });

  it("lets the manager answer the customer, once", async () => {
    const { user } = await openEscalation();
    const text = "Gestor: já estou acompanhando este chamado";

    await user.type(composer(), text);
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(
      () =>
        expect(getDb().mensagens.filter((m) => m.texto === text)).toHaveLength(
          1,
        ),
      { timeout: LOAD_TIMEOUT },
    );
    expect(getDb().mensagens.find((m) => m.texto === text)?.autor_id).toBe(
      RICARDO_ID,
    );
    await waitFor(() => expect(screen.getAllByText(text)).toHaveLength(1));
    expect(composer()).toHaveValue("");
  });

  it("lets the manager leave an internal note for the consultant", async () => {
    const { user } = await openEscalation();
    const text = "Gestor: priorizar, o cliente escalou";

    await user.click(screen.getByRole("switch", { name: "Nota interna" }));
    await user.type(screen.getByPlaceholderText(/Nota interna/), text);
    await user.click(screen.getByRole("button", { name: "Salvar nota" }));

    await waitFor(
      () =>
        expect(getDb().mensagens.find((m) => m.texto === text)).toBeTruthy(),
      { timeout: LOAD_TIMEOUT },
    );
    expect(getDb().mensagens.find((m) => m.texto === text)?.interna).toBe(true);
  });

  it("changes the status with a reason", async () => {
    const { user } = await openEscalation();
    await user.click(screen.getByRole("button", { name: "Alterar status" }));
    await user.type(
      screen.getByLabelText(/Motivo/),
      "Aguardando retorno do cliente",
    );
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    await waitFor(
      () =>
        expect(ticketsStore.getState().tickets[ticket.id].status).toBe(
          Status.WaitingCustomer,
        ),
      { timeout: LOAD_TIMEOUT },
    );
    expect(getDb().chamados.find((t) => t.id === ticket.id)?.status).toBe(
      Status.WaitingCustomer,
    );
  });

  it("hands the ticket to another consultant from the conversation", async () => {
    const { user } = await openEscalation();
    const target = personNamed("Diego Araújo");
    expect(ticketsStore.getState().tickets[ticket.id].responsavel_id).not.toBe(
      target.id,
    );

    await user.click(screen.getByRole("button", { name: "Redistribuir" }));
    await user.click(screen.getAllByLabelText(/Novo responsável/)[0]);
    await user.click(
      await screen.findByRole("option", { name: /^Diego Araújo/ }),
    );
    await user.click(
      screen.getAllByRole("button", { name: "Redistribuir" }).at(-1)!,
    );

    await waitFor(
      () =>
        expect(ticketsStore.getState().tickets[ticket.id].responsavel_id).toBe(
          target.id,
        ),
      { timeout: LOAD_TIMEOUT },
    );
    expect(
      await screen.findByText(/Atendido por Diego Araújo/),
    ).toBeInTheDocument();
  });
});
