import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rawData } from "@/test-data";

function stubFetch() {
  const stub = vi.fn().mockResolvedValue({
    json: async () => structuredClone(rawData),
  });
  vi.stubGlobal("fetch", stub);
  return stub;
}

describe("ensureDb", () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is not available before it is loaded", async () => {
    const { getDb } = await import("./db");
    expect(() => getDb()).toThrow();
  });

  it("loads dados.json once, even when asked several times at the same time", async () => {
    const fetchStub = stubFetch();
    const { ensureDb, getDb } = await import("./db");

    const [first, second] = await Promise.all([ensureDb(), ensureDb()]);

    expect(fetchStub).toHaveBeenCalledTimes(1);
    expect(first).toBe(second);
    expect(getDb()).toBe(first);
    expect(first.chamados).toHaveLength(rawData.chamados.length);
  });

  it("does not fetch again once the data is loaded", async () => {
    const fetchStub = stubFetch();
    const { ensureDb } = await import("./db");

    await ensureDb();
    await ensureDb();

    expect(fetchStub).toHaveBeenCalledTimes(1);
  });

  it("uses data that was already installed, without fetching", async () => {
    const fetchStub = stubFetch();
    const { ensureDb, initDb } = await import("./db");

    const installed = initDb(rawData);

    expect(await ensureDb()).toBe(installed);
    expect(fetchStub).not.toHaveBeenCalled();
  });
});
