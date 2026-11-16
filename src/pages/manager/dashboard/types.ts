import type { ConsultantWeek } from "@/domain/activity";
import type { Person } from "@/domain/types";
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
