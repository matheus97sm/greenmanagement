import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadReadMarks, persistReadMarks, saveReadMarks } from "./readMarks";

const marks = { "ch-1": "2026-11-03T13:00:00.000Z" };

function fakeStore(initial: Record<string, string> = {}) {
  let lastRead = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => ({ lastRead }),
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    change(next: Record<string, string>) {
      lastRead = next;
      listeners.forEach((listener) => listener());
    },
    poke() {
      listeners.forEach((listener) => listener());
    },
    listenerCount: () => listeners.size,
  };
}

describe("read marks in storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("are empty when nothing was saved", () => {
    expect(loadReadMarks("helena")).toEqual({});
  });

  it("come back as they were saved", () => {
    saveReadMarks("helena", marks);
    expect(loadReadMarks("helena")).toEqual(marks);
  });

  it("belong to one person each", () => {
    saveReadMarks("helena", marks);
    expect(loadReadMarks("marina")).toEqual({});
    saveReadMarks("marina", { "ch-2": "2026-11-04T10:00:00.000Z" });
    expect(loadReadMarks("helena")).toEqual(marks);
  });

  it("are ignored when the stored text is not a map of dates", () => {
    for (const bad of ["not json", "[1,2]", "null", '{"a":1}', '"text"']) {
      localStorage.setItem("greenmanagement.read.helena", bad);
      expect(loadReadMarks("helena")).toEqual({});
    }
  });

  describe("when the browser refuses to use storage", () => {
    beforeEach(() => {
      const refuse = () => {
        throw new Error("blocked");
      };
      vi.stubGlobal("localStorage", {
        getItem: refuse,
        setItem: refuse,
        removeItem: refuse,
      });
    });

    it("loads as empty and saves without failing", () => {
      expect(loadReadMarks("helena")).toEqual({});
      expect(() => saveReadMarks("helena", marks)).not.toThrow();
    });
  });
});

describe("persistReadMarks", () => {
  beforeEach(() => localStorage.clear());

  it("saves the marks when they change", () => {
    const store = fakeStore();
    persistReadMarks("helena", store);
    store.change(marks);
    expect(loadReadMarks("helena")).toEqual(marks);
  });

  it("does not write when something else in the store changed", () => {
    const store = fakeStore(marks);
    persistReadMarks("helena", store);
    store.poke();
    expect(localStorage.getItem("greenmanagement.read.helena")).toBeNull();
  });

  it("keeps saving each new set of marks", () => {
    const store = fakeStore();
    persistReadMarks("helena", store);
    store.change(marks);
    const more = { ...marks, "ch-2": "2026-11-04T10:00:00.000Z" };
    store.change(more);
    expect(loadReadMarks("helena")).toEqual(more);
  });

  it("stops saving once it is stopped", () => {
    const store = fakeStore();
    const stop = persistReadMarks("helena", store);
    stop();
    expect(store.listenerCount()).toBe(0);
    store.change(marks);
    expect(loadReadMarks("helena")).toEqual({});
  });

  it("keeps what is stored when the store is cleared after it stopped", () => {
    saveReadMarks("helena", marks);
    const store = fakeStore(marks);
    const stop = persistReadMarks("helena", store);
    stop();
    store.change({});
    expect(loadReadMarks("helena")).toEqual(marks);
  });
});
