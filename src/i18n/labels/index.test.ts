import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Role } from "@/auth/enums";
import { Priority, Profile, Status } from "@/domain/enums";
import { Language } from "../enums";
import { setLanguage } from "../instance";
import { useLabels } from ".";

describe("useLabels", () => {
  it("names every status, priority, profile and role in Portuguese", () => {
    const { result } = renderHook(() => useLabels());
    expect(Object.values(Status).map(result.current.status)).toEqual([
      "Aberto",
      "Em atendimento",
      "Aguardando cliente",
      "Resolvido",
      "Fechado",
    ]);
    expect(Object.values(Priority).map(result.current.priority)).toEqual([
      "Baixa",
      "Média",
      "Alta",
      "Crítica",
    ]);
    expect(Object.values(Profile).map(result.current.profile)).toEqual([
      "Gestor",
      "Consultor",
      "Cliente",
    ]);
    expect(Object.values(Role).map(result.current.role)).toEqual([
      "Consultora",
      "Gestor",
      "Cliente",
    ]);
  });

  it("follows the language", async () => {
    const { result } = renderHook(() => useLabels());
    await act(() => setLanguage(Language.EnUs));
    expect(result.current.status(Status.WaitingCustomer)).toBe(
      "Waiting for customer",
    );
    expect(result.current.priority(Priority.Critical)).toBe("Critical");
    expect(result.current.profile(Profile.Manager)).toBe("Manager");
    expect(result.current.role(Role.Consultant)).toBe("Consultant");
  });

  it("gives the same labels while nothing changes", () => {
    const { result, rerender } = renderHook(() => useLabels());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
