import { Profile } from "@/domain/enums";

export const ROLE_LABEL: Record<Profile, string> = {
  [Profile.Customer]: "Cliente",
  [Profile.Consultant]: "Consultor",
  [Profile.Manager]: "Gestor",
};

export const ROLE_COLOR: Record<Profile, string> = {
  [Profile.Customer]: "blue",
  [Profile.Consultant]: "green",
  [Profile.Manager]: "violet",
};
