import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Status } from "@/domain/enums";
import type { DomainEvent } from "@/domain/types";
import { getDb } from "@/server/db";
import { addMessage } from "@/server/ops";
import { ticketsStore } from "@/store/ticketsStore";
import { HELENA_ID, MARINA_ID, rawData } from "@/test-data";
import {
  LOAD_TIMEOUT,
  renderApp,
  resetWorld,
  SETTLE_MS,
  signInAs,
  signOut,
  sleep,
} from "./helpers";

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

const idOf = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero)!.id;
const ticketOf = (numero: number) =>
  getDb().chamados.find((t) => t.numero === numero)!;

const rowsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ticket-row"));

async function openHelenasPage(route = "/customer/tickets") {
  const user = userEvent.setup();
  const view = renderApp({ route, userId: HELENA_ID });
  await screen.findByText(/#10613 ·/, {}, { timeout: LOAD_TIMEOUT });
  return { user, ...view };
}

const composer = () =>
  screen.getByPlaceholderText("Escreva sua mensagem (Ctrl+Enter envia)");

describe("the customer's tickets", () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  describe("signing in", () => {
    it("lands on her tickets, with what needs her first", async () => {
      const user = userEvent.setup();
      const { router, container } = renderApp({ route: "/" });
      await signInAs(user, "Helena Fernandes");

      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/customer/tickets"),
      );
      await screen.findByText(/#10613 ·/, {}, { timeout: LOAD_TIMEOUT });
      const order = rowsOf(container).map(
        (row) => /#(\d+)/.exec(row.textContent ?? "")?.[1],
      );
      expect(order).toEqual(["10613", "10614", "10611", "10612"]);
      expect(
        within(rowsOf(container)[0]).getByText("Aguardando você"),
      ).toBeVisible();
    });

    it("has no way to the screens of the team", async () => {
      const { router } = await openHelenasPage("/manager/tickets");
      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/customer/tickets"),
      );
      expect(screen.queryByRole("navigation", { name: "Páginas" })).toBeNull();
    });
  });

  describe("understanding a ticket", () => {
    it("says what is going on without reading the whole conversation", async () => {
      const { user, container } = await openHelenasPage();
      await user.click(rowsOf(container)[0]);

      expect(
        await screen.findByText(
          "Juliana Pereira precisa de uma resposta sua para continuar.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Sem previsão no momento")).toBeInTheDocument();
      expect(
        screen.getByText("Juliana Pereira assumiu o chamado"),
      ).toBeInTheDocument();
    });

    it("never shows the internal side of the ticket", async () => {
      const { user, container } = await openHelenasPage();
      await user.click(rowsOf(container)[3]);
      await screen.findByRole("heading", { name: /#10612 · / });

      expect(document.body.textContent).not.toMatch(
        /Nota interna|Mesmo problema do chamado da semana passada|conta estratégica|Prioridade|Infraestrutura|Pegando da fila/,
      );
      const state = ticketsStore.getState();
      expect(
        Object.values(state.messages)
          .flat()
          .some((m) => m.interna),
      ).toBe(false);
    });
  });

  describe("writing to the team", () => {
    it("shows her message once, and the ticket goes back into work", async () => {
      const { user, container } = await openHelenasPage();
      await user.click(rowsOf(container)[0]);
      const text = "Podem ligar depois das 15h, obrigada";

      await user.type(
        await screen.findByPlaceholderText(/Escreva sua mensagem/),
        text,
      );
      await user.click(screen.getByRole("button", { name: "Enviar" }));

      await waitFor(
        () => expect(ticketOf(10613).status).toBe(Status.InProgress),
        { timeout: LOAD_TIMEOUT },
      );
      await sleep(SETTLE_MS);

      expect(screen.getAllByText(text)).toHaveLength(1);
      expect(getDb().mensagens.filter((m) => m.texto === text)).toHaveLength(1);
      expect(
        screen.getByText("Juliana Pereira está cuidando do seu chamado."),
      ).toBeInTheDocument();
      expect(composer()).toHaveValue("");
    });

    it("cannot write on a finished ticket, only reopen it", async () => {
      const { user, container } = await openHelenasPage();
      await user.click(rowsOf(container)[3]);
      await screen.findByRole("heading", { name: /#10612 · / });

      expect(
        screen.queryByPlaceholderText(/Escreva sua mensagem/),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reabrir chamado" }),
      ).toBeInTheDocument();
    });
  });

  describe("reopening a finished ticket", () => {
    it("brings it back with what she says is wrong, and she can write again", async () => {
      const { user, container } = await openHelenasPage();
      await user.click(rowsOf(container)[3]);
      await screen.findByRole("heading", { name: /#10612 · / });

      await user.type(
        screen.getByLabelText(/O que está errado agora/),
        "A VPN voltou a falhar hoje de manhã",
      );
      await user.click(screen.getByRole("button", { name: "Reabrir chamado" }));

      await waitFor(
        () => expect(ticketOf(10612).status).toBe(Status.InProgress),
        { timeout: LOAD_TIMEOUT },
      );
      await sleep(SETTLE_MS);

      expect(
        screen.getAllByText("A VPN voltou a falhar hoje de manhã"),
      ).toHaveLength(1);
      expect(screen.getByText("Você reabriu o chamado")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Escreva sua mensagem/),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Reabrir chamado" }),
      ).not.toBeInTheDocument();
    });

    it("keeps the same consultant on the ticket", async () => {
      const { user, container } = await openHelenasPage();
      const owner = ticketOf(10612).responsavel_id;
      await user.click(rowsOf(container)[3]);
      await user.type(
        await screen.findByLabelText(/O que está errado agora/),
        "Voltou",
      );
      await user.click(screen.getByRole("button", { name: "Reabrir chamado" }));
      await waitFor(
        () => expect(ticketOf(10612).status).toBe(Status.InProgress),
        { timeout: LOAD_TIMEOUT },
      );
      expect(ticketOf(10612).responsavel_id).toBe(owner);
    });
  });

  describe("coming back after being away", () => {
    it("tells her which ticket has news, and what is new inside it", async () => {
      const user = userEvent.setup();
      const { container } = renderApp({ route: "/" });
      await signInAs(user, "Helena Fernandes");
      await screen.findByText(/#10611 ·/, {}, { timeout: LOAD_TIMEOUT });

      await user.click(
        rowsOf(container).find((row) => /#10611/.test(row.textContent ?? ""))!,
      );
      await screen.findByRole("heading", { name: /#10611 · / });
      await waitFor(() =>
        expect(ticketsStore.getState().lastRead[idOf(10611)]).toBeDefined(),
      );
      await signOut(user);

      addMessage({
        ticketId: idOf(10611),
        authorId: MARINA_ID,
        text: "Já corrigimos, pode confirmar?",
        internal: false,
      });

      await signInAs(user, "Helena Fernandes");
      await screen.findByText(/#10611 ·/, {}, { timeout: LOAD_TIMEOUT });
      const row = rowsOf(container).find((r) =>
        /#10611/.test(r.textContent ?? ""),
      )!;
      expect(within(row).getByText("1 nova")).toBeInTheDocument();

      await user.click(row);
      expect(
        await screen.findByText("Já corrigimos, pode confirmar?"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("Novo")).toHaveLength(1);
    });

    it("stops flagging it once she has read it", async () => {
      const user = userEvent.setup();
      const { container } = renderApp({ route: "/" });
      await signInAs(user, "Helena Fernandes");
      await screen.findByText(/#10611 ·/, {}, { timeout: LOAD_TIMEOUT });
      const open = () =>
        rowsOf(container).find((r) => /#10611/.test(r.textContent ?? ""))!;

      await user.click(open());
      await waitFor(() =>
        expect(ticketsStore.getState().lastRead[idOf(10611)]).toBeDefined(),
      );
      await signOut(user);
      addMessage({
        ticketId: idOf(10611),
        authorId: MARINA_ID,
        text: "Primeira novidade",
        internal: false,
      });

      await signInAs(user, "Helena Fernandes");
      await screen.findByText("1 nova", {}, { timeout: LOAD_TIMEOUT });
      await user.click(open());
      await screen.findByText("Primeira novidade");
      await waitFor(() => expect(screen.queryByText("1 nova")).toBeNull());
      await signOut(user);

      await signInAs(user, "Helena Fernandes");
      await screen.findByText(/#10611 ·/, {}, { timeout: LOAD_TIMEOUT });
      expect(screen.queryByText(/\d+ novas?/)).not.toBeInTheDocument();
    });
  });
});
