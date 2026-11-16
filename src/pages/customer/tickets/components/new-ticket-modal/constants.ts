import { Priority } from "@/domain/enums";
import { Impact } from "./enums";
import type { ImpactKey } from "./types";

export const IMPACT_KEY: Record<Impact, ImpactKey> = {
  [Impact.Everyone]: "impactEveryone",
  [Impact.Blocked]: "impactBlocked",
  [Impact.Slows]: "impactSlows",
  [Impact.CanWait]: "impactCanWait",
};

export const IMPACT_PRIORITY: Record<Impact, Priority> = {
  [Impact.Everyone]: Priority.Critical,
  [Impact.Blocked]: Priority.High,
  [Impact.Slows]: Priority.Medium,
  [Impact.CanWait]: Priority.Low,
};

export const DEFAULT_IMPACT = Impact.Slows;
