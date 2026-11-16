import type { Language } from "@/i18n";
import { idleShare, weekByConsultant } from "@/domain/activity";
import { BUSINESS_TIME_ZONE, weekRange } from "@/domain/week";
import { workloadByConsultant } from "@/domain/workload";
import { formatDayMonth } from "@/lib/format";
import { DAY_LABEL_KEYS, WEEKS_BACK } from "./constants";
import { SortKey } from "./enums";
import type {
  BuildRowsInput,
  DashboardTranslate,
  Row,
  WeekOption,
} from "./types";

const DAY = 24 * 3_600_000;

const dayMonth = (timestamp: number, language: Language) =>
  formatDayMonth(timestamp, BUSINESS_TIME_ZONE, language);

export function weekOptions(
  now: number,
  translate: DashboardTranslate,
  language: Language,
  count = WEEKS_BACK,
): WeekOption[] {
  return Array.from({ length: count }, (_, ago) => {
    const { start } = weekRange(now, ago);
    const period = translate("period", {
      start: dayMonth(start, language),
      end: dayMonth(start + 6 * DAY, language),
    });
    const key = ago === 0 ? "thisWeek" : ago === 1 ? "lastWeek" : "weekOf";
    return { value: String(ago), label: translate(key, { period }) };
  });
}

export function dayHeaders(
  weekStartTs: number,
  translate: DashboardTranslate,
  language: Language,
): string[] {
  return DAY_LABEL_KEYS.map((key, day) =>
    translate("dayHeader", {
      day: translate(key),
      date: dayMonth(weekStartTs + day * DAY, language),
    }),
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
