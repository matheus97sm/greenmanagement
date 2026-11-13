import type { Status } from "@/domain/enums";
import { isReopen, TRANSITIONS } from "@/domain/status";

export function targetOptions(status: Status, reopen?: boolean): Status[] {
  return TRANSITIONS[status].filter((to) =>
    reopen ? isReopen(status, to) : !isReopen(status, to),
  );
}
