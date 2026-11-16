import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from "./constants";
import { Language } from "./enums";
import { isLanguage, loadLanguage, saveLanguage } from "./storage";

describe("language storage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("recognises only the supported languages", () => {
    expect(isLanguage(Language.PtBr)).toBe(true);
    expect(isLanguage(Language.EnUs)).toBe(true);
    expect(isLanguage("fr-FR")).toBe(false);
    expect(isLanguage(null)).toBe(false);
  });

  it("starts in the default language when nothing was chosen", () => {
    expect(loadLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it("gives back the language that was saved", () => {
    saveLanguage(Language.EnUs);
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(Language.EnUs);
    expect(loadLanguage()).toBe(Language.EnUs);
  });

  it("ignores a stored value that is not a supported language", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "klingon");
    expect(loadLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it("falls back to the default when the storage refuses to be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadLanguage()).toBe(DEFAULT_LANGUAGE);
  });

  it("does not break when the storage refuses to be written", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveLanguage(Language.EnUs)).not.toThrow();
  });
});
