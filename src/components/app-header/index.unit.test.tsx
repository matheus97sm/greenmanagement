import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Language, setLanguage } from "@/i18n";
import { HELENA_ID, MARINA_ID, RICARDO_ID } from "@/test-data";
import { renderWithProviders } from "@/test-utils";
import { AppHeader } from ".";

function renderHeader(userId: string, route: string) {
  return renderWithProviders(<AppHeader />, { userId, route });
}

describe("AppHeader", () => {
  it("shows who is signed in and a way out", () => {
    renderHeader(MARINA_ID, "/consultant/tickets");
    expect(screen.getByText("Marina Almeida")).toBeInTheDocument();
    expect(screen.getByText("Consultora")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("has no page links for profiles with a single page", () => {
    renderHeader(MARINA_ID, "/consultant/tickets");
    expect(
      screen.queryByRole("navigation", { name: "Páginas" }),
    ).not.toBeInTheDocument();
    renderHeader(HELENA_ID, "/customer/tickets");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links the manager to the team view and the weekly dashboard", () => {
    renderHeader(RICARDO_ID, "/manager/tickets");
    const nav = screen.getByRole("navigation", { name: "Páginas" });
    expect(nav).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Equipe e chamados" }),
    ).toHaveAttribute("href", "/manager/tickets");
    expect(
      screen.getByRole("link", { name: "Semana da equipe" }),
    ).toHaveAttribute("href", "/manager/dashboard");
  });

  it("marks the page the manager is on", () => {
    renderHeader(RICARDO_ID, "/manager/dashboard");
    expect(
      screen.getByRole("link", { name: "Semana da equipe" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Equipe e chamados" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("keeps the team view marked while a conversation is open", () => {
    renderHeader(RICARDO_ID, "/manager/tickets/some-ticket");
    expect(
      screen.getByRole("link", { name: "Equipe e chamados" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("goes to the other page when its link is clicked", async () => {
    const { router } = renderHeader(RICARDO_ID, "/manager/tickets");
    await userEvent.click(
      screen.getByRole("link", { name: "Semana da equipe" }),
    );
    expect(router.state.location.pathname).toBe("/manager/dashboard");
  });

  it("shows the English text when the language changes", async () => {
    await setLanguage(Language.EnUs);
    renderHeader(RICARDO_ID, "/manager/tickets");
    expect(
      screen.getByRole("navigation", { name: "Pages" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Team and tickets" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Manager")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
  });
});
