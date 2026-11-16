import { describe, expect, it } from "vitest";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from "./constants";
import { Language } from "./enums";
import { i18next, setLanguage } from "./instance";

describe("setLanguage", () => {
  it("starts in the default language", () => {
    expect(i18next.language).toBe(DEFAULT_LANGUAGE);
  });

  it("changes the active language, remembers it and tells the document", async () => {
    await setLanguage(Language.EnUs);
    expect(i18next.language).toBe(Language.EnUs);
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe(Language.EnUs);
    expect(document.documentElement.lang).toBe(Language.EnUs);
  });

  it("goes back to the default language", async () => {
    await setLanguage(Language.EnUs);
    await setLanguage(Language.PtBr);
    expect(i18next.language).toBe(Language.PtBr);
    expect(document.documentElement.lang).toBe(Language.PtBr);
  });
});
