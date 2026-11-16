import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reopenTicket } from "@/store/actions";
import { HELENA_ID } from "@/test-data";
import { renderWithProviders } from "@/test-utils";
import { ReopenBox } from ".";

vi.mock("@/store/actions", () => ({
  reopenTicket: vi.fn(),
  sendMessage: vi.fn(),
}));

const reasonField = () => screen.getByLabelText(/O que está errado agora/);
const button = () => screen.getByRole("button", { name: "Reabrir chamado" });

function renderBox() {
  return renderWithProviders(
    <ReopenBox ticketId="ticket-1" customerId={HELENA_ID} />,
  );
}

describe("ReopenBox", () => {
  beforeEach(() => {
    vi.mocked(reopenTicket).mockReset().mockResolvedValue(true);
  });

  it("asks what is wrong now and explains what will happen", () => {
    renderBox();
    expect(
      screen.getByText("O problema continua ou voltou?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/reabrir este chamado e avisar quem cuidou dele/),
    ).toBeInTheDocument();
  });

  it("does not reopen without saying what is wrong", async () => {
    const user = userEvent.setup();
    renderBox();
    expect(button()).toBeDisabled();
    await user.type(reasonField(), "   ");
    expect(button()).toBeDisabled();
  });

  it("reopens the ticket with what she wrote", async () => {
    const user = userEvent.setup();
    renderBox();
    await user.type(reasonField(), "A VPN voltou a falhar");
    await user.click(button());
    await waitFor(() =>
      expect(reopenTicket).toHaveBeenCalledWith({
        ticketId: "ticket-1",
        customerId: HELENA_ID,
        reason: "A VPN voltou a falhar",
      }),
    );
  });

  it("clears the box once it was reopened", async () => {
    const user = userEvent.setup();
    renderBox();
    await user.type(reasonField(), "Voltou");
    await user.click(button());
    await waitFor(() => expect(reasonField()).toHaveValue(""));
  });

  it("keeps what she wrote when reopening fails", async () => {
    vi.mocked(reopenTicket).mockResolvedValue(false);
    const user = userEvent.setup();
    renderBox();
    await user.type(reasonField(), "Não percas isto");
    await user.click(button());
    await waitFor(() => expect(reopenTicket).toHaveBeenCalled());
    expect(reasonField()).toHaveValue("Não percas isto");
  });
});
