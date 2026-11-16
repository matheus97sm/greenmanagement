export const WORKDAY_START_HOUR = 8;
export const WORKDAY_END_HOUR = 18;
export const WORKDAYS = 5;
export const UTC_OFFSET_HOURS = -3;
export const BUSINESS_TIME_ZONE = "America/Sao_Paulo";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export interface Interval {
  start: number;
  end: number;
}

export interface WeekRange {
  start: number;
  end: number;
  fullEnd: number;
}

export function startOfLocalDay(ts: number): number {
  const local = ts + UTC_OFFSET_HOURS * HOUR;
  return Math.floor(local / DAY) * DAY - UTC_OFFSET_HOURS * HOUR;
}

export function weekdayOf(ts: number): number {
  const days = Math.floor((ts + UTC_OFFSET_HOURS * HOUR) / DAY);
  return (((days + 3) % 7) + 7) % 7;
}

export function weekStart(ts: number): number {
  return startOfLocalDay(ts) - weekdayOf(ts) * DAY;
}

export function weekRange(now: number, weeksAgo = 0): WeekRange {
  const start = weekStart(now) - weeksAgo * 7 * DAY;
  const fullEnd = start + 7 * DAY;
  return { start, end: Math.min(now, fullEnd), fullEnd };
}

export function businessIntervals(from: number, to: number): Interval[] {
  const out: Interval[] = [];
  if (to <= from) return out;
  for (let day = startOfLocalDay(from); day < to; day += DAY) {
    if (weekdayOf(day) >= WORKDAYS) continue;
    const start = Math.max(day + WORKDAY_START_HOUR * HOUR, from);
    const end = Math.min(day + WORKDAY_END_HOUR * HOUR, to);
    if (end > start) out.push({ start, end });
  }
  return out;
}

export function mergeIntervals(list: Interval[]): Interval[] {
  const sorted = [...list]
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);
  const out: Interval[] = [];
  for (const interval of sorted) {
    const last = out.at(-1);
    if (last && interval.start <= last.end) {
      last.end = Math.max(last.end, interval.end);
    } else {
      out.push({ ...interval });
    }
  }
  return out;
}

export function intersectIntervals(a: Interval[], b: Interval[]): Interval[] {
  const out: Interval[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    const start = Math.max(a[i].start, b[j].start);
    const end = Math.min(a[i].end, b[j].end);
    if (end > start) out.push({ start, end });
    if (a[i].end < b[j].end) i += 1;
    else j += 1;
  }
  return out;
}

export function totalMs(list: Interval[]): number {
  return list.reduce((sum, i) => sum + (i.end - i.start), 0);
}
