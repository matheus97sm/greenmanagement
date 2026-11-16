import { Priority } from "@/domain/enums";
import { Impact } from "./enums";

export const IMPACT_LABEL: Record<Impact, string> = {
  [Impact.Everyone]: "Toda a empresa está parada",
  [Impact.Blocked]: "Não consigo trabalhar",
  [Impact.Slows]: "Atrapalha, mas consigo trabalhar",
  [Impact.CanWait]: "Pode esperar",
};

export const IMPACT_PRIORITY: Record<Impact, Priority> = {
  [Impact.Everyone]: Priority.Critical,
  [Impact.Blocked]: Priority.High,
  [Impact.Slows]: Priority.Medium,
  [Impact.CanWait]: Priority.Low,
};

export const DEFAULT_IMPACT = Impact.Slows;
