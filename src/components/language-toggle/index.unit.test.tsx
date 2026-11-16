import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Language } from "@/i18n";
import { renderWithProviders } from "@/test-utils";
import { LanguageToggle } from ".";

describe("LanguageToggle", () => {
  it("offers both languages and marks the active one", () => {
    renderWithProviders(<LanguageToggle />);
    expect(screen.getByRole("group", { name: "Idioma" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Português (Brasil)" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "English (US)" }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("switches the language, including its own label", async () => {
    renderWithProviders(<LanguageToggle />);
    await userEvent.click(screen.getByRole("button", { name: "English (US)" }));
    expect(screen.getByRole("group", { name: "Language" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "English (US)" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement.lang).toBe(Language.EnUs);
  });

  it("switches back", async () => {
    renderWithProviders(<LanguageToggle />);
    await userEvent.click(screen.getByRole("button", { name: "English (US)" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Português (Brasil)" }),
    );
    expect(screen.getByRole("group", { name: "Idioma" })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe(Language.PtBr);
  });

  it("draws a flag for each language", () => {
    const { container } = renderWithProviders(<LanguageToggle />);
    expect(container.querySelectorAll("svg[aria-hidden]")).toHaveLength(2);
  });
});
