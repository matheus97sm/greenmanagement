import type { FocusKind } from "./enums";

export type Focus =
  | { kind: FocusKind.Risk }
  | { kind: FocusKind.Unassigned }
  | { kind: FocusKind.Consultant; consultantId: string };
