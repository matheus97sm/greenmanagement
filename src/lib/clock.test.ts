import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { anchorClock, now, nowIso, resetClock } from "./clock";

const REAL = Date.parse("2026-11-16T12:00:00Z");
const SIMULATED = "2026-11-03T13:00:00.000Z";

describe("the simulated clock", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(REAL);
    resetClock();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetClock();
  });

  it("is the real time until it is anchored", () => {
    expect(now()).toBe(REAL);
  });

  it("starts from the anchored instant", () => {
    anchorClock(SIMULATED);
    expect(now()).toBe(Date.parse(SIMULATED));
  });

  it("keeps running in real time from the anchor", () => {
    anchorClock(SIMULATED);
    vi.advanceTimersByTime(90_000);
    expect(now()).toBe(Date.parse(SIMULATED) + 90_000);
  });

  it("keeps the first anchor and ignores later ones", () => {
    anchorClock(SIMULATED);
    vi.advanceTimersByTime(10_000);
    anchorClock("2030-01-01T00:00:00.000Z");
    expect(now()).toBe(Date.parse(SIMULATED) + 10_000);
  });

  it("can be anchored again after a reset", () => {
    anchorClock(SIMULATED);
    resetClock();
    expect(now()).toBe(REAL);
    anchorClock("2026-12-01T09:00:00.000Z");
    expect(now()).toBe(Date.parse("2026-12-01T09:00:00.000Z"));
  });

  it("writes the simulated time as an ISO string", () => {
    anchorClock(SIMULATED);
    expect(nowIso()).toBe(SIMULATED);
  });
});
