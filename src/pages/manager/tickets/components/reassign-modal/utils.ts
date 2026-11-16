import type { Language, Translate } from "@/i18n";
import type { Ticket } from "@/domain/types";
import type { Workload } from "@/domain/workload";
import type { locales } from "./locales";
import type { TargetOption } from "./types";

export function groupsOfSelection(tickets: Ticket[]): string[] {
  return [...new Set(tickets.map((ticket) => ticket.grupo_id))];
}

export function targetOptions(
  workloads: Workload[],
  groupId: string,
  translate: Translate<(typeof locales)[Language.PtBr]>,
): TargetOption[] {
  return workloads
    .filter((workload) => workload.consultant.grupo_id === groupId)
    .sort(
      (firstWorkload, workload) =>
        firstWorkload.active - workload.active ||
        firstWorkload.consultant.nome.localeCompare(workload.consultant.nome),
    )
    .map((workload) => ({
      value: workload.consultant.id,
      label: translate("option", {
        name: workload.consultant.nome,
        count: workload.active,
      }),
    }));
}
