import type { ConsultantWeek } from "@/domain/activity";
import type {
  Group,
  HistoryEntry,
  Message,
  Person,
  Ticket,
} from "@/domain/types";
import type { WeekRange } from "@/domain/week";
import type { Language, Translate } from "@/i18n";
import type { Workload } from "@/domain/workload";
import type { locales } from "./locales";

export type DashboardTranslate = Translate<(typeof locales)[Language.PtBr]>;

export type SortLabelKey =
  "sortIdle" | "sortResolved" | "sortAssigned" | "sortReplies" | "sortName";

export type DayLabelKey =
  "dayMonday" | "dayTuesday" | "dayWednesday" | "dayThursday" | "dayFriday";

export interface Row {
  consultant: Person;
  groupName: string;
  week: ConsultantWeek;
  workload: Workload;
}

export interface WeekOption {
  value: string;
  label: string;
}

export interface BuildRowsInput {
  consultants: Person[];
  tickets: Ticket[];
  history: Record<string, HistoryEntry[]>;
  messages: Record<string, Message[]>;
  groups: Record<string, Group>;
  range: WeekRange;
  now: number;
}
