import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USERS } from "@/auth/users";
import { Status } from "@/domain/enums";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { RICARDO_ID, rawData } from "@/test-data";
import { ConversationDrawer } from ".";

vi.mock("@/store/actions", () => ({
  takeTicket: vi.fn(),
  sendMessage: vi.fn(),
  changeStatus: vi.fn(),
}));

const currentUser = USERS.find((user) => user.id === RICARDO_ID)!;
const byNumber = (numero: number) =>
  rawData.chamados.find((ticket) => ticket.numero === numero)!;

function renderDrawer(ticketId: string | undefined) {
  const onClose = vi.fn();
  const onReassign = vi.fn();
  const view = renderWithProviders(
    <ConversationDrawer
      ticketId={ticketId}
      currentUser={currentUser}
      onClose={onClose}
      onReassign={onReassign}
    />,
    { userId: RICARDO_ID },
  );
  return { ...view, onClose, onReassign };
}

describe("ConversationDrawer", () => {
  beforeEach(() => {
    loadStoreAs(RICARDO_ID);
  });

  it("stays closed without a ticket", () => {
    renderDrawer(undefined);
    expect(screen.queryByText("Conversa do chamado")).not.toBeInTheDocument();
  });

  it("shows the conversation of the chosen ticket", () => {
    renderDrawer(byNumber(10503).id);
    expect(screen.getByText("Conversa do chamado")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /#10503 · / }),
    ).toBeInTheDocument();
  });

  it("asks to reassign the open ticket", async () => {
    const ticket = byNumber(10503);
    const { onReassign } = renderDrawer(ticket.id);
    await userEvent.click(screen.getByRole("button", { name: "Redistribuir" }));
    expect(onReassign).toHaveBeenCalledWith(ticket.id);
  });

  it("offers no reassignment for a finished ticket", () => {
    const done = rawData.chamados.find(
      (ticket) => ticket.status === Status.Closed,
    )!;
    renderDrawer(done.id);
    expect(
      screen.queryByRole("button", { name: "Redistribuir" }),
    ).not.toBeInTheDocument();
  });

  it("closes from the close button", async () => {
    const { onClose } = renderDrawer(byNumber(10503).id);
    await userEvent.click(
      screen.getByRole("button", { name: "Fechar conversa" }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps a draft when switching to another ticket and back", async () => {
    const first = byNumber(10503);
    const second = rawData.chamados.find(
      (ticket) =>
        ticket.responsavel_id &&
        ticket.id !== first.id &&
        ticket.status === Status.InProgress,
    )!;

    function Harness() {
      const [id, setId] = useState(first.id);
      return (
        <>
          <button type="button" onClick={() => setId(second.id)}>
            trocar
          </button>
          <button type="button" onClick={() => setId(first.id)}>
            voltar
          </button>
          <ConversationDrawer
            ticketId={id}
            currentUser={currentUser}
            onClose={vi.fn()}
            onReassign={vi.fn()}
          />
        </>
      );
    }

    const user = userEvent.setup();
    renderWithProviders(<Harness />, { userId: RICARDO_ID });
    const field = () => screen.getByPlaceholderText(/Responder ao cliente/);

    await user.type(field(), "rascunho do gestor");
    await user.click(screen.getByText("trocar"));
    expect(field()).toHaveValue("");

    await user.click(screen.getByText("voltar"));
    expect(field()).toHaveValue("rascunho do gestor");
  });
});
