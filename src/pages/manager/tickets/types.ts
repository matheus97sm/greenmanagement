import type { Person, Ticket } from "@/domain/types";
import type { FocusKind } from "./enums";

export type Focus =
  | { kind: FocusKind.Risk }
  | { kind: FocusKind.Unassigned }
  | { kind: FocusKind.Consultant; consultantId: string };

export interface FindInput {
  tickets: Ticket[];
  term: string;
  people: Record<string, Person>;
  now: number;
  groupId: string;
}

export interface InFocusInput {
  focus: Focus;
  tickets: Ticket[];
  now: number;
  risk: Ticket[];
  unassigned: Ticket[];
}

export interface ViewOptionsInput {
  riskCount: number;
  unassignedCount: number;
  consultant: Person | undefined;
  consultantCount: number;
}

export interface ViewOption {
  value: FocusKind;
  label: string;
}
