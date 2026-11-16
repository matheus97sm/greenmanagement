import { describe, expect, it } from "vitest";
import { lastItems } from "./list";

const items = Array.from({ length: 10 }, (_, index) => index + 1);

describe("lastItems", () => {
  it("returns everything when it fits", () => {
    const result = lastItems(items, 100);
    expect(result.hidden).toBe(0);
    expect(result.visible).toBe(items);
  });

  it("returns everything when it fits exactly", () => {
    expect(lastItems(items, 10)).toEqual({ hidden: 0, visible: items });
  });

  it("keeps only the most recent items and counts the hidden ones", () => {
    const result = lastItems(items, 4);
    expect(result.hidden).toBe(6);
    expect(result.visible).toEqual([7, 8, 9, 10]);
  });

  it("does not change the list it was given", () => {
    lastItems(items, 3);
    expect(items).toHaveLength(10);
  });

  it("works for an empty list", () => {
    expect(lastItems([], 5)).toEqual({ hidden: 0, visible: [] });
  });
});
