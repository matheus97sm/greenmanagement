import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RICARDO_ID } from "@/test-data";
import { renderWithProviders } from "@/test-utils";
import { TicketsPage } from ".";

describe("manager tickets page", () => {
  it("greets the manager by name", () => {
    renderWithProviders(<TicketsPage />, { userId: RICARDO_ID });
    expect(
      screen.getByRole("heading", { name: "Equipe e chamados" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Olá, Ricardo Monteiro/)).toBeInTheDocument();
  });
});
