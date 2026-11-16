import type { Ticket } from "@/domain/types";
import type { Workload } from "@/domain/workload";
import type { TargetOption } from "./types";

export function groupsOfSelection(tickets: Ticket[]): string[] {
  return [...new Set(tickets.map((t) => t.grupo_id))];
}

export function targetOptions(
  workloads: Workload[],
  groupId: string,
): TargetOption[] {
  return workloads
    .filter((w) => w.consultant.grupo_id === groupId)
    .sort(
      (a, b) =>
        a.active - b.active ||
        a.consultant.nome.localeCompare(b.consultant.nome),
    )
    .map((w) => ({
      value: w.consultant.id,
      label: `${w.consultant.nome} · ${w.active} ${w.active === 1 ? "chamado" : "chamados"}`,
    }));
}
