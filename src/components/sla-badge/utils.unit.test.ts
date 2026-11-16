import { describe, expect, it } from "vitest";
import { SlaClock, SlaKind } from "@/domain/enums";
import type { SlaInfo } from "@/domain/sla";
import { Language, setLanguage, translatorFor } from "@/i18n";
import { locales } from "./locales";
import { slaBadgeView } from "./utils";

const translate = translatorFor(locales);

const viewOf = (info: SlaInfo) => slaBadgeView(info, translate);

const HOUR = 3_600_000;

const sla = (overrides: Partial<SlaInfo>): SlaInfo => ({
  kind: SlaKind.Ok,
  clock: SlaClock.Resolution,
  remainingMs: 10 * HOUR,
  ...overrides,
});

describe("slaBadgeView", () => {
  describe("a breached deadline", () => {
    it("says for how long the resolution is overdue, in solid red", () => {
      expect(
        viewOf(sla({ kind: SlaKind.Breached, remainingMs: -2 * HOUR })),
      ).toEqual({
        color: "red",
        variant: "filled",
        label: "Estourado há 2h",
      });
    });

    it("says it is the first response that is overdue when that is the pending clock", () => {
      expect(
        viewOf(
          sla({
            kind: SlaKind.Breached,
            clock: SlaClock.FirstResponse,
            remainingMs: -30 * 60_000,
          }),
        ).label,
      ).toBe("1ª resposta estourada há 30min");
    });
  });

  describe("a deadline still to come", () => {
    it.each([
      [SlaKind.Critical, "red"],
      [SlaKind.Warning, "orange"],
      [SlaKind.Ok, "gray"],
    ])("colours a %s deadline %s", (kind, color) => {
      const view = viewOf(sla({ kind }));
      expect(view.color).toBe(color);
      expect(view.variant).toBe("light");
    });

    it("shows the time left", () => {
      expect(
        viewOf(sla({ kind: SlaKind.Warning, remainingMs: 2.5 * HOUR })).label,
      ).toBe("2h 30min");
    });

    it("says it is the first response that is due when that is the pending clock", () => {
      expect(
        viewOf(
          sla({
            kind: SlaKind.Critical,
            clock: SlaClock.FirstResponse,
            remainingMs: 20 * 60_000,
          }),
        ).label,
      ).toBe("1ª resposta em 20min");
    });
  });

  it("shows a paused clock as an outlined blue note", () => {
    expect(viewOf(sla({ kind: SlaKind.Paused }))).toEqual({
      color: "blue",
      variant: "outline",
      label: "Prazo pausado",
    });
  });

  it("shows a finished ticket as an outlined grey note", () => {
    expect(viewOf(sla({ kind: SlaKind.Finished }))).toEqual({
      color: "gray",
      variant: "outline",
      label: "Encerrado",
    });
  });

  it("writes the labels in English after the language changes", async () => {
    await setLanguage(Language.EnUs);
    expect(
      viewOf(sla({ kind: SlaKind.Breached, remainingMs: -2 * HOUR })).label,
    ).toBe("Overdue by 2h");
    expect(viewOf(sla({ kind: SlaKind.Paused })).label).toBe("Deadline paused");
  });
});
