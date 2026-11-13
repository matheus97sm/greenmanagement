import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USERS } from "@/auth/users";
import { Status } from "@/domain/enums";
import { takeTicket } from "@/store/actions";
import { MARINA_ID, RICARDO_ID, rawData } from "@/test-data";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { TicketDetail } from ".";

vi.mock("@/store/actions", () => ({
  takeTicket: vi.fn(),
  sendMessage: vi.fn(),
  changeStatus: vi.fn(),
}));

const userOf = (id: string) => USERS.find((u) => u.id === id)!;
const byNumber = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero)!;
const marina = rawData.usuarios.find((u) => u.id === MARINA_ID)!;

function renderDetail(
  ticketId: string,
  options: { userId?: string; draft?: string } = {},
) {
  const userId = options.userId ?? MARINA_ID;
  return renderWithProviders(
    <TicketDetail
      ticketId={ticketId}
      me={userOf(userId)}
      draft={options.draft ?? ""}
      onDraftChange={vi.fn()}
    />,
    { userId },
  );
}

describe("TicketDetail", () => {
  beforeEach(() => {
    vi.mocked(takeTicket).mockReset().mockResolvedValue(true);
  });

  describe("as the consultant who handles the ticket", () => {
    beforeEach(() => {
      loadStoreAs(MARINA_ID);
    });

    it("shows the ticket, who asked for it and who is handling it", () => {
      const ticket = byNumber(10503);
      const requester = rawData.usuarios.find(
        (u) => u.id === ticket.solicitante_id,
      )!;
      renderDetail(ticket.id);
      expect(
        screen.getByRole("heading", { name: `#10503 · ${ticket.titulo}` }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          new RegExp(`${requester.nome} · ${requester.empresa}`),
        ),
      ).toBeInTheDocument();
      expect(screen.getByText(/Atendido por você/)).toBeInTheDocument();
    });

    it("lets her answer and change the status, but not take it again", () => {
      renderDetail(byNumber(10503).id);
      expect(
        screen.getByPlaceholderText(/Responder ao cliente/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Alterar status" }),
      ).toBeInTheDocument();
      expect(screen.queryByText("Pegar chamado")).not.toBeInTheDocument();
      expect(screen.queryByText("Reabrir")).not.toBeInTheDocument();
    });

    it("passes the draft on to the composer", () => {
      renderDetail(byNumber(10503).id, { draft: "Já estou olhando." });
      expect(screen.getByPlaceholderText(/Responder ao cliente/)).toHaveValue(
        "Já estou olhando.",
      );
    });

    it("opens the status dialog", async () => {
      const user = userEvent.setup();
      renderDetail(byNumber(10503).id);
      await user.click(screen.getByRole("button", { name: "Alterar status" }));
      expect(screen.getByText("Novo status")).toBeInTheDocument();
    });

    it("shows internal notes with their own badge", () => {
      const note = rawData.mensagens.find(
        (m) =>
          m.interna &&
          rawData.chamados.find((t) => t.id === m.chamado_id)
            ?.responsavel_id === MARINA_ID,
      )!;
      const { container } = renderDetail(note.chamado_id);
      const badges = Array.from(
        container.querySelectorAll(".mantine-Badge-root"),
      ).filter((b) => b.textContent === "Nota interna");
      expect(badges.length).toBeGreaterThan(0);
    });

    it("tells the story of a reopened ticket", () => {
      renderDetail(byNumber(10611).id);
      expect(
        screen.getByText(/Reaberto a pedido do cliente/),
      ).toBeInTheDocument();
    });

    it("reports a ticket that does not exist", () => {
      renderDetail("does-not-exist");
      expect(screen.getByText("Chamado não encontrado.")).toBeInTheDocument();
    });
  });

  describe("as a consultant looking at the group queue", () => {
    beforeEach(() => {
      loadStoreAs(MARINA_ID);
    });

    const queued = () =>
      rawData.chamados.find(
        (t) => !t.responsavel_id && t.grupo_id === marina.grupo_id,
      )!;

    it("offers to take it and keeps the composer away", () => {
      renderDetail(queued().id);
      expect(
        screen.getByRole("button", { name: "Pegar chamado" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Pegue o chamado para responder."),
      ).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(/Responder ao cliente/),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Alterar status" }),
      ).not.toBeInTheDocument();
    });

    it("takes the ticket when asked", async () => {
      const user = userEvent.setup();
      renderDetail(queued().id);
      await user.click(screen.getByRole("button", { name: "Pegar chamado" }));
      expect(takeTicket).toHaveBeenCalledWith(queued().id, MARINA_ID);
    });
  });

  describe("with a closed ticket of her own", () => {
    const closedInGroup = () =>
      rawData.chamados.find(
        (t) => t.status === Status.Closed && t.grupo_id === marina.grupo_id,
      )!;

    beforeEach(() => {
      const id = closedInGroup().id;
      loadStoreAs(MARINA_ID, (snapshot) => {
        const ticket = snapshot.chamados.find((t) => t.id === id)!;
        ticket.responsavel_id = MARINA_ID;
      });
    });

    it("offers to reopen it instead of answering", () => {
      renderDetail(closedInGroup().id);
      expect(
        screen.getByRole("button", { name: "Reabrir" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Alterar status" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText(/Responder ao cliente/),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("Chamado encerrado. Reabra para voltar a responder."),
      ).toBeInTheDocument();
    });
  });

  describe("with a very long conversation", () => {
    beforeEach(() => {
      loadStoreAs(RICARDO_ID);
    });

    it("renders only the latest messages and reveals earlier ones on demand", () => {
      const ticket = byNumber(10609);
      renderDetail(ticket.id, { userId: RICARDO_ID });
      const label = () =>
        screen.getByRole("button", { name: /Mostrar mensagens anteriores/ });
      const hiddenCount = () =>
        Number(/\((\d+)\)/.exec(label().textContent ?? "")?.[1]);

      const before = hiddenCount();
      expect(before).toBeGreaterThan(1000);
      fireEvent.click(label());
      expect(hiddenCount()).toBe(before - 100);
    });
  });
});
