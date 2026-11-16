import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { RICARDO_ID, rawData } from "@/test-data";
import { TicketQueue } from ".";

const NOW = Date.parse(rawData.meta.agora);
const byNumber = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero)!;

function renderQueue(
  props: {
    tickets?: typeof rawData.chamados;
    selected?: string[];
    total?: number;
  } = {},
) {
  const tickets = props.tickets ?? [byNumber(10503), byNumber(10001)];
  const onToggle = vi.fn();
  const onToggleAll = vi.fn();
  const view = renderWithProviders(
    <TicketQueue
      tickets={tickets}
      total={props.total ?? tickets.length}
      selected={new Set(props.selected ?? [])}
      now={NOW}
      emptyText="Nada por aqui."
      onToggle={onToggle}
      onToggleAll={onToggleAll}
    />,
    { userId: RICARDO_ID },
  );
  return { ...view, onToggle, onToggleAll };
}

const rowsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ticket-row"));

describe("TicketQueue", () => {
  beforeEach(() => {
    loadStoreAs(RICARDO_ID);
  });

  it("shows the number, title, requester and who has the ticket", () => {
    const { container } = renderQueue();
    const ticket = byNumber(10503);
    const requester = rawData.usuarios.find(
      (u) => u.id === ticket.solicitante_id,
    )!;
    const owner = rawData.usuarios.find((u) => u.id === ticket.responsavel_id)!;
    const [row] = rowsOf(container);
    expect(row).toHaveTextContent(`#10503 · ${ticket.titulo}`);
    expect(row).toHaveTextContent(requester.nome);
    expect(row).toHaveTextContent(`com ${owner.nome}`);
  });

  it("says when nobody has the ticket", () => {
    const queued = rawData.chamados.find((t) => !t.responsavel_id)!;
    const { container } = renderQueue({ tickets: [queued] });
    expect(rowsOf(container)[0]).toHaveTextContent("sem responsável");
  });

  it("shows priority, status and the SLA of each ticket", () => {
    const { container } = renderQueue();
    const [row] = rowsOf(container);
    expect(within(row).getByText("Crítica")).toBeInTheDocument();
    expect(within(row).getByText("Em atendimento")).toBeInTheDocument();
    expect(row).toHaveTextContent(/estourad/i);
  });

  it("reports a click on a ticket's checkbox", async () => {
    const { onToggle } = renderQueue();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Selecionar chamado 10503" }),
    );
    expect(onToggle).toHaveBeenCalledWith(byNumber(10503).id);
  });

  it("marks the selected tickets", () => {
    renderQueue({ selected: [byNumber(10503).id] });
    expect(
      screen.getByRole("checkbox", { name: "Selecionar chamado 10503" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Selecionar chamado 10001" }),
    ).not.toBeChecked();
  });

  it("asks to select everything when the box is ticked", async () => {
    const { onToggleAll } = renderQueue();
    await userEvent.click(
      screen.getByRole("checkbox", { name: "Selecionar todos" }),
    );
    expect(onToggleAll).toHaveBeenCalledWith(true);
  });

  it("shows the select-all box as partly checked with some selected", () => {
    renderQueue({ selected: [byNumber(10503).id] });
    expect(
      screen.getByRole("checkbox", { name: "Selecionar todos" }),
    ).toBePartiallyChecked();
  });

  it("shows the empty message when there is nothing to list", () => {
    renderQueue({ tickets: [] });
    expect(screen.getByText("Nada por aqui.")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("says how many more tickets are left out of the list", () => {
    renderQueue({ total: 225 });
    expect(
      screen.getByText("Mostrando os 2 mais urgentes de 225."),
    ).toBeInTheDocument();
  });
});
