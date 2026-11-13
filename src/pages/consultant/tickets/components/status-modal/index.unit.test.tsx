import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Status } from "@/domain/enums";
import { changeStatus } from "@/store/actions";
import { MARINA_ID, rawData } from "@/test-data";
import { renderWithProviders } from "@/test-utils";
import { StatusModal } from ".";

vi.mock("@/store/actions", () => ({
  takeTicket: vi.fn(),
  sendMessage: vi.fn(),
  changeStatus: vi.fn(),
}));

const ticketWith = (status: Status) =>
  rawData.chamados.find((t) => t.status === status)!;

function renderModal(
  status: Status,
  options: { reopen?: boolean; onClose?: () => void } = {},
) {
  const ticket = ticketWith(status);
  const onClose = options.onClose ?? vi.fn();
  renderWithProviders(
    <StatusModal
      ticket={ticket}
      userId={MARINA_ID}
      reopen={options.reopen}
      onClose={onClose}
    />,
  );
  return { ticket, onClose };
}

const reasonField = () => screen.getByLabelText(/Motivo/);
const statusField = () => screen.getAllByLabelText(/Novo status/)[0];

describe("StatusModal", () => {
  beforeEach(() => {
    vi.mocked(changeStatus).mockReset().mockResolvedValue(true);
  });

  describe("changing the status", () => {
    it("asks for the new status and the reason", () => {
      renderModal(Status.InProgress);
      expect(screen.getByText("Alterar status")).toBeInTheDocument();
      expect(statusField()).toHaveValue("Aguardando cliente");
      expect(reasonField()).toHaveValue("");
    });

    it("only confirms once a reason is given", async () => {
      const user = userEvent.setup();
      renderModal(Status.InProgress);
      const confirm = screen.getByRole("button", { name: "Confirmar" });
      expect(confirm).toBeDisabled();

      await user.type(reasonField(), "   ");
      expect(confirm).toBeDisabled();

      await user.type(reasonField(), "Aguardando prints");
      expect(confirm).toBeEnabled();
    });

    it("sends the chosen status with the reason and closes", async () => {
      const user = userEvent.setup();
      const { ticket, onClose } = renderModal(Status.InProgress);
      await user.type(reasonField(), "Aguardando prints");
      await user.click(screen.getByRole("button", { name: "Confirmar" }));

      expect(changeStatus).toHaveBeenCalledWith({
        ticketId: ticket.id,
        to: Status.WaitingCustomer,
        reason: "Aguardando prints",
        userId: MARINA_ID,
      });
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it("lets her pick another status", async () => {
      const user = userEvent.setup();
      const { ticket } = renderModal(Status.InProgress);
      await user.click(statusField());
      await user.click(screen.getByRole("option", { name: "Resolvido" }));
      await user.type(reasonField(), "Correção aplicada");
      await user.click(screen.getByRole("button", { name: "Confirmar" }));

      expect(changeStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketId: ticket.id,
          to: Status.Resolved,
        }),
      );
    });

    it("stays open when the change is refused", async () => {
      vi.mocked(changeStatus).mockResolvedValue(false);
      const user = userEvent.setup();
      const { onClose } = renderModal(Status.InProgress);
      await user.type(reasonField(), "Motivo");
      await user.click(screen.getByRole("button", { name: "Confirmar" }));

      await waitFor(() => expect(changeStatus).toHaveBeenCalled());
      expect(onClose).not.toHaveBeenCalled();
    });

    it("closes without changing anything when cancelled", async () => {
      const user = userEvent.setup();
      const { onClose } = renderModal(Status.InProgress);
      await user.click(screen.getByRole("button", { name: "Cancelar" }));
      expect(onClose).toHaveBeenCalled();
      expect(changeStatus).not.toHaveBeenCalled();
    });
  });

  describe("reopening", () => {
    it("has no status to choose: it always goes back to in progress", () => {
      renderModal(Status.Closed, { reopen: true });
      expect(screen.getByText("Reabrir chamado")).toBeInTheDocument();
      expect(screen.queryByLabelText(/Novo status/)).not.toBeInTheDocument();
    });

    it("reopens with the reason", async () => {
      const user = userEvent.setup();
      const { ticket, onClose } = renderModal(Status.Closed, { reopen: true });
      const reopen = screen.getByRole("button", { name: "Reabrir" });
      expect(reopen).toBeDisabled();

      await user.type(reasonField(), "O problema voltou");
      await user.click(reopen);

      expect(changeStatus).toHaveBeenCalledWith({
        ticketId: ticket.id,
        to: Status.InProgress,
        reason: "O problema voltou",
        userId: MARINA_ID,
      });
      await waitFor(() => expect(onClose).toHaveBeenCalled());
    });
  });
});
