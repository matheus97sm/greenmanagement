import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { anchorClock, resetClock } from "@/lib/clock";
import { useNow } from "./useNow";

const SIMULATED = "2026-11-03T13:00:00.000Z";

describe("useNow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2026-11-16T12:00:00Z"));
    resetClock();
    anchorClock(SIMULATED);
  });

  afterEach(() => {
    vi.useRealTimers();
    resetClock();
  });

  it("starts at the simulated time", () => {
    const { result } = renderHook(() => useNow());
    expect(result.current).toBe(Date.parse(SIMULATED));
  });

  it("moves forward every interval", () => {
    const { result } = renderHook(() => useNow(1000));
    const start = result.current;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current - start).toBe(1000);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current - start).toBe(3000);
  });

  it("refreshes every 30 seconds unless told otherwise", () => {
    const { result } = renderHook(() => useNow());
    const start = result.current;
    act(() => {
      vi.advanceTimersByTime(29_999);
    });
    expect(result.current).toBe(start);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current - start).toBe(30_000);
  });

  it("stops its timer when the component goes away", () => {
    const { unmount } = renderHook(() => useNow(1000));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("restarts the timer when the interval changes", () => {
    const { result, rerender } = renderHook(({ ms }) => useNow(ms), {
      initialProps: { ms: 1000 },
    });
    rerender({ ms: 5000 });
    const start = result.current;
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(start);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current - start).toBe(5000);
  });
});
