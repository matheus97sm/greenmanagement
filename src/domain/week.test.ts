import { describe, expect, it } from "vitest";
import {
  businessIntervals,
  intersectIntervals,
  mergeIntervals,
  startOfLocalDay,
  totalMs,
  weekdayOf,
  weekRange,
  weekStart,
} from "./week";

const HOUR = 3_600_000;
const utc = (iso: string) => Date.parse(iso);
const hoursOf = (ms: number) => ms / HOUR;

describe("startOfLocalDay", () => {
  it("returns midnight in Brasília time, which is 03:00 UTC", () => {
    expect(startOfLocalDay(utc("2026-11-03T13:00:00Z"))).toBe(
      utc("2026-11-03T03:00:00Z"),
    );
  });

  it("still belongs to the previous day before 03:00 UTC", () => {
    expect(startOfLocalDay(utc("2026-11-03T02:30:00Z"))).toBe(
      utc("2026-11-02T03:00:00Z"),
    );
  });
});

describe("weekdayOf", () => {
  it("counts from Monday as zero", () => {
    expect(weekdayOf(utc("2026-11-02T15:00:00Z"))).toBe(0);
    expect(weekdayOf(utc("2026-11-03T15:00:00Z"))).toBe(1);
    expect(weekdayOf(utc("2026-11-06T15:00:00Z"))).toBe(4);
    expect(weekdayOf(utc("2026-11-07T15:00:00Z"))).toBe(5);
    expect(weekdayOf(utc("2026-11-08T15:00:00Z"))).toBe(6);
  });

  it("uses the local day, so late Sunday night in Brasília is still Sunday", () => {
    expect(weekdayOf(utc("2026-11-09T01:00:00Z"))).toBe(6);
    expect(weekdayOf(utc("2026-11-09T04:00:00Z"))).toBe(0);
  });
});

describe("weekStart", () => {
  it("is Monday at local midnight", () => {
    expect(weekStart(utc("2026-11-03T13:00:00Z"))).toBe(
      utc("2026-11-02T03:00:00Z"),
    );
    expect(weekStart(utc("2026-11-08T20:00:00Z"))).toBe(
      utc("2026-11-02T03:00:00Z"),
    );
  });
});

describe("weekRange", () => {
  const now = utc("2026-11-03T13:00:00Z");

  it("runs from Monday until now for the current week", () => {
    const range = weekRange(now);
    expect(range.start).toBe(utc("2026-11-02T03:00:00Z"));
    expect(range.end).toBe(now);
    expect(range.fullEnd).toBe(utc("2026-11-09T03:00:00Z"));
  });

  it("covers a whole past week", () => {
    const range = weekRange(now, 1);
    expect(range.start).toBe(utc("2026-10-26T03:00:00Z"));
    expect(range.end).toBe(utc("2026-11-02T03:00:00Z"));
    expect(range.end).toBe(range.fullEnd);
  });
});

describe("businessIntervals", () => {
  it("gives ten hours a day, Monday to Friday, from 8h to 18h local time", () => {
    const week = weekRange(utc("2026-11-10T12:00:00Z"), 1);
    const list = businessIntervals(week.start, week.end);
    expect(list).toHaveLength(5);
    expect(hoursOf(totalMs(list))).toBe(50);
    expect(list[0]).toEqual({
      start: utc("2026-11-02T11:00:00Z"),
      end: utc("2026-11-02T21:00:00Z"),
    });
  });

  it("skips the weekend", () => {
    const list = businessIntervals(
      utc("2026-11-07T03:00:00Z"),
      utc("2026-11-09T03:00:00Z"),
    );
    expect(list).toEqual([]);
  });

  it("stops at the end of the window", () => {
    const list = businessIntervals(
      utc("2026-11-02T03:00:00Z"),
      utc("2026-11-03T13:00:00Z"),
    );
    expect(hoursOf(totalMs(list))).toBe(10 + 2);
    expect(list.at(-1)?.end).toBe(utc("2026-11-03T13:00:00Z"));
  });

  it("starts in the middle of the day when the window does", () => {
    const list = businessIntervals(
      utc("2026-11-02T15:00:00Z"),
      utc("2026-11-02T23:00:00Z"),
    );
    expect(list).toEqual([
      { start: utc("2026-11-02T15:00:00Z"), end: utc("2026-11-02T21:00:00Z") },
    ]);
  });

  it("is empty for an empty window", () => {
    expect(businessIntervals(100, 100)).toEqual([]);
    expect(businessIntervals(200, 100)).toEqual([]);
  });
});

describe("mergeIntervals", () => {
  it("joins overlapping and touching intervals and sorts them", () => {
    expect(
      mergeIntervals([
        { start: 10, end: 20 },
        { start: 0, end: 5 },
        { start: 15, end: 30 },
        { start: 5, end: 8 },
      ]),
    ).toEqual([
      { start: 0, end: 8 },
      { start: 10, end: 30 },
    ]);
  });

  it("drops empty intervals and does not change its input", () => {
    const input = [
      { start: 5, end: 5 },
      { start: 1, end: 2 },
    ];
    expect(mergeIntervals(input)).toEqual([{ start: 1, end: 2 }]);
    expect(input[0]).toEqual({ start: 5, end: 5 });
  });
});

describe("intersectIntervals", () => {
  it("keeps only the time both lists cover", () => {
    expect(
      intersectIntervals(
        [
          { start: 0, end: 10 },
          { start: 20, end: 30 },
        ],
        [
          { start: 5, end: 25 },
          { start: 28, end: 40 },
        ],
      ),
    ).toEqual([
      { start: 5, end: 10 },
      { start: 20, end: 25 },
      { start: 28, end: 30 },
    ]);
  });

  it("is empty when nothing overlaps", () => {
    expect(
      intersectIntervals([{ start: 0, end: 5 }], [{ start: 5, end: 9 }]),
    ).toEqual([]);
  });
});

describe("totalMs", () => {
  it("adds up the lengths", () => {
    expect(
      totalMs([
        { start: 0, end: 4 },
        { start: 10, end: 11 },
      ]),
    ).toBe(5);
  });
});
