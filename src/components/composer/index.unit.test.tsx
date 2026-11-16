import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMessage } from "@/store/actions";
import { renderWithProviders } from "@/test-utils";
import { Composer } from ".";

vi.mock("@/store/actions", () => ({
  takeTicket: vi.fn(),
  sendMessage: vi.fn(),
  changeStatus: vi.fn(),
}));

function Harness({ initial = "" }: { initial?: string }) {
  const [draft, setDraft] = useState(initial);
  return (
    <Composer
      ticketId="ticket-1"
      userId="user-1"
      draft={draft}
      onDraftChange={setDraft}
    />
  );
}

const textarea = () => screen.getByRole("textbox");
const sendButton = () =>
  screen.getByRole("button", { name: /Enviar|Salvar nota/ });

describe("Composer", () => {
  beforeEach(() => {
    vi.mocked(sendMessage).mockReset().mockResolvedValue(true);
  });

  it("starts empty with the send button disabled", () => {
    renderWithProviders(<Harness />);
    expect(textarea()).toHaveValue("");
    expect(sendButton()).toBeDisabled();
  });

  it("keeps the send button disabled for whitespace only", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    await user.type(textarea(), "   ");
    expect(sendButton()).toBeDisabled();
  });

  it("sends a public reply and clears the draft", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    await user.type(textarea(), "Olá, já estou olhando.");
    await user.click(sendButton());

    expect(sendMessage).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      authorId: "user-1",
      text: "Olá, já estou olhando.",
      internal: false,
    });
    await waitFor(() => expect(textarea()).toHaveValue(""));
  });

  it("sends with Ctrl+Enter", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    await user.type(textarea(), "Resposta rápida{Control>}{Enter}{/Control}");
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Resposta rápida" }),
    );
  });

  it("does not send on a plain Enter, which only adds a line", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    await user.type(textarea(), "linha 1{Enter}linha 2");
    expect(sendMessage).not.toHaveBeenCalled();
    expect(textarea()).toHaveValue("linha 1\nlinha 2");
  });

  it("switches to an internal note, which the customer will not see", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    expect(textarea()).toHaveAttribute(
      "placeholder",
      "Responder ao cliente (Ctrl+Enter envia)",
    );

    await user.click(screen.getByLabelText("Nota interna"));
    expect(textarea()).toHaveAttribute(
      "placeholder",
      "Nota interna: o cliente não vai ver",
    );

    await user.type(textarea(), "Cliente ligou duas vezes.");
    await user.click(screen.getByRole("button", { name: "Salvar nota" }));
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ internal: true }),
    );
  });

  it("keeps what was typed when sending fails", async () => {
    vi.mocked(sendMessage).mockResolvedValue(false);
    const user = userEvent.setup();
    renderWithProviders(<Harness />);
    await user.type(textarea(), "Não perca isto");
    await user.click(sendButton());

    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect(textarea()).toHaveValue("Não perca isto");
  });

  it("shows a draft that was written earlier", () => {
    renderWithProviders(<Harness initial="Rascunho antigo" />);
    expect(textarea()).toHaveValue("Rascunho antigo");
    expect(sendButton()).toBeEnabled();
  });
});
