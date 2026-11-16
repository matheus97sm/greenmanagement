import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SlaClock, SlaKind } from "@/domain/enums";
import { renderWithProviders } from "@/test-utils";
import { SlaBadge } from ".";

const HOUR = 3_600_000;

describe("SlaBadge", () => {
  it("shows an overdue deadline", () => {
    renderWithProviders(
      <SlaBadge
        sla={{
          kind: SlaKind.Breached,
          clock: SlaClock.Resolution,
          remainingMs: -3 * HOUR,
        }}
      />,
    );
    expect(screen.getByText("Estourado há 3h")).toBeInTheDocument();
  });

  it("shows the time left on a deadline to come", () => {
    renderWithProviders(
      <SlaBadge
        sla={{
          kind: SlaKind.Ok,
          clock: SlaClock.Resolution,
          remainingMs: 26 * HOUR,
        }}
      />,
    );
    expect(screen.getByText("1d 2h")).toBeInTheDocument();
  });

  it("shows a paused clock", () => {
    renderWithProviders(
      <SlaBadge
        sla={{
          kind: SlaKind.Paused,
          clock: SlaClock.Resolution,
          remainingMs: 4 * HOUR,
        }}
      />,
    );
    expect(screen.getByText("Prazo pausado")).toBeInTheDocument();
  });

  it("shows a finished ticket", () => {
    renderWithProviders(
      <SlaBadge
        sla={{
          kind: SlaKind.Finished,
          clock: SlaClock.Resolution,
          remainingMs: -HOUR,
        }}
      />,
    );
    expect(screen.getByText("Encerrado")).toBeInTheDocument();
  });
});
