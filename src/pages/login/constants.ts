import { Role } from "@/auth/enums";
import type { RoleDescriptionKey } from "./types";

export const ROLE_DESCRIPTION_KEY: Record<Role, RoleDescriptionKey> = {
  [Role.Consultant]: "consultantDescription",
  [Role.Manager]: "managerDescription",
  [Role.Customer]: "customerDescription",
};
