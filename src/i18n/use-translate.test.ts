import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Language } from "./enums";
import { setLanguage } from "./instance";
import { useLanguage } from "./use-language";
import { useTranslate } from "./use-translate";

const greeting = {
  [Language.PtBr]: {
    hello: "Olá, {{name}}",
    tickets_one: "{{count}} chamado",
    tickets_other: "{{count}} chamados",
  },
  [Language.EnUs]: {
    hello: "Hello, {{name}}",
    tickets_one: "{{count}} ticket",
    tickets_other: "{{count}} tickets",
  },
};

const other = {
  [Language.PtBr]: { hello: "Outro" },
  [Language.EnUs]: { hello: "Another" },
};

describe("useTranslate", () => {
  it("gives the text in the active language, with the values filled in", () => {
    const { result } = renderHook(() => useTranslate(greeting));
    expect(result.current("hello", { name: "Helena" })).toBe("Olá, Helena");
  });

  it("does not escape the values it fills in", () => {
    const { result } = renderHook(() => useTranslate(greeting));
    expect(result.current("hello", { name: "A & B" })).toBe("Olá, A & B");
  });

  it("picks the singular or the plural form by the count", () => {
    const { result } = renderHook(() => useTranslate(greeting));
    expect(result.current("tickets", { count: 1 })).toBe("1 chamado");
    expect(result.current("tickets", { count: 3 })).toBe("3 chamados");
  });

  it("follows the language when it changes", async () => {
    const { result } = renderHook(() => useTranslate(greeting));
    await act(() => setLanguage(Language.EnUs));
    expect(result.current("hello", { name: "Helena" })).toBe("Hello, Helena");
    expect(result.current("tickets", { count: 1 })).toBe("1 ticket");
    expect(result.current("tickets", { count: 2 })).toBe("2 tickets");
  });

  it("keeps the texts of different components apart", () => {
    const { result } = renderHook(() => ({
      first: useTranslate(greeting),
      second: useTranslate(other),
    }));
    expect(result.current.first("hello", { name: "Ana" })).toBe("Olá, Ana");
    expect(result.current.second("hello")).toBe("Outro");
  });

  it("gives the same function while nothing changes", () => {
    const { result, rerender } = renderHook(() => useTranslate(greeting));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});

describe("useLanguage", () => {
  it("tells the active language and changes it", async () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe(Language.PtBr);
    await act(() => result.current.setLanguage(Language.EnUs));
    expect(result.current.language).toBe(Language.EnUs);
  });
});
