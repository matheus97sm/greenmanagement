import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Status } from "@/domain/enums";
import { isActive } from "@/domain/status";
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

function renderPage(route = "/manager/tickets") {
  return renderWithProviders(<TicketsPage />, {
    userId: RICARDO_ID,
    path: "/manager/tickets/:id?",
    route,
  });
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
    const active = rawData.chamados.filter((ticket) =>
      isActive(ticket.status),
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

  it("lists at most the two hundred most urgent and says so", () => {
    const { container } = renderPage();
    const risk = riskTickets(rawData.chamados, NOW);
    expect(risk.length).toBeGreaterThan(MAX_ROWS);
    expect(rowsOf(container).length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        `Mostrando os ${MAX_ROWS} mais urgentes de ${risk.length}.`,
      ),
    ).toBeInTheDocument();
  });

  it("draws only the rows near the visible part of a long list", () => {
    const { container } = renderPage();
    expect(rowsOf(container).length).toBeGreaterThan(0);
    expect(rowsOf(container).length).toBeLessThan(MAX_ROWS / 4);
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
    expect(
      rows.every((resolve) => resolve.textContent?.includes("sem responsável")),
    ).toBe(true);
  });

  it("narrows the list to one group", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("radio", { name: /Sem responsável/ }));
    expect(
      screen.getByRole("radio", { name: /Sem responsável \(61\)/ }),
    ).toBeChecked();

    await user.click(screen.getAllByLabelText("Grupo")[0]);
    await user.click(
      await screen.findByRole("option", { name: "Infraestrutura" }),
    );

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

  it("selects every listed ticket of the first ticket's group at once", async () => {
    const user = userEvent.setup();
    renderPage();
    const top = riskTickets(rawData.chamados, NOW).slice(0, MAX_ROWS);
    const expected = top.filter(
      (ticket) => ticket.grupo_id === top[0].grupo_id,
    ).length;
    expect(expected).toBeLessThan(top.length);

    await user.click(
      screen.getByRole("checkbox", { name: "Selecionar todos" }),
    );
    expect(
      screen.getByRole("button", { name: `Redistribuir (${expected})` }),
    ).toBeEnabled();
  });

  describe("one group at a time", () => {
    const top = riskTickets(rawData.chamados, NOW).slice(0, 10);
    const first = top[0];
    const other = top.find((ticket) => ticket.grupo_id !== first.grupo_id)!;
    const box = (numero: number) =>
      screen.getByRole("checkbox", { name: `Selecionar chamado ${numero}` });

    it("has tickets of both groups on top of the list to start with", () => {
      expect(other).toBeDefined();
    });

    it("disables the tickets of the other group after ticking one", async () => {
      const user = userEvent.setup();
      renderPage();
      expect(box(other.numero)).toBeEnabled();

      await user.click(box(first.numero));
      expect(box(other.numero)).toBeDisabled();
      expect(box(first.numero)).toBeEnabled();
      for (const ticket of top.filter(
        (currentTicket) => currentTicket.grupo_id === first.grupo_id,
      )) {
        expect(box(ticket.numero)).toBeEnabled();
      }
    });

    it("enables them again when the selection is cleared", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(box(first.numero));
      await user.click(box(first.numero));
      expect(box(other.numero)).toBeEnabled();
    });

    it("locks to the group of whatever was ticked, whichever it is", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(box(other.numero));
      expect(box(first.numero)).toBeDisabled();
    });

    it("lifts the lock when the list changes", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(box(first.numero));
      await user.click(screen.getByRole("radio", { name: /Sem responsável/ }));
      expect(
        screen
          .queryAllByRole("checkbox", { name: /Selecionar chamado/ })
          .every((element) => !(element as HTMLInputElement).disabled),
      ).toBe(true);
    });
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
      ticketIds: [
        rawData.chamados.find((ticket) => ticket.numero === 10503)!.id,
      ],
      managerId: RICARDO_ID,
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Redistribuir (0)" }),
      ).toBeDisabled(),
    );
    expect(screen.queryByText("Novo responsável")).not.toBeInTheDocument();
  });

  describe("reading a conversation", () => {
    const ticket = rawData.chamados.find(
      (currentTicket) => currentTicket.numero === 10503,
    )!;

    it("opens the conversation from the ticket title and puts it in the address", async () => {
      const user = userEvent.setup();
      const { router } = renderPage();
      await user.click(
        screen.getByRole("button", {
          name: "Abrir conversa do chamado 10503",
        }),
      );
      expect(router.state.location.pathname).toBe(
        `/manager/tickets/${ticket.id}`,
      );
      expect(
        await screen.findByRole("heading", { name: /#10503 · / }),
      ).toBeInTheDocument();
      expect(screen.getByText(ticket.descricao)).toBeInTheDocument();
    });

    it("opens straight from a shared link", async () => {
      renderPage(`/manager/tickets/${ticket.id}`);
      expect(
        await screen.findByRole("heading", { name: /#10503 · / }),
      ).toBeInTheDocument();
    });

    it("goes back to the team view when the conversation is closed", async () => {
      const user = userEvent.setup();
      const { router } = renderPage(`/manager/tickets/${ticket.id}`);
      await user.click(
        await screen.findByRole("button", { name: "Fechar conversa" }),
      );
      expect(router.state.location.pathname).toBe("/manager/tickets");
    });

    it("redistributes the open ticket from its conversation", async () => {
      const user = userEvent.setup();
      renderPage(`/manager/tickets/${ticket.id}`);
      await user.click(
        await screen.findByRole("button", { name: "Redistribuir" }),
      );
      expect(screen.getByText("Redistribuir chamado")).toBeInTheDocument();
    });
  });

  describe("finding a ticket", () => {
    it("searches every ticket, finished ones included, ignoring the current view", async () => {
      const user = userEvent.setup();
      const { container } = renderPage();
      const closed = rawData.chamados.find(
        (ticket) => ticket.status === Status.Closed,
      )!;

      await user.type(
        screen.getByLabelText("Buscar chamado"),
        String(closed.numero),
      );

      const rows = rowsOf(container);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toHaveTextContent(`#${closed.numero}`);
      expect(screen.getByText("1 chamado encontrado")).toBeInTheDocument();
      expect(screen.getByRole("radio", { name: /Em risco/ })).toBeDisabled();
    });

    it("says when nothing matches and goes back to the view when cleared", async () => {
      const user = userEvent.setup();
      const { container } = renderPage();
      const box = screen.getByLabelText("Buscar chamado");

      await user.type(box, "99999999");
      expect(
        screen.getByText("Nenhum chamado encontrado."),
      ).toBeInTheDocument();

      await user.clear(box);
      expect(rowsOf(container).length).toBeGreaterThan(0);
      expect(screen.getByRole("radio", { name: /Em risco/ })).toBeEnabled();
    });

    it("respects the group filter while searching", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.type(screen.getByLabelText("Buscar chamado"), "104");
      const found = () =>
        Number(
          /(\d+) chamados/.exec(
            screen.getByText(/chamados encontrados/).textContent ?? "",
          )?.[1],
        );
      const all = found();
      expect(all).toBeGreaterThan(50);

      await user.click(screen.getAllByLabelText("Grupo")[0]);
      await user.click(
        await screen.findByRole("option", { name: "Infraestrutura" }),
      );
      expect(found()).toBeLessThan(all);
      expect(found()).toBeGreaterThan(0);
    });
  });
});
