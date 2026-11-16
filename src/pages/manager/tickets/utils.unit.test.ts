import { describe, expect, it } from "vitest";
import { rawData } from "@/test-data";
import { ALL_GROUPS } from "./constants";
import { filterByGroup } from "./utils";

const [infra, apps] = rawData.grupos;

describe("filterByGroup", () => {
  it("keeps everything when no group is picked", () => {
    expect(filterByGroup(rawData.chamados, ALL_GROUPS)).toBe(rawData.chamados);
  });

  it("keeps only the tickets of the chosen group", () => {
    const result = filterByGroup(rawData.chamados, infra.id);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThan(rawData.chamados.length);
    expect(result.every((t) => t.grupo_id === infra.id)).toBe(true);
    expect(
      filterByGroup(rawData.chamados, apps.id).length + result.length,
    ).toBe(rawData.chamados.length);
  });
});
