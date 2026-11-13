import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HELENA_ID } from "@/test-data";
import { renderWithProviders } from "@/test-utils";
import { TicketsPage } from ".";

describe("customer tickets page", () => {
  it("greets the customer by name", () => {
    renderWithProviders(<TicketsPage />, { userId: HELENA_ID });
    expect(
      screen.getByRole("heading", { name: "Meus chamados" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Olá, Helena Fernandes/)).toBeInTheDocument();
  });
});
