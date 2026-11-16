import type { DayIdle } from "@/domain/activity";
import { IDLE_HIGH_SHARE, IDLE_WARNING_SHARE } from "../../constants";

export function barColor(share: number): string {
  if (share >= IDLE_HIGH_SHARE) return "red";
  if (share >= IDLE_WARNING_SHARE) return "orange";
  return "green";
}

export function dayShare(day: DayIdle): number {
  return day.businessMs === 0 ? 0 : day.idleMs / day.businessMs;
}

export function dayBackground(day: DayIdle): string | undefined {
  const share = dayShare(day);
  if (day.businessMs === 0 || share === 0) return undefined;
  return `color-mix(in srgb, var(--mantine-color-red-6) ${Math.round(share * 38)}%, transparent)`;
}
