import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventType } from "@/domain/enums";
import { ticketsStore } from "@/store/ticketsStore";
import { MARINA_ID, rawData } from "@/test-data";
import { loadStoreAs, renderRoutes } from "@/test-utils";
import { TicketsPage } from ".";

vi.mock("@/store/actions", () => ({
  takeTicket: vi.fn(),
  sendMessage: vi.fn(),
  changeStatus: vi.fn(),
}));

const idOf = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero)!.id;

const routes = [{ path: "/consultant/tickets/:id?", element: <TicketsPage /> }];

function renderPage(route = "/consultant/tickets") {
  return renderRoutes(routes, { userId: MARINA_ID, route });
}

const rowsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ticket-row"));

describe("consultant tickets page", () => {
  describe("while loading", () => {
    it("shows a spinner until the data arrives", () => {
      ticketsStore.reset();
      const { container } = renderPage();
      expect(container.querySelector(".mantine-Loader-root")).toBeTruthy();
      expect(screen.queryByText(/Meus \(/)).not.toBeInTheDocument();
    });

    it("tells the user when the tickets could not be loaded", async () => {
      ticketsStore.reset();
      await ticketsStore.load(() => Promise.reject(new Error("offline")));
      renderPage();
      expect(
        screen.getByText("Não foi possível carregar os chamados."),
      ).toBeInTheDocument();
    });
  });

  describe("once loaded", () => {
    beforeEach(() => {
      loadStoreAs(MARINA_ID);
    });

    it("shows the list and asks to pick a ticket", () => {
      renderPage();
      expect(screen.getByText("Meus (42)")).toBeInTheDocument();
      expect(
        screen.getByText("Selecione um chamado na lista."),
      ).toBeInTheDocument();
    });

    it("opens the ticket named in the address", () => {
      renderPage(`/consultant/tickets/${idOf(10503)}`);
      expect(
        screen.getByRole("heading", { name: /#10503 ·/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("Selecione um chamado na lista."),
      ).not.toBeInTheDocument();
    });

    it("goes to the ticket that was clicked", async () => {
      const user = userEvent.setup();
      const { container, router } = renderPage();
      await user.click(rowsOf(container)[0]);

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(
          `/consultant/tickets/${idOf(10503)}`,
        ),
      );
      expect(
        screen.getByRole("heading", { name: /#10503 ·/ }),
      ).toBeInTheDocument();
    });

    it("keeps each ticket's draft while she moves between tickets", async () => {
      const user = userEvent.setup();
      const { container } = renderPage();
      const composer = () =>
        screen.getByPlaceholderText(/Responder ao cliente/);

      await user.click(rowsOf(container)[0]);
      await user.type(composer(), "Rascunho do primeiro");

      await user.click(rowsOf(container)[1]);
      expect(composer()).toHaveValue("");

      await user.click(rowsOf(container)[0]);
      expect(composer()).toHaveValue("Rascunho do primeiro");
    });

    it("clears the unread counter once the ticket is opened", async () => {
      const user = userEvent.setup();
      const ticket = rawData.chamados.find((t) => t.numero === 10503)!;
      const loadedAt = Date.parse(ticketsStore.getState().loadedAt);

      ticketsStore.applyEvent({
        id: "event-new-message",
        tipo: EventType.MessageAdded,
        ocorrido_em: new Date(loadedAt + 1).toISOString(),
        payload: {
          id: "message-new",
          chamado_id: ticket.id,
          criada_em: new Date(loadedAt + 1).toISOString(),
          autor_id: ticket.solicitante_id,
          texto: "Podem priorizar?",
          interna: false,
        },
      });

      const { container } = renderPage();
      const firstRow = () => rowsOf(container)[0];
      expect(within(firstRow()).getByText("1")).toBeInTheDocument();

      await user.click(firstRow());
      await waitFor(() =>
        expect(within(firstRow()).queryByText("1")).not.toBeInTheDocument(),
      );
    });
  });
});
