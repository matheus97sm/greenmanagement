import type { TeamWeek } from "@/domain/activity";
import type { Row } from "../../types";

export interface Props {
  team: TeamWeek;
  mostIdle: Row | undefined;
}
