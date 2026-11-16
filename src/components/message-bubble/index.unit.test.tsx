import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Profile } from "@/domain/enums";
import { renderWithProviders } from "@/test-utils";
import { MessageBubble } from ".";
import type { Props } from "./types";

const base: Props = {
  author: "Helena Fernandes",
  role: Profile.Customer,
  isOwn: false,
  internal: false,
  text: "A VPN continua caindo.",
  at: "03/11/2026 13:00",
};

describe("MessageBubble", () => {
  it("shows the author, the time and the text", () => {
    renderWithProviders(<MessageBubble {...base} />);
    expect(screen.getByText("Helena Fernandes")).toBeInTheDocument();
    expect(screen.getByText("03/11/2026 13:00")).toBeInTheDocument();
    expect(screen.getByText("A VPN continua caindo.")).toBeInTheDocument();
  });

  it("calls the viewer's own messages Você instead of by name", () => {
    renderWithProviders(<MessageBubble {...base} isOwn author="Marina" />);
    expect(screen.getByText("Você")).toBeInTheDocument();
    expect(screen.queryByText("Marina")).not.toBeInTheDocument();
  });

  it("flags internal notes", () => {
    renderWithProviders(<MessageBubble {...base} internal />);
    expect(screen.getByText("Nota interna")).toBeInTheDocument();
  });

  it("does not flag public messages", () => {
    renderWithProviders(<MessageBubble {...base} />);
    expect(screen.queryByText("Nota interna")).not.toBeInTheDocument();
  });

  it("keeps the line breaks of the text", () => {
    renderWithProviders(<MessageBubble {...base} text={"linha 1\nlinha 2"} />);
    expect(screen.getByText(/linha 1/)).toHaveStyle({ whiteSpace: "pre-wrap" });
  });

  describe("telling employees from customers", () => {
    it.each([
      [Profile.Customer, "Cliente"],
      [Profile.Consultant, "Consultor"],
      [Profile.Manager, "Gestor"],
    ])("labels a %s message with the badge %s", (role, label) => {
      renderWithProviders(<MessageBubble {...base} role={role} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it("shows only the badge of the author's own role", () => {
      renderWithProviders(
        <MessageBubble {...base} role={Profile.Consultant} />,
      );
      expect(screen.queryByText("Cliente")).not.toBeInTheDocument();
      expect(screen.queryByText("Gestor")).not.toBeInTheDocument();
    });

    it("shows no badge when the author is unknown", () => {
      renderWithProviders(<MessageBubble {...base} role={undefined} />);
      for (const label of ["Cliente", "Consultor", "Gestor"]) {
        expect(screen.queryByText(label)).not.toBeInTheDocument();
      }
    });

    it("keeps the badge on the viewer's own messages", () => {
      renderWithProviders(
        <MessageBubble
          {...base}
          role={Profile.Manager}
          isOwn
          author="Ricardo"
        />,
      );
      expect(screen.getByText("Você")).toBeInTheDocument();
      expect(screen.getByText("Gestor")).toBeInTheDocument();
    });

    it("keeps the badge and the note flag together on an internal note", () => {
      renderWithProviders(
        <MessageBubble {...base} role={Profile.Consultant} internal />,
      );
      expect(screen.getByText("Consultor")).toBeInTheDocument();
      expect(screen.getByText("Nota interna")).toBeInTheDocument();
    });

    it("marks the bubble with the role of its author", () => {
      const { container } = renderWithProviders(
        <MessageBubble {...base} role={Profile.Customer} />,
      );
      expect(container.querySelector("[data-role]")).toHaveAttribute(
        "data-role",
        Profile.Customer,
      );
    });

    it("gives the customer a different edge colour from the staff", () => {
      const edge = (role: Profile) => {
        const { container, unmount } = renderWithProviders(
          <MessageBubble {...base} role={role} />,
        );
        const value = (container.querySelector("[data-role]") as HTMLElement)
          .style.borderLeft;
        unmount();
        return value;
      };
      const customer = edge(Profile.Customer);
      const consultant = edge(Profile.Consultant);
      const manager = edge(Profile.Manager);
      expect(new Set([customer, consultant, manager]).size).toBe(3);
    });
  });
});
