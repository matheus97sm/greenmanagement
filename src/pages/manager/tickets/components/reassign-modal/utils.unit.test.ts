import { describe, expect, it } from "vitest";
import { consultantsOf, workloadByConsultant } from "@/domain/workload";
import { rawData } from "@/test-data";
import { groupsOfSelection, targetOptions } from "./utils";

const NOW = Date.parse(rawData.meta.agora);
const workloads = workloadByConsultant(
  rawData.chamados,
  consultantsOf(
    rawData.usuarios,
    rawData.grupos.map((g) => g.id),
  ),
  NOW,
);
const apps = rawData.grupos.find((g) => g.nome === "Aplicações")!;

describe("groupsOfSelection", () => {
  it("lists each group once", () => {
    const [a, b] = rawData.chamados.filter((t) => t.grupo_id === apps.id);
    const other = rawData.chamados.find((t) => t.grupo_id !== apps.id)!;
    expect(groupsOfSelection([a, b])).toEqual([apps.id]);
    expect(groupsOfSelection([a, other])).toEqual([apps.id, other.grupo_id]);
  });
});

describe("targetOptions", () => {
  const options = targetOptions(workloads, apps.id);

  it("offers only the consultants of that group", () => {
    expect(options).toHaveLength(6);
    expect(options.map((o) => o.label).join()).not.toContain("Marina");
  });

  it("starts with the least loaded and shows each person's load", () => {
    expect(options[0].label).toBe("Leandro Alves · 0 chamados");
    expect(options[1].label).toBe("Fernanda Carvalho · 9 chamados");
  });

  it("uses the singular for a single ticket", () => {
    const one = workloads.map((w) => ({ ...w, active: 1 }));
    expect(targetOptions(one, apps.id)[0].label).toMatch(/· 1 chamado$/);
  });
});
