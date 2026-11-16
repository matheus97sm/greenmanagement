import { describe, expect, it } from "vitest";
import { consultantsOf, workloadByConsultant } from "@/domain/workload";
import { rawData } from "@/test-data";
import { groupsOfSelection, targetOptions } from "./utils";

const NOW = Date.parse(rawData.meta.agora);
const workloads = workloadByConsultant(
  rawData.chamados,
  consultantsOf(
    rawData.usuarios,
    rawData.grupos.map((group) => group.id),
  ),
  NOW,
);
const apps = rawData.grupos.find((group) => group.nome === "Aplicações")!;

describe("groupsOfSelection", () => {
  it("lists each group once", () => {
    const [firstTicket, ticket] = rawData.chamados.filter(
      (currentTicket) => currentTicket.grupo_id === apps.id,
    );
    const other = rawData.chamados.find(
      (currentTicket) => currentTicket.grupo_id !== apps.id,
    )!;
    expect(groupsOfSelection([firstTicket, ticket])).toEqual([apps.id]);
    expect(groupsOfSelection([firstTicket, other])).toEqual([
      apps.id,
      other.grupo_id,
    ]);
  });
});

describe("targetOptions", () => {
  const options = targetOptions(workloads, apps.id);

  it("offers only the consultants of that group", () => {
    expect(options).toHaveLength(6);
    expect(
      options.map((targetOption) => targetOption.label).join(),
    ).not.toContain("Marina");
  });

  it("starts with the least loaded and shows each person's load", () => {
    expect(options[0].label).toBe("Leandro Alves · 0 chamados");
    expect(options[1].label).toBe("Fernanda Carvalho · 9 chamados");
  });

  it("uses the singular for a single ticket", () => {
    const one = workloads.map((workload) => ({ ...workload, active: 1 }));
    expect(targetOptions(one, apps.id)[0].label).toMatch(/· 1 chamado$/);
  });
});
