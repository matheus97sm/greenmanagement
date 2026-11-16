import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Language, setLanguage } from "@/i18n";
import { renderWithProviders } from "@/test-utils";
import { Summary } from ".";

const figures = {
  active: 412,
  breached: 14,
  atRisk: 9,
  unassigned: 61,
  idle: 1,
};

function valueOf(label: string) {
  const card = screen.getByText(label).closest(".mantine-Paper-root");
  return within(card as HTMLElement).getByText(/^\d+$/);
}

describe("Summary", () => {
  it("shows each figure under its label", () => {
    renderWithProviders(<Summary {...figures} />);
    expect(valueOf("Chamados ativos")).toHaveTextContent("412");
    expect(valueOf("Prazo estourado")).toHaveTextContent("14");
    expect(valueOf("Vencem em menos de 4h")).toHaveTextContent("9");
    expect(valueOf("Sem responsável")).toHaveTextContent("61");
    expect(valueOf("Consultores sem chamados")).toHaveTextContent("1");
  });

  it("shows zeros as they are", () => {
    renderWithProviders(
      <Summary active={0} breached={0} atRisk={0} unassigned={0} idle={0} />,
    );
    expect(valueOf("Prazo estourado")).toHaveTextContent("0");
  });

  it("shows the labels in English", async () => {
    await setLanguage(Language.EnUs);
    renderWithProviders(<Summary {...figures} />);
    expect(valueOf("Active tickets")).toHaveTextContent("412");
    expect(valueOf("Unassigned")).toHaveTextContent("61");
  });
});
