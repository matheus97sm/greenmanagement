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

export function startOfLocalDay(timestamp: number): number {
  const local = timestamp + UTC_OFFSET_HOURS * HOUR;
  return Math.floor(local / DAY) * DAY - UTC_OFFSET_HOURS * HOUR;
}

export function weekdayOf(timestamp: number): number {
  const days = Math.floor((timestamp + UTC_OFFSET_HOURS * HOUR) / DAY);
  return (((days + 3) % 7) + 7) % 7;
}

export function weekStart(timestamp: number): number {
  return startOfLocalDay(timestamp) - weekdayOf(timestamp) * DAY;
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
    .filter((interval) => interval.end > interval.start)
    .sort((firstInterval, interval) => firstInterval.start - interval.start);
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

export function intersectIntervals(
  firstIntervals: Interval[],
  intervals: Interval[],
): Interval[] {
  const out: Interval[] = [];
  let index = 0;
  let otherIndex = 0;
  while (index < firstIntervals.length && otherIndex < intervals.length) {
    const start = Math.max(
      firstIntervals[index].start,
      intervals[otherIndex].start,
    );
    const end = Math.min(firstIntervals[index].end, intervals[otherIndex].end);
    if (end > start) out.push({ start, end });
    if (firstIntervals[index].end < intervals[otherIndex].end) index += 1;
    else otherIndex += 1;
  }
  return out;
}

export function totalMs(list: Interval[]): number {
  return list.reduce(
    (sum, interval) => sum + (interval.end - interval.start),
    0,
  );
}
