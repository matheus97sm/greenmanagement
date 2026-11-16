import { CustomerStage } from "@/domain/enums";
import type { StageKey } from "./types";

export const STAGE_KEY: Record<CustomerStage, StageKey> = {
  [CustomerStage.Received]: "received",
  [CustomerStage.Assigned]: "assigned",
  [CustomerStage.InProgress]: "inProgress",
  [CustomerStage.WaitingYou]: "waitingYou",
  [CustomerStage.Resolved]: "resolved",
  [CustomerStage.Closed]: "closed",
};

export const STAGE_COLOR: Record<CustomerStage, string> = {
  [CustomerStage.Received]: "violet",
  [CustomerStage.Assigned]: "blue",
  [CustomerStage.InProgress]: "blue",
  [CustomerStage.WaitingYou]: "orange",
  [CustomerStage.Resolved]: "teal",
  [CustomerStage.Closed]: "gray",
};
