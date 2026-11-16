import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTicket } from "@/store/actions";
import { LoadStatus } from "@/store/enums";
import { ticketsStore } from "@/store/ticketsStore";
import { Language, setLanguage } from "@/i18n";
import { HELENA_ID, rawData } from "@/test-data";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { TicketsPage } from ".";

vi.mock("@/store/actions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/store/actions")>()),
  createTicket: vi.fn(),
  sendMessage: vi.fn(),
  reopenTicket: vi.fn(),
}));

const idOf = (numero: number) =>
  rawData.chamados.find((ticket) => ticket.numero === numero)!.id;

function renderPage(route = "/customer/tickets") {
  return renderWithProviders(<TicketsPage />, {
    userId: HELENA_ID,
    path: "/customer/tickets/:id?",
    route,
  });
}

const rowsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ticket-row"));

describe("customer tickets page", () => {
  describe("while loading", () => {
    it("shows a spinner until the data arrives", () => {
      ticketsStore.reset();
      const { container } = renderPage();
      expect(container.querySelector(".mantine-Loader-root")).toBeTruthy();
      expect(screen.queryByText("Meus chamados")).not.toBeInTheDocument();
    });

    it("tells her when the tickets could not be loaded", async () => {
      ticketsStore.reset();
      await ticketsStore.load(() => Promise.reject(new Error("offline")));
      renderPage();
      expect(ticketsStore.getState().status).toBe(LoadStatus.Error);
      expect(
        screen.getByText("Não foi possível carregar os chamados."),
      ).toBeInTheDocument();
    });
  });

  describe("once loaded", () => {
    beforeEach(() => {
      loadStoreAs(HELENA_ID);
      vi.mocked(createTicket).mockReset().mockResolvedValue(null);
    });

    it("shows her tickets and a way to open a new one", () => {
      const { container } = renderPage();
      expect(
        screen.getByRole("heading", { name: "Meus chamados" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Novo chamado" }),
      ).toBeInTheDocument();
      expect(rowsOf(container)).toHaveLength(4);
    });

    it("speaks English when the language is English", async () => {
      await setLanguage(Language.EnUs);
      renderPage();
      expect(
        screen.getByRole("heading", { name: "My tickets" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New ticket" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Pick a ticket from the list to see how it is going."),
      ).toBeInTheDocument();
    });

    it("asks her to pick a ticket before any is open", () => {
      renderPage();
      expect(
        screen.getByText("Escolha um chamado na lista para ver o andamento."),
      ).toBeInTheDocument();
    });

    it("invites her to open the first ticket when she has none", () => {
      loadStoreAs(HELENA_ID, (snapshot) => {
        snapshot.chamados = [];
      });
      renderPage();
      expect(
        screen.getByText(/abra um chamado e acompanhe tudo por aqui/),
      ).toBeInTheDocument();
    });

    it("opens the conversation of a ticket from the address", () => {
      renderPage(`/customer/tickets/${idOf(10613)}`);
      expect(
        screen.getByRole("heading", { name: /#10613 · / }),
      ).toBeInTheDocument();
      expect(screen.getByText("Podem telefonar-me?")).toBeInTheDocument();
    });

    it("puts the ticket in the address when she picks one from the list", async () => {
      const { container, router } = renderPage();
      await userEvent.click(rowsOf(container)[0]);
      expect(router.state.location.pathname).toBe(
        `/customer/tickets/${idOf(10613)}`,
      );
      expect(
        await screen.findByRole("heading", { name: /#10613 · / }),
      ).toBeInTheDocument();
    });

    it("marks the ticket as read when it is opened", async () => {
      ticketsStore.restoreRead({ [idOf(10611)]: "2026-10-20T00:00:00.000Z" });
      const before = ticketsStore.getState().lastRead[idOf(10611)];
      renderPage(`/customer/tickets/${idOf(10611)}`);
      await waitFor(() =>
        expect(ticketsStore.getState().lastRead[idOf(10611)] > before).toBe(
          true,
        ),
      );
    });

    it("does not mark a ticket it does not know as read", () => {
      renderPage("/customer/tickets/not-hers");
      expect(ticketsStore.getState().lastRead["not-hers"]).toBeUndefined();
      expect(screen.getByText("Chamado não encontrado.")).toBeInTheDocument();
    });

    it("keeps what she was typing when she looks at another ticket and comes back", async () => {
      const user = userEvent.setup();
      const { container } = renderPage(`/customer/tickets/${idOf(10613)}`);
      const box = () => screen.getByPlaceholderText(/Escreva sua mensagem/);
      await user.type(box(), "Rascunho para a Juliana");

      await user.click(rowsOf(container)[1]);
      await user.click(rowsOf(container)[0]);
      expect(box()).toHaveValue("Rascunho para a Juliana");
    });

    it("opens the form for a new ticket", async () => {
      renderPage();
      await userEvent.click(
        screen.getByRole("button", { name: "Novo chamado" }),
      );
      expect(screen.getByText("Resumo do problema")).toBeInTheDocument();
    });

    it("closes the form without opening anything when she cancels", async () => {
      renderPage();
      await userEvent.click(
        screen.getByRole("button", { name: "Novo chamado" }),
      );
      await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(screen.queryByText("Resumo do problema")).not.toBeInTheDocument();
    });

    it("goes to the ticket that was just opened", async () => {
      vi.mocked(createTicket).mockResolvedValue(idOf(10613));
      const user = userEvent.setup();
      const { router } = renderPage();
      await user.click(screen.getByRole("button", { name: "Novo chamado" }));
      await user.type(
        screen.getByLabelText(/Resumo do problema/),
        "Impressora sem toner",
      );
      await user.type(
        screen.getByLabelText(/O que está acontecendo/),
        "Acabou o toner",
      );
      await user.click(screen.getAllByLabelText(/Sobre o quê/)[0]);
      await user.click(await screen.findByRole("option", { name: "ERP" }));
      await user.click(screen.getByRole("button", { name: "Abrir chamado" }));

      await waitFor(() =>
        expect(router.state.location.pathname).toBe(
          `/customer/tickets/${idOf(10613)}`,
        ),
      );
      expect(screen.queryByText("Resumo do problema")).not.toBeInTheDocument();
    });
  });
});
