import { SortKey } from "./enums";
import type { DayLabelKey, SortLabelKey } from "./types";

export const WEEKS_BACK = 8;
export const ALL_GROUPS = "all";
export const DAY_LABEL_KEYS: DayLabelKey[] = [
  "dayMonday",
  "dayTuesday",
  "dayWednesday",
  "dayThursday",
  "dayFriday",
];
export const IDLE_WARNING_SHARE = 0.2;
export const IDLE_HIGH_SHARE = 0.5;

export const SORT_LABEL_KEY: Record<SortKey, SortLabelKey> = {
  [SortKey.Idle]: "sortIdle",
  [SortKey.Resolved]: "sortResolved",
  [SortKey.Assigned]: "sortAssigned",
  [SortKey.Replies]: "sortReplies",
  [SortKey.Name]: "sortName",
};
