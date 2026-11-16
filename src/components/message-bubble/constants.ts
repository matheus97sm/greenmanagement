import { Profile } from "@/domain/enums";

export const ROLE_COLOR: Record<Profile, string> = {
  [Profile.Customer]: "blue",
  [Profile.Consultant]: "green",
  [Profile.Manager]: "violet",
};
