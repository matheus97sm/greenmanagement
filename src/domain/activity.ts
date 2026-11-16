import { HistoryType, Status } from "./enums";
import { isActive } from "./status";
import type { HistoryEntry, Message, Ticket } from "./types";
import {
  businessIntervals,
  intersectIntervals,
  mergeIntervals,
  totalMs,
  WORKDAYS,
} from "./week";
import type { Interval, WeekRange } from "./week";

const DAY = 24 * 3_600_000;

export interface Held extends Interval {
  consultantId: string;
}

export interface DayIdle {
  businessMs: number;
  idleMs: number;
}

export interface ConsultantWeek {
  consultantId: string;
  businessMs: number;
  idleMs: number;
  days: DayIdle[];
  assigned: number;
  resolved: number;
  replies: number;
}

export interface TeamWeek {
  businessMs: number;
  idleMs: number;
  idleShare: number;
  assigned: number;
  resolved: number;
  replies: number;
}

const byTime = (a: HistoryEntry, b: HistoryEntry) =>
  a.ocorrido_em.localeCompare(b.ocorrido_em);

function activePeriods(
  ticket: Ticket,
  statusChanges: HistoryEntry[],
): Interval[] {
  const periods: Interval[] = [];
  const initial = statusChanges.length
    ? (statusChanges[0].de ?? Status.Open)
    : ticket.status;
  let openedAt: number | null = isActive(initial)
    ? Date.parse(ticket.aberto_em)
    : null;

  for (const change of statusChanges) {
    const at = Date.parse(change.ocorrido_em);
    const next = change.para as Status;
    if (openedAt !== null && !isActive(next)) {
      periods.push({ start: openedAt, end: at });
      openedAt = null;
    } else if (openedAt === null && isActive(next)) {
      openedAt = at;
    }
  }
  if (openedAt !== null) periods.push({ start: openedAt, end: Infinity });
  return periods;
}

export function heldIntervals(
  ticket: Ticket,
  history: HistoryEntry[] | undefined,
): Held[] {
  const entries = [...(history ?? [])].sort(byTime);
  const owners = entries.filter((h) => h.tipo === HistoryType.Assignment);
  if (owners.length === 0) return [];
  const active = activePeriods(
    ticket,
    entries.filter((h) => h.tipo === HistoryType.Status && h.para),
  );

  return owners.flatMap((owner, index) => {
    const start = Date.parse(owner.ocorrido_em);
    const next = owners[index + 1];
    const end = next ? Date.parse(next.ocorrido_em) : Infinity;
    return intersectIntervals([{ start, end }], active).map((i) => ({
      ...i,
      consultantId: owner.usuario_id,
    }));
  });
}

function idleWithin(window: Interval[], busy: Interval[]): DayIdle {
  const businessMs = totalMs(window);
  const covered = totalMs(intersectIntervals(window, busy));
  return { businessMs, idleMs: businessMs - covered };
}

export interface WeekInput {
  consultantIds: string[];
  tickets: Ticket[];
  history: Record<string, HistoryEntry[]>;
  messages: Record<string, Message[]>;
  range: WeekRange;
}

export function weekByConsultant({
  consultantIds,
  tickets,
  history,
  messages,
  range,
}: WeekInput): ConsultantWeek[] {
  const busy = new Map<string, Interval[]>(consultantIds.map((id) => [id, []]));
  for (const ticket of tickets) {
    for (const held of heldIntervals(ticket, history[ticket.id])) {
      busy.get(held.consultantId)?.push(held);
    }
  }

  const inRange = (iso: string) => {
    const at = Date.parse(iso);
    return at >= range.start && at < range.end;
  };

  const counts = new Map(
    consultantIds.map((id) => [id, { assigned: 0, resolved: 0, replies: 0 }]),
  );
  for (const entry of Object.values(history).flat()) {
    const stats = counts.get(entry.usuario_id);
    if (!stats || !inRange(entry.ocorrido_em)) continue;
    if (entry.tipo === HistoryType.Assignment) stats.assigned += 1;
    else if (entry.para === Status.Resolved) stats.resolved += 1;
  }
  for (const message of Object.values(messages).flat()) {
    const stats = counts.get(message.autor_id);
    if (stats && !message.interna && inRange(message.criada_em)) {
      stats.replies += 1;
    }
  }

  const week = businessIntervals(range.start, range.end);
  const dayWindows = Array.from({ length: WORKDAYS }, (_, day) =>
    businessIntervals(
      Math.max(range.start + day * DAY, range.start),
      Math.min(range.start + (day + 1) * DAY, range.end),
    ),
  );

  return consultantIds.map((consultantId) => {
    const merged = mergeIntervals(busy.get(consultantId) ?? []);
    const total = idleWithin(week, merged);
    return {
      consultantId,
      ...total,
      days: dayWindows.map((window) => idleWithin(window, merged)),
      ...counts.get(consultantId)!,
    };
  });
}

export function idleShare(week: { businessMs: number; idleMs: number }) {
  return week.businessMs === 0 ? 0 : week.idleMs / week.businessMs;
}

export function teamWeek(weeks: ConsultantWeek[]): TeamWeek {
  const totals = weeks.reduce(
    (sum, w) => ({
      businessMs: sum.businessMs + w.businessMs,
      idleMs: sum.idleMs + w.idleMs,
      assigned: sum.assigned + w.assigned,
      resolved: sum.resolved + w.resolved,
      replies: sum.replies + w.replies,
    }),
    { businessMs: 0, idleMs: 0, assigned: 0, resolved: 0, replies: 0 },
  );
  return { ...totals, idleShare: idleShare(totals) };
}
