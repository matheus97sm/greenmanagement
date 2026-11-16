import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test-utils";
import { ColorSchemeToggle } from ".";

const scheme = () =>
  document.documentElement.getAttribute("data-mantine-color-scheme");

describe("ColorSchemeToggle", () => {
  it("starts in the light theme, offering the dark one", () => {
    renderWithProviders(<ColorSchemeToggle />);
    expect(scheme()).toBe("light");
    expect(
      screen.getByRole("button", { name: "Mudar para o tema escuro" }),
    ).toBeInTheDocument();
  });

  it("switches to dark and back", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ColorSchemeToggle />);

    await user.click(
      screen.getByRole("button", { name: "Mudar para o tema escuro" }),
    );
    expect(scheme()).toBe("dark");

    await user.click(
      screen.getByRole("button", { name: "Mudar para o tema claro" }),
    );
    expect(scheme()).toBe("light");
  });
});
