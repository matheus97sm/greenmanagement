import type { ConsultantWeek } from "@/domain/activity";
import type {
  Group,
  HistoryEntry,
  Message,
  Person,
  Ticket,
} from "@/domain/types";
import type { WeekRange } from "@/domain/week";
import type { Workload } from "@/domain/workload";

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
