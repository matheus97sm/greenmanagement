import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TeamWeek } from "@/domain/activity";
import { Language, setLanguage } from "@/i18n";
import { LoadLevel, Profile } from "@/domain/enums";
import { renderWithProviders } from "@/test-utils";
import type { Row } from "../../types";
import { WeekSummary } from ".";

const HOUR = 3_600_000;

const team: TeamWeek = {
  businessMs: 120 * HOUR,
  idleMs: 30 * HOUR,
  idleShare: 0.25,
  assigned: 40,
  resolved: 12,
  replies: 80,
};

const idle: Row = {
  consultant: {
    id: "l",
    nome: "Leandro Alves",
    email: "",
    perfil: Profile.Consultant,
    locale: "pt-BR",
    zoneinfo: "America/Sao_Paulo",
    grupo_id: "g",
  },
  groupName: "Aplicações",
  week: {
    consultantId: "l",
    businessMs: 12 * HOUR,
    idleMs: 12 * HOUR,
    days: [],
    assigned: 0,
    resolved: 0,
    replies: 0,
  },
  workload: {
    consultant: {} as Row["consultant"],
    active: 0,
    waitingCustomer: 0,
    breached: 0,
    atRisk: 0,
    level: LoadLevel.Idle,
  },
};

const card = (label: string) =>
  screen.getByText(label).closest(".mantine-Paper-root") as HTMLElement;

describe("WeekSummary", () => {
  it("shows the idle hours against the working hours of the team", () => {
    renderWithProviders(<WeekSummary team={team} mostIdle={idle} />);
    const hours = card("Horas sem chamado");
    expect(within(hours).getByText("30 h")).toBeInTheDocument();
    expect(
      within(hours).getByText("de 120 h de expediente"),
    ).toBeInTheDocument();
  });

  it("shows the idle share, and what was assigned and resolved", () => {
    renderWithProviders(<WeekSummary team={team} mostIdle={idle} />);
    expect(
      within(card("Ociosidade da equipe")).getByText("25%"),
    ).toBeInTheDocument();
    expect(
      within(card("Chamados atribuídos")).getByText("40"),
    ).toBeInTheDocument();
    expect(
      within(card("Chamados resolvidos")).getByText("12"),
    ).toBeInTheDocument();
  });

  it("names who spent the most time without tickets", () => {
    renderWithProviders(<WeekSummary team={team} mostIdle={idle} />);
    const who = card("Mais tempo sem chamado");
    expect(within(who).getByText("Leandro")).toBeInTheDocument();
    expect(within(who).getByText("12 h · 100%")).toBeInTheDocument();
  });

  it("shows the texts in English when the language is switched", async () => {
    await setLanguage(Language.EnUs);
    renderWithProviders(<WeekSummary team={team} mostIdle={undefined} />);
    const hours = card("Hours without tickets");
    expect(
      within(hours).getByText("of 120 h of working time"),
    ).toBeInTheDocument();
    expect(screen.getByText("Nobody")).toBeInTheDocument();
  });

  it("says nobody was idle when that is the case", () => {
    renderWithProviders(<WeekSummary team={team} mostIdle={undefined} />);
    const who = card("Mais tempo sem chamado");
    expect(within(who).getByText("Ninguém")).toBeInTheDocument();
    expect(within(who).getByText("Todos tiveram chamados")).toBeInTheDocument();
  });
});
