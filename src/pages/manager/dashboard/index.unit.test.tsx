import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { loadStoreAs, renderWithProviders } from "@/test-utils";
import { RICARDO_ID } from "@/test-data";
import { DashboardPage } from ".";

function renderPage() {
  return renderWithProviders(<DashboardPage />, { userId: RICARDO_ID });
}

const bodyRows = () => screen.getAllByRole("row").slice(1);
const rowOf = (nome: string) =>
  screen.getByText(nome).closest("tr") as HTMLElement;
const firstNames = () =>
  bodyRows().map((r) => within(r).getAllByRole("cell")[0].textContent ?? "");

async function choose(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: RegExp | string,
) {
  await user.click(screen.getAllByLabelText(label)[0]);
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("manager weekly dashboard", () => {
  beforeEach(() => {
    loadStoreAs(RICARDO_ID);
  });

  it("explains what counts as time without tickets", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Semana da equipe" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/das 8h às 18h/)).toBeInTheDocument();
    expect(screen.getByText(/aguardando cliente contam/)).toBeInTheDocument();
  });

  it("shows the twelve consultants, with their working days of the week", () => {
    renderPage();
    expect(bodyRows()).toHaveLength(12);
    for (const header of ["Seg 02/11", "Ter 03/11", "Sex 06/11"]) {
      expect(
        screen.getByRole("columnheader", { name: header }),
      ).toBeInTheDocument();
    }
  });

  it("starts on the current week, with who spent the most time idle on top", () => {
    renderPage();
    expect(screen.getByText("Esta semana (02/11 a 08/11)")).toBeInTheDocument();
    const [first] = bodyRows();
    expect(within(first).getByText("Leandro Alves")).toBeInTheDocument();
    expect(within(first).getByText("12 h")).toBeInTheDocument();
    expect(within(first).getByText("100% do expediente")).toBeInTheDocument();
  });

  it("only counts the working time that has already happened", () => {
    renderPage();
    const cells = within(rowOf("Leandro Alves")).getAllByRole("cell");
    expect(cells[2]).toHaveTextContent("10 h");
    expect(cells[3]).toHaveTextContent("2 h");
    expect(cells[4]).toHaveTextContent("–");
  });

  it("names the consultant with the most idle time in the summary", () => {
    renderPage();
    const card = screen
      .getByText("Mais tempo sem chamado", { selector: "p" })
      .closest(".mantine-Paper-root") as HTMLElement;
    expect(within(card).getByText("Leandro")).toBeInTheDocument();
  });

  it("shows how much each one carries right now", () => {
    renderPage();
    expect(
      within(rowOf("Thiago Nascimento")).getByText("75 chamados"),
    ).toBeInTheDocument();
    expect(
      within(rowOf("Leandro Alves")).getByText("0 chamados"),
    ).toBeInTheDocument();
  });

  it("switches to a past week with all its working time", async () => {
    const user = userEvent.setup();
    renderPage();
    await choose(user, "Semana", /Semana passada/);
    const leandro = rowOf("Leandro Alves");
    expect(within(leandro).getByText("50 h")).toBeInTheDocument();
    for (const cell of within(leandro).getAllByRole("cell").slice(2, 7)) {
      expect(cell).toHaveTextContent("10 h");
    }
  });

  it("narrows to one group", async () => {
    const user = userEvent.setup();
    renderPage();
    await choose(user, "Grupo", "Infraestrutura");
    expect(bodyRows()).toHaveLength(6);
    expect(screen.queryByText("Leandro Alves")).not.toBeInTheDocument();
    expect(screen.getByText("Marina Almeida")).toBeInTheDocument();
  });

  it("sorts by name when asked", async () => {
    const user = userEvent.setup();
    renderPage();
    await choose(user, "Ordenar por", "Nome");
    const names = firstNames();
    expect(names[0]).toContain("Beatriz Lima");
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it("sorts by how many tickets were resolved", async () => {
    const user = userEvent.setup();
    renderPage();
    await choose(user, "Semana", /Semana passada/);
    await choose(user, "Ordenar por", "Mais resolvidos");
    expect(firstNames()[0]).toContain("Felipe Gomes");
  });
});
