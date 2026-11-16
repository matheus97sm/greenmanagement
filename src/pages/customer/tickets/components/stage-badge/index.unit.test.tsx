import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustomerStage } from "@/domain/enums";
import { renderWithProviders } from "@/test-utils";
import { STAGE_COLOR, STAGE_LABEL } from "./constants";
import { StageBadge } from ".";

const stages = Object.values(CustomerStage);

describe("StageBadge", () => {
  it.each(stages)("says the stage %s in plain words", (stage) => {
    renderWithProviders(<StageBadge stage={stage} />);
    expect(screen.getByText(STAGE_LABEL[stage])).toBeInTheDocument();
  });

  it("never reuses a label, so two stages cannot be mistaken", () => {
    expect(new Set(stages.map((s) => STAGE_LABEL[s])).size).toBe(stages.length);
  });

  it("gives every stage a colour", () => {
    for (const stage of stages) expect(STAGE_COLOR[stage]).toBeTruthy();
  });

  it("uses a warning colour only for the stage that needs the customer", () => {
    expect(STAGE_COLOR[CustomerStage.WaitingYou]).toBe("orange");
    const others = stages.filter((s) => s !== CustomerStage.WaitingYou);
    expect(others.some((s) => STAGE_COLOR[s] === "orange")).toBe(false);
  });
});
