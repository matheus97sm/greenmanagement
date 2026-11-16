import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Profile } from "@/domain/enums";
import { getDb } from "@/server/db";
import { assumeTicket, reassignTicket } from "@/server/ops";
import { RICARDO_ID } from "@/test-data";
import { LOAD_TIMEOUT, renderApp, resetWorld } from "./helpers";

vi.mock("@/server/simulator", () => ({ startSimulator: () => () => {} }));

const personNamed = (nome: string) =>
  getDb().usuarios.find((u) => u.nome === nome)!;

const rowOf = (nome: string) =>
  screen.getByText(nome).closest("tr") as HTMLElement;
const idleCell = (nome: string) => within(rowOf(nome)).getAllByRole("cell")[1];
const bodyRows = () => screen.getAllByRole("row").slice(1);

async function openDashboard() {
  const user = userEvent.setup();
  const view = renderApp({ route: "/manager/dashboard", userId: RICARDO_ID });
  await screen.findByText("Leandro Alves", {}, { timeout: LOAD_TIMEOUT });
  return { user, ...view };
}

describe("the manager's weekly dashboard", () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it("goes between the team view and the dashboard from the header", async () => {
    const user = userEvent.setup();
    const { router } = renderApp({
      route: "/manager/tickets",
      userId: RICARDO_ID,
    });
    await user.click(
      await screen.findByRole(
        "link",
        { name: "Semana da equipe" },
        { timeout: LOAD_TIMEOUT },
      ),
    );
    expect(router.state.location.pathname).toBe("/manager/dashboard");
    expect(
      await screen.findByRole("heading", { name: "Semana da equipe" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Leandro Alves", {}, { timeout: LOAD_TIMEOUT }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Equipe e chamados" }));
    expect(router.state.location.pathname).toBe("/manager/tickets");
    expect(
      await screen.findByRole("heading", { name: "Equipe e chamados" }),
    ).toBeInTheDocument();
  });

  it("shows every consultant with the week worked out from the real history", async () => {
    await openDashboard();
    expect(bodyRows()).toHaveLength(12);

    const [first] = bodyRows();
    expect(within(first).getByText("Leandro Alves")).toBeInTheDocument();
    expect(within(first).getByText("12 h")).toBeInTheDocument();

    expect(idleCell("Marina Almeida")).toHaveTextContent("0 h");
  });

  it("shows a past week with its full working time", async () => {
    const { user } = await openDashboard();
    await user.click(screen.getAllByLabelText("Semana")[0]);
    await user.click(
      await screen.findByRole("option", { name: /Semana passada/ }),
    );
    expect(idleCell("Leandro Alves")).toHaveTextContent("50 h");
    expect(idleCell("Felipe Gomes")).toHaveTextContent("0 h");
  });

  it("follows the load of each consultant as tickets change hands", async () => {
    await openDashboard();
    const thiago = personNamed("Thiago Nascimento");
    const diego = personNamed("Diego Araújo");
    expect(
      within(rowOf("Thiago Nascimento")).getByText("75 chamados"),
    ).toBeInTheDocument();
    expect(
      within(rowOf("Diego Araújo")).getByText("20 chamados"),
    ).toBeInTheDocument();

    const moved = getDb().chamados.find(
      (t) =>
        t.responsavel_id === thiago.id &&
        t.status !== "resolvido" &&
        t.status !== "fechado",
    )!;
    reassignTicket({
      ticketId: moved.id,
      consultantId: diego.id,
      managerId: RICARDO_ID,
    });

    await waitFor(
      () => {
        expect(
          within(rowOf("Thiago Nascimento")).getByText("74 chamados"),
        ).toBeInTheDocument();
        expect(
          within(rowOf("Diego Araújo")).getByText("21 chamados"),
        ).toBeInTheDocument();
      },
      { timeout: LOAD_TIMEOUT },
    );
  });

  it("shows when a consultant who had nothing gets a ticket", async () => {
    await openDashboard();
    const leandro = personNamed("Leandro Alves");
    expect(
      within(rowOf("Leandro Alves")).getByText("0 chamados"),
    ).toBeInTheDocument();

    assumeTicket(
      getDb().chamados.find(
        (t) =>
          !t.responsavel_id &&
          t.grupo_id === leandro.grupo_id &&
          getDb().usuarios.some(
            (u) => u.id === leandro.id && u.perfil === Profile.Consultant,
          ),
      )!.id,
      leandro.id,
    );

    await waitFor(
      () =>
        expect(
          within(rowOf("Leandro Alves")).getByText("1 chamado"),
        ).toBeInTheDocument(),
      { timeout: LOAD_TIMEOUT },
    );
  });
});
