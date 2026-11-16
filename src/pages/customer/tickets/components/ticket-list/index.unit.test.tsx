import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { USERS } from "@/auth/users";
import { ticketsStore } from "@/store/ticketsStore";
import { HELENA_ID, rawData } from "@/test-data";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { TicketList } from ".";

const me = USERS.find((u) => u.id === HELENA_ID)!;
const idOf = (numero: number) =>
  rawData.chamados.find((t) => t.numero === numero)!.id;

function renderList(selectedId?: string) {
  const onSelect = vi.fn();
  const view = renderWithProviders(
    <TicketList me={me} selectedId={selectedId} onSelect={onSelect} />,
    { userId: HELENA_ID },
  );
  return { ...view, onSelect };
}

const rowsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ticket-row"));
const numbersOf = (container: HTMLElement) =>
  rowsOf(container).map((row) => /#(\d+)/.exec(row.textContent ?? "")?.[1]);

describe("TicketList", () => {
  beforeEach(() => {
    loadStoreAs(HELENA_ID);
  });

  it("shows her four tickets, what needs her first", () => {
    const { container } = renderList();
    expect(numbersOf(container)).toEqual(["10613", "10614", "10611", "10612"]);
  });

  it("says in plain words where each one stands", () => {
    const { container } = renderList();
    const [waiting, received, inProgress, closed] = rowsOf(container);
    expect(within(waiting).getByText("Aguardando você")).toBeInTheDocument();
    expect(within(received).getByText("Recebido")).toBeInTheDocument();
    expect(within(inProgress).getByText("Em atendimento")).toBeInTheDocument();
    expect(within(closed).getByText("Encerrado")).toBeInTheDocument();
  });

  it("says who is looking after each ticket, or that nobody is", () => {
    const { container } = renderList();
    const [waiting, received] = rowsOf(container);
    expect(waiting).toHaveTextContent("Com Juliana Pereira");
    expect(received).toHaveTextContent("Ainda sem responsável");
  });

  it("shows when each was last updated in her time zone", () => {
    const { container } = renderList();
    expect(rowsOf(container)[0]).toHaveTextContent(/02\/11\/26.*02:10/);
  });

  it("flags news she has not seen", () => {
    ticketsStore.restoreRead({ [idOf(10611)]: "2026-10-20T00:00:00.000Z" });
    const { container } = renderList();
    expect(screen.getByText("2 novas")).toBeInTheDocument();
    expect(numbersOf(container)[1]).toBe("10611");
  });

  it("flags nothing when there is nothing new", () => {
    renderList();
    expect(screen.queryByText(/novas?$/)).not.toBeInTheDocument();
  });

  it("opens a ticket when it is clicked", async () => {
    const { container, onSelect } = renderList();
    await userEvent.click(rowsOf(container)[2]);
    expect(onSelect).toHaveBeenCalledWith(idOf(10611));
  });

  it("highlights the ticket that is open", () => {
    const { container } = renderList(idOf(10612));
    const selected = rowsOf(container).filter((r) =>
      r.hasAttribute("data-selected"),
    );
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("#10612");
  });

  it("finds a ticket by number or by words of the title", async () => {
    const user = userEvent.setup();
    const { container } = renderList();
    await user.type(screen.getByLabelText("Buscar chamado"), "vpn");
    expect(numbersOf(container).sort()).toEqual(["10612", "10614"]);
  });

  it("says when nothing matches the search", async () => {
    const user = userEvent.setup();
    renderList();
    await user.type(screen.getByLabelText("Buscar chamado"), "zzzz");
    expect(screen.getByText("Nenhum chamado encontrado.")).toBeInTheDocument();
  });

  it("invites her to open a ticket when she has none", () => {
    loadStoreAs(HELENA_ID, (snapshot) => {
      snapshot.chamados = [];
    });
    renderList();
    expect(
      screen.getByText("Você ainda não abriu nenhum chamado."),
    ).toBeInTheDocument();
  });

  it("never shows the category, the group, the priority or the deadlines", () => {
    const { container } = renderList();
    expect(container.textContent).not.toMatch(
      /Infraestrutura|Aplicações|Prioridade|Rede e VPN|SLA|Estourado/,
    );
  });
});
