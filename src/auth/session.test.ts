import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MARINA_ID } from "@/test-data";
import {
  clearSession,
  getSessionUser,
  saveSession,
  SESSION_KEY,
} from "./session";

describe("session", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("has no user when nothing was saved", () => {
    expect(getSessionUser()).toBeNull();
  });

  it("gives back the user that was saved", () => {
    saveSession(MARINA_ID);
    expect(localStorage.getItem(SESSION_KEY)).toBe(MARINA_ID);
    expect(getSessionUser()?.name).toBe("Marina Almeida");
  });

  it("has no user for an id that does not belong to anyone", () => {
    saveSession("someone-else");
    expect(getSessionUser()).toBeNull();
  });

  it("forgets the user when the session is cleared", () => {
    saveSession(MARINA_ID);
    clearSession();
    expect(getSessionUser()).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
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

    it("reads as signed out instead of failing", () => {
      expect(getSessionUser()).toBeNull();
    });

    it("saves and clears without failing", () => {
      expect(() => saveSession(MARINA_ID)).not.toThrow();
      expect(() => clearSession()).not.toThrow();
    });
  });
});
