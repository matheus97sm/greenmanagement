import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test-utils";
import { Stat } from ".";

describe("Stat", () => {
  it("shows the label and the value", () => {
    renderWithProviders(<Stat label="Chamados ativos" value={412} />);
    expect(screen.getByText("Chamados ativos")).toBeInTheDocument();
    expect(screen.getByText("412")).toBeInTheDocument();
  });

  it("accepts a text value", () => {
    renderWithProviders(
      <Stat label="Mais tempo sem chamado" value="Leandro" />,
    );
    expect(screen.getByText("Leandro")).toBeInTheDocument();
  });

  it("shows a line under the value when one is given", () => {
    renderWithProviders(
      <Stat label="Horas" value="30 h" sub="de 120 h de expediente" />,
    );
    expect(screen.getByText("de 120 h de expediente")).toBeInTheDocument();
  });

  it("leaves the line out when there is none", () => {
    renderWithProviders(<Stat label="Horas" value="30 h" />);
    expect(screen.getAllByText(/./)).toHaveLength(2);
  });

  it("shows a zero instead of hiding it", () => {
    renderWithProviders(<Stat label="Estourados" value={0} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("colours the value only when asked to", () => {
    renderWithProviders(
      <>
        <Stat label="Com cor" value={1} color="red" />
        <Stat label="Sem cor" value={2} />
      </>,
    );
    const colored = screen.getByText("1");
    const plain = screen.getByText("2");
    expect(colored.getAttribute("style") ?? "").toContain("red");
    expect(plain.getAttribute("style") ?? "").not.toContain("red");
  });
});
