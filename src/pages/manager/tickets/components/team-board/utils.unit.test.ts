import { describe, expect, it } from "vitest";
import { LoadLevel, Profile } from "@/domain/enums";
import type { Group } from "@/domain/types";
import type { Workload } from "@/domain/workload";
import { barValue, sectionsOf } from "./utils";

const group = (id: string, nome: string): Group => ({
  id,
  nome,
  gestor_id: "m",
});

const workload = (
  id: string,
  groupId: string,
  overrides: Partial<Workload> = {},
): Workload => ({
  consultant: {
    id,
    nome: id,
    email: "",
    perfil: Profile.Consultant,
    locale: "pt-BR",
    zoneinfo: "America/Sao_Paulo",
    grupo_id: groupId,
  },
  active: 5,
  waitingCustomer: 0,
  breached: 0,
  atRisk: 0,
  level: LoadLevel.Normal,
  ...overrides,
});

describe("sectionsOf", () => {
  it("splits the team by group, groups in alphabetical order", () => {
    const sections = sectionsOf(
      [group("g2", "Redes"), group("g1", "Aplicações")],
      [workload("a", "g1"), workload("b", "g2"), workload("c", "g1")],
    );
    expect(sections.map((section) => section.group.nome)).toEqual([
      "Aplicações",
      "Redes",
    ]);
    expect(
      sections[0].workloads.map(
        (currentWorkload) => currentWorkload.consultant.id,
      ),
    ).toEqual(["a", "c"]);
  });

  it("puts the people who need attention first inside a group", () => {
    const [section] = sectionsOf(
      [group("g1", "Redes")],
      [
        workload("calm", "g1"),
        workload("idle", "g1", { active: 0, level: LoadLevel.Idle }),
        workload("late", "g1", { breached: 2 }),
      ],
    );
    expect(
      section.workloads.map((currentWorkload) => currentWorkload.consultant.id),
    ).toEqual(["idle", "late", "calm"]);
  });

  it("leaves out groups with nobody in them", () => {
    expect(sectionsOf([group("g1", "Redes")], [])).toEqual([]);
  });
});

describe("barValue", () => {
  it("scales the load against the busiest consultant", () => {
    expect(barValue(75, 75)).toBe(100);
    expect(barValue(30, 60)).toBe(50);
    expect(barValue(0, 60)).toBe(0);
  });

  it("is zero when nobody has anything", () => {
    expect(barValue(0, 0)).toBe(0);
  });
});
