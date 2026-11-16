import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USERS } from "@/auth/users";
import { sendMessage } from "@/store/actions";
import { ticketsStore } from "@/store/ticketsStore";
import { HELENA_ID, rawData } from "@/test-data";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { Conversation } from ".";

vi.mock("@/store/actions", () => ({
  sendMessage: vi.fn(),
  reopenTicket: vi.fn(),
  takeTicket: vi.fn(),
  changeStatus: vi.fn(),
}));

const me = USERS.find((u) => u.id === HELENA_ID)!;
const idOf = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero)!.id;

function Harness({ ticketId }: { ticketId: string }) {
  const [draft, setDraft] = useState("");
  return (
    <Conversation
      ticketId={ticketId}
      me={me}
      draft={draft}
      onDraftChange={setDraft}
    />
  );
}

function renderConversation(numero: number) {
  return renderWithProviders(<Harness ticketId={idOf(numero)} />, {
    userId: HELENA_ID,
  });
}

const composer = () =>
  screen.queryByPlaceholderText("Escreva sua mensagem (Ctrl+Enter envia)");

describe("Conversation", () => {
  beforeEach(() => {
    loadStoreAs(HELENA_ID);
    vi.mocked(sendMessage).mockReset().mockResolvedValue(true);
  });

  it("shows the title, when it was opened and where it stands", () => {
    renderConversation(10613);
    expect(
      screen.getByRole("heading", { name: /#10613 · Pedido de acesso/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Aberto em 31\/10\/26/)).toBeInTheDocument();
    expect(screen.getAllByText("Aguardando você").length).toBeGreaterThan(0);
  });

  it("puts the summary and the messages together", () => {
    renderConversation(10613);
    expect(screen.getByText("O que já aconteceu")).toBeInTheDocument();
    expect(screen.getByText("Podem telefonar-me?")).toBeInTheDocument();
  });

  it("lets her write to the team while the ticket is open", () => {
    renderConversation(10613);
    expect(composer()).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reabrir chamado" }),
    ).not.toBeInTheDocument();
  });

  it("offers no internal note, which she must never write", () => {
    renderConversation(10613);
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByText("Nota interna")).not.toBeInTheDocument();
  });

  it("lets her write on a ticket nobody has taken yet", () => {
    renderConversation(10614);
    expect(composer()).toBeInTheDocument();
  });

  it("sends her message as a public one, in her name", async () => {
    const user = userEvent.setup();
    renderConversation(10613);
    await user.type(composer()!, "Podem ligar depois das 15h");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith({
        ticketId: idOf(10613),
        authorId: HELENA_ID,
        text: "Podem ligar depois das 15h",
        internal: false,
      }),
    );
  });

  it("replaces the reply box with the way to reopen a finished ticket", () => {
    renderConversation(10612);
    expect(composer()).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reabrir chamado" }),
    ).toBeInTheDocument();
  });

  it("never shows the internal notes of the team", () => {
    renderConversation(10612);
    expect(screen.queryByText("Nota interna")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Mesmo problema do chamado da semana passada/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/conta estratégica/)).not.toBeInTheDocument();
  });

  it("flags what is new since she last looked, and keeps flagging while it is open", () => {
    ticketsStore.restoreRead({ [idOf(10611)]: "2026-10-20T00:00:00.000Z" });
    renderConversation(10611);
    expect(screen.getAllByText("Novo")).toHaveLength(2);

    ticketsStore.markRead(idOf(10611));
    expect(screen.getAllByText("Novo")).toHaveLength(2);
  });

  it("flags nothing for a ticket she has already read", () => {
    renderConversation(10611);
    expect(screen.queryByText("Novo")).not.toBeInTheDocument();
  });

  it("says so when the ticket is not hers or does not exist", () => {
    renderWithProviders(<Harness ticketId="someone-elses" />, {
      userId: HELENA_ID,
    });
    expect(screen.getByText("Chamado não encontrado.")).toBeInTheDocument();
  });

  it("keeps the draft in the box that was handed down", () => {
    renderWithProviders(
      <Conversation
        ticketId={idOf(10613)}
        me={me}
        draft="Rascunho"
        onDraftChange={() => {}}
      />,
      { userId: HELENA_ID },
    );
    expect(composer()).toHaveValue("Rascunho");
  });
});
