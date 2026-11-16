import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { riskTickets } from "@/domain/workload";
import { reassignTickets } from "@/store/actions";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { RICARDO_ID, rawData } from "@/test-data";
import { MAX_ROWS } from "./constants";
import { TicketsPage } from ".";

vi.mock("@/store/actions", () => ({
  reassignTickets: vi.fn(),
}));

const NOW = Date.parse(rawData.meta.agora);

function renderPage() {
  return renderWithProviders(<TicketsPage />, { userId: RICARDO_ID });
}

const consultantRow = (nome: string) =>
  screen.getByText(nome).closest("button") as HTMLElement;
const rowsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ticket-row"));

describe("manager tickets page", () => {
  beforeEach(() => {
    loadStoreAs(RICARDO_ID);
    vi.mocked(reassignTickets)
      .mockReset()
      .mockResolvedValue({ done: 1, failed: 0 });
  });

  it("starts with the figures of the whole team", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Equipe e chamados" }),
    ).toBeInTheDocument();
    const active = rawData.chamados.filter(
      (t) => t.status !== "resolvido" && t.status !== "fechado",
    ).length;
    const card = screen
      .getByText("Chamados ativos")
      .closest(".mantine-Paper-root");
    expect(
      within(card as HTMLElement).getByText(String(active)),
    ).toBeInTheDocument();
  });

  it("starts on the tickets at risk, most urgent first", () => {
    const { container } = renderPage();
    const risk = riskTickets(rawData.chamados, NOW);
    expect(screen.getByRole("radio", { name: /Em risco/ })).toBeChecked();
    expect(rowsOf(container)[0]).toHaveTextContent(`#${risk[0].numero}`);
  });

  it("lists at most the most urgent two hundred and says so", () => {
    const { container } = renderPage();
    const risk = riskTickets(rawData.chamados, NOW);
    expect(risk.length).toBeGreaterThan(MAX_ROWS);
    expect(rowsOf(container)).toHaveLength(MAX_ROWS);
    expect(
      screen.getByText(
        `Mostrando os ${MAX_ROWS} mais urgentes de ${risk.length}.`,
      ),
    ).toBeInTheDocument();
  });

  it("shows the twelve consultants on the board", () => {
    renderPage();
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(12);
  });

  it("lists the tickets nobody took when asked", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.click(screen.getByRole("radio", { name: /Sem responsável/ }));
    const rows = rowsOf(container);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.textContent?.includes("sem responsável"))).toBe(
      true,
    );
  });

  it("narrows the list to one group", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.click(screen.getByRole("radio", { name: /Sem responsável/ }));
    const all = rowsOf(container).length;

    await user.click(screen.getAllByLabelText("Grupo")[0]);
    await user.click(
      await screen.findByRole("option", { name: "Infraestrutura" }),
    );

    expect(rowsOf(container).length).toBeLessThan(all);
    expect(
      screen.getByRole("radio", { name: /Sem responsável \(35\)/ }),
    ).toBeInTheDocument();
  });

  it("jumps to a group's queue from the board", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      screen.getByRole("button", { name: "35 sem responsável" }),
    );
    expect(
      screen.getByRole("radio", { name: /Sem responsável \(35\)/ }),
    ).toBeChecked();
  });

  it("shows everything one consultant carries when picked, and goes back", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(consultantRow("Thiago Nascimento"));

    expect(
      screen.getByRole("radio", { name: "Thiago Nascimento (75)" }),
    ).toBeChecked();
    expect(consultantRow("Thiago Nascimento")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(consultantRow("Thiago Nascimento"));
    expect(screen.getByRole("radio", { name: /Em risco/ })).toBeChecked();
    expect(
      screen.queryByRole("radio", { name: /Thiago/ }),
    ).not.toBeInTheDocument();
  });

  it("only offers to redistribute once something is selected", async () => {
    const user = userEvent.setup();
    renderPage();
    const button = screen.getByRole("button", { name: "Redistribuir (0)" });
    expect(button).toBeDisabled();

    await user.click(
      screen.getByRole("checkbox", { name: "Selecionar chamado 10503" }),
    );
    expect(
      screen.getByRole("button", { name: "Redistribuir (1)" }),
    ).toBeEnabled();
  });

  it("selects every listed ticket at once", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      screen.getByRole("checkbox", { name: "Selecionar todos" }),
    );
    const count = screen.getAllByRole("checkbox").length - 1;
    expect(
      screen.getByRole("button", { name: `Redistribuir (${count})` }),
    ).toBeEnabled();
  });

  it("drops the selection when the list changes", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      screen.getByRole("checkbox", { name: "Selecionar chamado 10503" }),
    );
    await user.click(screen.getByRole("radio", { name: /Sem responsável/ }));
    expect(
      screen.getByRole("button", { name: "Redistribuir (0)" }),
    ).toBeDisabled();
  });

  it("redistributes the selected tickets and clears the selection", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(
      screen.getByRole("checkbox", { name: "Selecionar chamado 10503" }),
    );
    await user.click(screen.getByRole("button", { name: "Redistribuir (1)" }));

    await user.click(screen.getAllByLabelText(/Novo responsável/)[0]);
    await user.click(
      await screen.findByRole("option", { name: /^Diego Araújo/ }),
    );
    await user.click(screen.getByRole("button", { name: "Redistribuir" }));

    await waitFor(() => expect(reassignTickets).toHaveBeenCalledTimes(1));
    expect(vi.mocked(reassignTickets).mock.calls[0][0]).toMatchObject({
      ticketIds: [rawData.chamados.find((t) => t.numero === 10503)!.id],
      managerId: RICARDO_ID,
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Redistribuir (0)" }),
      ).toBeDisabled(),
    );
    expect(screen.queryByText("Novo responsável")).not.toBeInTheDocument();
  });
});
