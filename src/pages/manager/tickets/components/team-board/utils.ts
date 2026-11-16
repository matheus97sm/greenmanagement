import type { Group } from "@/domain/types";
import { compareWorkload } from "@/domain/workload";
import type { Workload } from "@/domain/workload";

export interface Section {
  group: Group;
  workloads: Workload[];
}

export function sectionsOf(groups: Group[], workloads: Workload[]): Section[] {
  return groups
    .map((group) => ({
      group,
      workloads: workloads
        .filter((workload) => workload.consultant.grupo_id === group.id)
        .sort(compareWorkload),
    }))
    .filter((section) => section.workloads.length > 0)
    .sort((first, second) => first.group.nome.localeCompare(second.group.nome));
}

export function barValue(active: number, maxActive: number): number {
  return maxActive === 0 ? 0 : Math.round((active / maxActive) * 100);
}
