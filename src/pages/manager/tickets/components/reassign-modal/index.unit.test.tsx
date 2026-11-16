import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { consultantsOf, workloadByConsultant } from "@/domain/workload";
import { reassignTickets } from "@/store/actions";
import { RICARDO_ID, rawData } from "@/test-data";
import { renderWithProviders } from "@/test-utils";
import { ReassignModal } from ".";

vi.mock("@/store/actions", () => ({
  reassignTickets: vi.fn(),
}));

const NOW = Date.parse(rawData.meta.agora);
const workloads = workloadByConsultant(
  rawData.chamados,
  consultantsOf(
    rawData.usuarios,
    rawData.grupos.map((g) => g.id),
  ),
  NOW,
);
const apps = rawData.grupos.find((g) => g.nome === "Aplicações")!;
const appsTickets = rawData.chamados
  .filter((t) => t.grupo_id === apps.id && t.responsavel_id)
  .slice(0, 3);
const otherGroupTicket = rawData.chamados.find((t) => t.grupo_id !== apps.id)!;
const leandro = rawData.usuarios.find((u) => u.nome === "Leandro Alves")!;

function renderModal(tickets = appsTickets) {
  const onClose = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(
    <ReassignModal
      tickets={tickets}
      workloads={workloads}
      managerId={RICARDO_ID}
      onClose={onClose}
      onDone={onDone}
    />,
  );
  return { onClose, onDone };
}

const targetField = () => screen.getAllByLabelText(/Novo responsável/)[0];
const confirm = () => screen.getByRole("button", { name: "Redistribuir" });

describe("ReassignModal", () => {
  beforeEach(() => {
    vi.mocked(reassignTickets)
      .mockReset()
      .mockResolvedValue({ done: 3, failed: 0 });
  });

  it("counts the tickets in the title", () => {
    renderModal();
    expect(screen.getByText("Redistribuir 3 chamados")).toBeInTheDocument();
  });

  it("uses the singular for one ticket", () => {
    renderModal([appsTickets[0]]);
    expect(screen.getByText("Redistribuir chamado")).toBeInTheDocument();
  });

  it("needs someone chosen before it confirms", () => {
    renderModal();
    expect(confirm()).toBeDisabled();
  });

  it("offers the group's consultants with their current load", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(targetField());
    expect(
      await screen.findByRole("option", { name: "Leandro Alves · 0 chamados" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Marina/ }),
    ).not.toBeInTheDocument();
  });

  it("sends every ticket to the chosen consultant", async () => {
    const user = userEvent.setup();
    const { onDone } = renderModal();
    await user.click(targetField());
    await user.click(
      await screen.findByRole("option", { name: "Leandro Alves · 0 chamados" }),
    );
    await user.click(confirm());

    await waitFor(() =>
      expect(reassignTickets).toHaveBeenCalledWith({
        ticketIds: appsTickets.map((t) => t.id),
        consultantId: leandro.id,
        managerId: RICARDO_ID,
      }),
    );
    await waitFor(() =>
      expect(onDone).toHaveBeenCalledWith({ done: 3, failed: 0 }),
    );
  });

  it("closes without sending anything on cancel", async () => {
    const { onClose } = renderModal();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalled();
    expect(reassignTickets).not.toHaveBeenCalled();
  });

  it("asks for one group at a time when the selection mixes groups", () => {
    renderModal([appsTickets[0], otherGroupTicket]);
    expect(screen.getByText(/grupos diferentes/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Novo responsável/)).not.toBeInTheDocument();
    expect(confirm()).toBeDisabled();
  });
});
