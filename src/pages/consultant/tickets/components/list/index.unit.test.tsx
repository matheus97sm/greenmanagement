import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USERS } from "@/auth/users";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { MARINA_ID, rawData } from "@/test-data";
import { TicketList } from ".";

const me = USERS.find((u) => u.id === MARINA_ID)!;
const idOf = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero)!.id;

function renderList(
  props: { selectedId?: string; onSelect?: () => void } = {},
) {
  const onSelect = props.onSelect ?? vi.fn();
  const view = renderWithProviders(
    <TicketList me={me} selectedId={props.selectedId} onSelect={onSelect} />,
    { userId: MARINA_ID },
  );
  return { ...view, onSelect };
}

const rowsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ticket-row"));

describe("TicketList", () => {
  beforeEach(() => {
    loadStoreAs(MARINA_ID);
  });

  it("shows how many tickets she has and how many wait in the group queue", () => {
    renderList();
    expect(screen.getByText("Meus (42)")).toBeInTheDocument();
    expect(screen.getByText("Fila do grupo (35)")).toBeInTheDocument();
  });

  it("puts the critical, breached ticket at the top", () => {
    const { container } = renderList();
    const [first] = rowsOf(container);
    expect(first).toHaveTextContent("#10503");
    expect(first).toHaveTextContent(/estourada/i);
  });

  it("shows the requester with the company, to tell namesakes apart", () => {
    const { container } = renderList();
    const ticket = rawData.chamados.find((t) => t.numero === 10503)!;
    const requester = rawData.usuarios.find(
      (u) => u.id === ticket.solicitante_id,
    )!;
    expect(rowsOf(container)[0]).toHaveTextContent(
      `${requester.nome} · ${requester.empresa}`,
    );
  });

  it("filters by ticket number", async () => {
    const user = userEvent.setup();
    const { container } = renderList();
    await user.type(
      screen.getByPlaceholderText("Buscar por nº, título ou cliente"),
      "10527",
    );
    const rows = rowsOf(container);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("#10527");
  });

  it("says so when nothing matches", async () => {
    const user = userEvent.setup();
    renderList();
    await user.type(
      screen.getByPlaceholderText("Buscar por nº, título ou cliente"),
      "zzzzzz",
    );
    expect(screen.getByText("Nenhum chamado por aqui.")).toBeInTheDocument();
  });

  it("switches to the group queue, which holds only open tickets", async () => {
    const user = userEvent.setup();
    const { container } = renderList();
    await user.click(screen.getByText("Fila do grupo (35)"));
    const rows = rowsOf(container);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row).not.toHaveTextContent("#10503");
      expect(within(row).getByText("Aberto")).toBeInTheDocument();
    }
  });

  it("marks the selected ticket", () => {
    const selectedId = idOf(10527);
    const { container } = renderList({ selectedId });
    const selected = rowsOf(container).filter((row) =>
      row.hasAttribute("data-selected"),
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("#10527");
  });

  it("reports the id of the ticket that was clicked", async () => {
    const user = userEvent.setup();
    const { container, onSelect } = renderList();
    await user.click(rowsOf(container)[0]);
    expect(onSelect).toHaveBeenCalledWith(idOf(10503));
  });

  it("only renders the rows that fit, thanks to virtualization", () => {
    const { container } = renderList();
    expect(rowsOf(container).length).toBeLessThan(42);
  });
});
