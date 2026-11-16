import { describe, expect, it } from "vitest";
import { barColor, dayBackground, dayShare } from "./utils";

const HOUR = 3_600_000;

describe("barColor", () => {
  it("goes from green to orange to red as the idle share grows", () => {
    expect(barColor(0)).toBe("green");
    expect(barColor(0.19)).toBe("green");
    expect(barColor(0.2)).toBe("orange");
    expect(barColor(0.49)).toBe("orange");
    expect(barColor(0.5)).toBe("red");
    expect(barColor(1)).toBe("red");
  });
});

describe("dayShare", () => {
  it("is the idle part of the working time of the day", () => {
    expect(dayShare({ businessMs: 10 * HOUR, idleMs: 4 * HOUR })).toBe(0.4);
  });

  it("is zero for a day without working time", () => {
    expect(dayShare({ businessMs: 0, idleMs: 0 })).toBe(0);
  });
});

describe("dayBackground", () => {
  it("has no colour for a day with no idle time or no working time", () => {
    expect(dayBackground({ businessMs: 10 * HOUR, idleMs: 0 })).toBeUndefined();
    expect(dayBackground({ businessMs: 0, idleMs: 0 })).toBeUndefined();
  });

  it("gets stronger with more idle time", () => {
    const strength = (idleHours: number) =>
      Number(
        /(\d+)%/.exec(
          dayBackground({ businessMs: 10 * HOUR, idleMs: idleHours * HOUR }) ??
            "",
        )?.[1],
      );
    expect(strength(2)).toBeLessThan(strength(5));
    expect(strength(5)).toBeLessThan(strength(10));
  });
});
