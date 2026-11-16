import { describe, expect, it } from "vitest";
import { ApiErrorCode } from "@/domain/enums";
import { Language } from "../enums";
import { setLanguage } from "../instance";
import { ERROR_KEY } from "./constants";
import { translateError } from ".";
import { locales } from "./locales";

describe("translateError", () => {
  it("says what the server refused, in the active language", async () => {
    const error = { code: ApiErrorCode.NotYourTicket };
    expect(translateError(error)).toBe("Este chamado não é seu.");
    await setLanguage(Language.EnUs);
    expect(translateError(error)).toBe("This ticket is not yours.");
  });

  it("fills in the values that come with the error", async () => {
    const error = {
      code: ApiErrorCode.TicketTakenByPerson,
      params: { name: "Rafael" },
    };
    expect(translateError(error)).toBe("Este chamado já foi pego por Rafael.");
    await setLanguage(Language.EnUs);
    expect(translateError(error)).toBe(
      "This ticket was already taken by Rafael.",
    );
  });

  it("does not leak what it does not understand", async () => {
    expect(translateError(new Error("boom"))).toBe("Erro inesperado.");
    expect(translateError({ code: "something_else" })).toBe("Erro inesperado.");
    expect(translateError("boom")).toBe("Erro inesperado.");
    expect(translateError(null)).toBe("Erro inesperado.");
    await setLanguage(Language.EnUs);
    expect(translateError(undefined)).toBe("Unexpected error.");
  });

  it("has a text, in both languages, for every error code", () => {
    for (const code of Object.values(ApiErrorCode)) {
      const key = ERROR_KEY[code];
      expect(locales[Language.PtBr][key]).toBeTruthy();
      expect(locales[Language.EnUs][key]).toBeTruthy();
    }
  });
});
