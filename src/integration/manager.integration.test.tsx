import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Profile } from "@/domain/enums";
import { getDb } from "@/server/db";
import { assumeTicket } from "@/server/ops";
import { ticketsStore } from "@/store/ticketsStore";
import { RICARDO_ID } from "@/test-data";
import { LOAD_TIMEOUT, renderApp, resetWorld, signInAs } from "./helpers";

vi.mock("@/server/simulator", () => ({ startSimulator: () => () => {} }));

const personNamed = (nome: string) =>
  getDb().usuarios.find((person) => person.nome === nome)!;

const consultantRow = (nome: string) =>
  screen.getByText(nome).closest("button") as HTMLElement;

async function openBoard() {
  const user = userEvent.setup();
  const view = renderApp({ route: "/manager/tickets", userId: RICARDO_ID });
  await screen.findByText("Thiago Nascimento", {}, { timeout: LOAD_TIMEOUT });
  return { user, ...view };
}

describe("the manager's team view", () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it("lands on the board after signing in, with the whole team on it", async () => {
    const user = userEvent.setup();
    const { router } = renderApp({ route: "/" });
    await signInAs(user, "Ricardo Monteiro");

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/manager/tickets"),
    );
    await screen.findByText("Thiago Nascimento", {}, { timeout: LOAD_TIMEOUT });
    expect(screen.getAllByText("Infraestrutura").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Aplicações").length).toBeGreaterThan(0);
    const languageGroup = screen.getByRole("group", { name: "Idioma" });
    const consultantCards = screen
      .getAllByRole("button", { pressed: false })
      .filter((button) => !languageGroup.contains(button));
    expect(consultantCards).toHaveLength(12);
  });

  it("points out who is overloaded and who has nothing to do", async () => {
    await openBoard();
    expect(
      within(consultantRow("Thiago Nascimento")).getByText("Sobrecarregado"),
    ).toBeInTheDocument();
    expect(
      within(consultantRow("Leandro Alves")).getByText("Sem chamados"),
    ).toBeInTheDocument();
  });

  async function selectAndRedistribute(
    user: ReturnType<typeof userEvent.setup>,
    count: number,
    optionName: string,
  ) {
    const boxes = screen
      .getAllByRole("checkbox", { name: /Selecionar chamado/ })
      .slice(0, count);
    const moved = boxes.map((box) => {
      const numero = Number(box.getAttribute("aria-label")!.match(/\d+/)![0]);
      return getDb().chamados.find((ticket) => ticket.numero === numero)!;
    });
    for (const box of boxes) await user.click(box);
    await user.click(
      screen.getByRole("button", { name: `Redistribuir (${count})` }),
    );
    await user.click(screen.getAllByLabelText(/Novo responsável/)[0]);
    await user.click(await screen.findByRole("option", { name: optionName }));
    await user.click(screen.getByRole("button", { name: "Redistribuir" }));
    return moved;
  }

  const inStore = (ticketId: string) =>
    ticketsStore.getState().tickets[ticketId];

  it("moves tickets from one consultant to another and updates the board", async () => {
    const { user } = await openBoard();
    const diego = personNamed("Diego Araújo");

    await user.click(consultantRow("Thiago Nascimento"));
    const moved = await selectAndRedistribute(
      user,
      2,
      "Diego Araújo · 20 chamados",
    );

    await waitFor(
      () =>
        expect(
          moved.every(
            (ticket) => inStore(ticket.id).responsavel_id === diego.id,
          ),
        ).toBe(true),
      { timeout: LOAD_TIMEOUT },
    );
    expect(moved.every((ticket) => ticket.responsavel_id === diego.id)).toBe(
      true,
    );

    await waitFor(() =>
      expect(
        within(consultantRow("Diego Araújo")).getByText("22"),
      ).toBeInTheDocument(),
    );
    expect(
      within(consultantRow("Thiago Nascimento")).getByText("73"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Thiago Nascimento (73)" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Redistribuir (0)" }),
    ).toBeDisabled();
  });

  it("gives the idle consultant work from the queue of the group", async () => {
    const { user } = await openBoard();
    const leandro = personNamed("Leandro Alves");
    const apps = getDb().grupos.find((group) => group.id === leandro.grupo_id)!;
    const waiting = getDb().chamados.filter(
      (ticket) => !ticket.responsavel_id && ticket.grupo_id === apps.id,
    ).length;

    await user.click(
      screen.getByRole("button", { name: `${waiting} sem responsável` }),
    );
    const moved = await selectAndRedistribute(
      user,
      2,
      "Leandro Alves · 0 chamados",
    );

    await waitFor(
      () =>
        expect(
          moved.every(
            (ticket) => inStore(ticket.id).responsavel_id === leandro.id,
          ),
        ).toBe(true),
      { timeout: LOAD_TIMEOUT },
    );
    await waitFor(() =>
      expect(
        within(consultantRow("Leandro Alves")).queryByText("Sem chamados"),
      ).not.toBeInTheDocument(),
    );
    expect(
      within(consultantRow("Leandro Alves")).getByText("2"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `${waiting - 2} sem responsável` }),
    ).toBeInTheDocument();
  });

  it("follows what others do while the board is open", async () => {
    const { user } = await openBoard();
    await user.click(
      screen.getByRole("button", { name: "35 sem responsável" }),
    );
    expect(
      screen.getByRole("radio", { name: /Sem responsável \(35\)/ }),
    ).toBeChecked();

    const infra = getDb().grupos.find(
      (group) => group.nome === "Infraestrutura",
    )!;
    const queued = getDb().chamados.find(
      (ticket) => !ticket.responsavel_id && ticket.grupo_id === infra.id,
    )!;
    const picker = getDb().usuarios.find(
      (person) =>
        person.perfil === Profile.Consultant && person.grupo_id === infra.id,
    )!;
    assumeTicket(queued.id, picker.id);

    await waitFor(
      () =>
        expect(
          screen.getByRole("radio", { name: /Sem responsável \(34\)/ }),
        ).toBeInTheDocument(),
      { timeout: LOAD_TIMEOUT },
    );
  });

  it("shows a consultant who just got work as no longer idle", async () => {
    await openBoard();
    const leandro = personNamed("Leandro Alves");
    const queued = getDb().chamados.find(
      (ticket) =>
        !ticket.responsavel_id && ticket.grupo_id === leandro.grupo_id,
    )!;
    assumeTicket(queued.id, leandro.id);

    await waitFor(
      () =>
        expect(
          within(consultantRow("Leandro Alves")).queryByText("Sem chamados"),
        ).not.toBeInTheDocument(),
      { timeout: LOAD_TIMEOUT },
    );
  });
});
