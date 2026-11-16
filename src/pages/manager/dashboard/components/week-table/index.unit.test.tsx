import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadLevel, Profile } from "@/domain/enums";
import { renderWithProviders } from "@/test-utils";
import type { Row } from "../../types";
import { WeekTable } from ".";

const HOUR = 3_600_000;
const headers = [
  "Seg 02/11",
  "Ter 03/11",
  "Qua 04/11",
  "Qui 05/11",
  "Sex 06/11",
];

const day = (businessHours: number, idleHours: number) => ({
  businessMs: businessHours * HOUR,
  idleMs: idleHours * HOUR,
});

function row(
  nome: string,
  overrides: { idle?: number; breached?: number; active?: number } = {},
): Row {
  const idle = overrides.idle ?? 0;
  return {
    consultant: {
      id: nome,
      nome,
      email: "",
      perfil: Profile.Consultant,
      locale: "pt-BR",
      zoneinfo: "America/Sao_Paulo",
      grupo_id: "g",
    },
    groupName: "Infraestrutura",
    week: {
      consultantId: nome,
      businessMs: 12 * HOUR,
      idleMs: idle * HOUR,
      days: [
        day(10, Math.min(idle, 10)),
        day(2, Math.max(0, idle - 10)),
        day(0, 0),
        day(0, 0),
        day(0, 0),
      ],
      assigned: 3,
      resolved: 2,
      replies: 7,
    },
    workload: {
      consultant: {} as Row["consultant"],
      active: overrides.active ?? 5,
      waitingCustomer: 0,
      breached: overrides.breached ?? 0,
      atRisk: 0,
      level: LoadLevel.Normal,
    },
  };
}

const rowOf = (nome: string) =>
  screen.getByText(nome).closest("tr") as HTMLElement;

describe("WeekTable", () => {
  it("has a column for each working day, with its date", () => {
    renderWithProviders(<WeekTable rows={[row("Ana")]} dayHeaders={headers} />);
    for (const header of headers) {
      expect(
        screen.getByRole("columnheader", { name: header }),
      ).toBeInTheDocument();
    }
  });

  it("shows the consultant, their group and what they did in the week", () => {
    renderWithProviders(<WeekTable rows={[row("Ana")]} dayHeaders={headers} />);
    const ana = rowOf("Ana");
    expect(within(ana).getByText("Infraestrutura")).toBeInTheDocument();
    expect(within(ana).getByText("3")).toBeInTheDocument();
    expect(within(ana).getByText("2")).toBeInTheDocument();
    expect(within(ana).getByText("7")).toBeInTheDocument();
  });

  it("shows the idle time and its share of the working time", () => {
    renderWithProviders(
      <WeekTable rows={[row("Leo", { idle: 12 })]} dayHeaders={headers} />,
    );
    const leo = rowOf("Leo");
    expect(within(leo).getByText("12 h")).toBeInTheDocument();
    expect(within(leo).getByText("100% do expediente")).toBeInTheDocument();
    expect(
      within(leo).getByRole("progressbar", {
        name: "Tempo sem chamado de Leo",
      }),
    ).toBeInTheDocument();
  });

  it("shows the idle hours of each day and a dash for days that have not happened", () => {
    renderWithProviders(
      <WeekTable rows={[row("Leo", { idle: 12 })]} dayHeaders={headers} />,
    );
    const cells = within(rowOf("Leo")).getAllByRole("cell");
    expect(cells[2]).toHaveTextContent("10 h");
    expect(cells[3]).toHaveTextContent("2 h");
    expect(cells[4]).toHaveTextContent("–");
    expect(cells[6]).toHaveTextContent("–");
  });

  it("shades the days with idle time and leaves the others plain", () => {
    renderWithProviders(
      <WeekTable rows={[row("Leo", { idle: 12 })]} dayHeaders={headers} />,
    );
    const cells = within(rowOf("Leo")).getAllByRole("cell");
    expect(cells[2].style.background).toContain("color-mix");
    expect(cells[4].style.background).toBe("");
  });

  it("shows the current load and flags breached tickets", () => {
    renderWithProviders(
      <WeekTable
        rows={[
          row("Ana", { active: 1 }),
          row("Bia", { active: 9, breached: 3 }),
        ]}
        dayHeaders={headers}
      />,
    );
    expect(within(rowOf("Ana")).getByText("1 chamado")).toBeInTheDocument();
    expect(
      within(rowOf("Ana")).queryByText(/estourad/),
    ).not.toBeInTheDocument();
    expect(within(rowOf("Bia")).getByText("9 chamados")).toBeInTheDocument();
    expect(within(rowOf("Bia")).getByText("3 estourados")).toBeInTheDocument();
  });

  it("keeps the order of the rows it was given", () => {
    renderWithProviders(
      <WeekTable rows={[row("Zed"), row("Ana")]} dayHeaders={headers} />,
    );
    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((r) => r.textContent ?? "");
    expect(names[0]).toContain("Zed");
    expect(names[1]).toContain("Ana");
  });
});
