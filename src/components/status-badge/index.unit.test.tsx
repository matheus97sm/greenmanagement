import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Status } from "@/domain/enums";
import { Language, setLanguage } from "@/i18n";
import { renderWithProviders } from "@/test-utils";
import { StatusBadge } from ".";

const PORTUGUESE_NAME: Record<Status, string> = {
  [Status.Open]: "Aberto",
  [Status.InProgress]: "Em atendimento",
  [Status.WaitingCustomer]: "Aguardando cliente",
  [Status.Resolved]: "Resolvido",
  [Status.Closed]: "Fechado",
};

const ENGLISH_NAME: Record<Status, string> = {
  [Status.Open]: "Open",
  [Status.InProgress]: "In progress",
  [Status.WaitingCustomer]: "Waiting for customer",
  [Status.Resolved]: "Resolved",
  [Status.Closed]: "Closed",
};

describe("StatusBadge", () => {
  it.each(Object.values(Status))(
    "names the status %s in Portuguese",
    (status) => {
      renderWithProviders(<StatusBadge status={status} />);
      expect(screen.getByText(PORTUGUESE_NAME[status])).toBeInTheDocument();
    },
  );

  it.each(Object.values(Status))(
    "names the status %s in English after the language changes",
    async (status) => {
      await setLanguage(Language.EnUs);
      renderWithProviders(<StatusBadge status={status} />);
      expect(screen.getByText(ENGLISH_NAME[status])).toBeInTheDocument();
    },
  );

  it("uses a different label for every status", () => {
    expect(new Set(Object.values(PORTUGUESE_NAME)).size).toBe(
      Object.values(Status).length,
    );
  });
});
