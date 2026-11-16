import { idleShare, weekByConsultant } from "@/domain/activity";
import { BUSINESS_TIME_ZONE, weekRange } from "@/domain/week";
import { workloadByConsultant } from "@/domain/workload";
import { formatDayMonth } from "@/lib/format";
import { DAY_LABELS, WEEKS_BACK } from "./constants";
import { SortKey } from "./enums";
import type { BuildRowsInput, Row, WeekOption } from "./types";

const DAY = 24 * 3_600_000;

const dayMonth = (timestamp: number) =>
  formatDayMonth(timestamp, BUSINESS_TIME_ZONE);

export function weekOptions(now: number, count = WEEKS_BACK): WeekOption[] {
  return Array.from({ length: count }, (_, ago) => {
    const { start } = weekRange(now, ago);
    const period = `${dayMonth(start)} a ${dayMonth(start + 6 * DAY)}`;
    const label =
      ago === 0
        ? `Esta semana (${period})`
        : ago === 1
          ? `Semana passada (${period})`
          : `Semana de ${period}`;
    return { value: String(ago), label };
  });
}

export function dayHeaders(weekStartTs: number): string[] {
  return DAY_LABELS.map(
    (label, day) => `${label} ${dayMonth(weekStartTs + day * DAY)}`,
  );
}

const byName = (firstRow: Row, row: Row) =>
  firstRow.consultant.nome.localeCompare(row.consultant.nome);

export function sortRows(rows: Row[], key: SortKey): Row[] {
  const sorted = [...rows];
  switch (key) {
    case SortKey.Idle:
      return sorted.sort(
        (firstRow, row) =>
          idleShare(row.week) - idleShare(firstRow.week) ||
          row.week.idleMs - firstRow.week.idleMs ||
          byName(firstRow, row),
      );
    case SortKey.Resolved:
      return sorted.sort(
        (firstRow, row) =>
          row.week.resolved - firstRow.week.resolved || byName(firstRow, row),
      );
    case SortKey.Assigned:
      return sorted.sort(
        (firstRow, row) =>
          row.week.assigned - firstRow.week.assigned || byName(firstRow, row),
      );
    case SortKey.Replies:
      return sorted.sort(
        (firstRow, row) =>
          row.week.replies - firstRow.week.replies || byName(firstRow, row),
      );
    case SortKey.Name:
      return sorted.sort(byName);
  }
}

export function mostIdle(rows: Row[]): Row | undefined {
  return sortRows(rows, SortKey.Idle).find((row) => row.week.idleMs > 0);
}

export function buildRows({
  consultants,
  tickets,
  history,
  messages,
  groups,
  range,
  now,
}: BuildRowsInput): Row[] {
  const weeks = weekByConsultant({
    consultantIds: consultants.map((person) => person.id),
    tickets,
    history,
    messages,
    range,
  });
  const workloads = workloadByConsultant(tickets, consultants, now);
  return consultants.map((consultant, index) => ({
    consultant,
    groupName: groups[consultant.grupo_id ?? ""]?.nome ?? "",
    week: weeks[index],
    workload: workloads[index],
  }));
}
