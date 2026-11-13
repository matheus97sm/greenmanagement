import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test-utils";
import { MessageBubble } from ".";
import type { Props } from "./types";

const base: Props = {
  author: "Helena Fernandes",
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
});
