import { idleShare, weekByConsultant } from "@/domain/activity";
import { BUSINESS_TIME_ZONE, weekRange } from "@/domain/week";
import { workloadByConsultant } from "@/domain/workload";
import { formatDayMonth } from "@/lib/format";
import { DAY_LABELS, WEEKS_BACK } from "./constants";
import { SortKey } from "./enums";
import type { BuildRowsInput, Row, WeekOption } from "./types";

const DAY = 24 * 3_600_000;

const dayMonth = (ts: number) => formatDayMonth(ts, BUSINESS_TIME_ZONE);

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

const byName = (a: Row, b: Row) =>
  a.consultant.nome.localeCompare(b.consultant.nome);

export function sortRows(rows: Row[], key: SortKey): Row[] {
  const sorted = [...rows];
  switch (key) {
    case SortKey.Idle:
      return sorted.sort(
        (a, b) =>
          idleShare(b.week) - idleShare(a.week) ||
          b.week.idleMs - a.week.idleMs ||
          byName(a, b),
      );
    case SortKey.Resolved:
      return sorted.sort(
        (a, b) => b.week.resolved - a.week.resolved || byName(a, b),
      );
    case SortKey.Assigned:
      return sorted.sort(
        (a, b) => b.week.assigned - a.week.assigned || byName(a, b),
      );
    case SortKey.Replies:
      return sorted.sort(
        (a, b) => b.week.replies - a.week.replies || byName(a, b),
      );
    case SortKey.Name:
      return sorted.sort(byName);
  }
}

export function mostIdle(rows: Row[]): Row | undefined {
  return sortRows(rows, SortKey.Idle).find((r) => r.week.idleMs > 0);
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
    consultantIds: consultants.map((c) => c.id),
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
