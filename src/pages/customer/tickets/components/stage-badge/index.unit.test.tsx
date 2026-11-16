import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustomerStage } from "@/domain/enums";
import { Language, setLanguage, translatorFor } from "@/i18n";
import { renderWithProviders } from "@/test-utils";
import { STAGE_COLOR, STAGE_KEY } from "./constants";
import { locales } from "./locales";
import { StageBadge } from ".";

const stages = Object.values(CustomerStage);
const translate = translatorFor(locales);
const labelOf = (stage: CustomerStage) => translate(STAGE_KEY[stage]);

describe("StageBadge", () => {
  it.each(stages)("says the stage %s in plain words", (stage) => {
    renderWithProviders(<StageBadge stage={stage} />);
    expect(screen.getByText(labelOf(stage))).toBeInTheDocument();
  });

  it("never reuses a label, so two stages cannot be mistaken", () => {
    expect(new Set(stages.map(labelOf)).size).toBe(stages.length);
  });

  it("gives every stage a colour", () => {
    for (const stage of stages) expect(STAGE_COLOR[stage]).toBeTruthy();
  });

  it("uses a warning colour only for the stage that needs the customer", () => {
    expect(STAGE_COLOR[CustomerStage.WaitingYou]).toBe("orange");
    const others = stages.filter((stage) => stage !== CustomerStage.WaitingYou);
    expect(others.some((stage) => STAGE_COLOR[stage] === "orange")).toBe(false);
  });

  it("says the stage in English", async () => {
    await setLanguage(Language.EnUs);
    renderWithProviders(<StageBadge stage={CustomerStage.WaitingYou} />);
    expect(screen.getByText("Waiting for you")).toBeInTheDocument();
  });
});
