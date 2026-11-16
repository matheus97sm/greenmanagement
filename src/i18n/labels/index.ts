import { useMemo } from "react";
import type { Role } from "@/auth/enums";
import type { Priority, Profile, Status } from "@/domain/enums";
import { useTranslate } from "../use-translate";
import { PRIORITY_KEY, PROFILE_KEY, ROLE_KEY, STATUS_KEY } from "./constants";
import { locales } from "./locales";

export function useLabels() {
  const translate = useTranslate(locales);
  return useMemo(
    () => ({
      status: (status: Status) => translate(STATUS_KEY[status]),
      priority: (priority: Priority) => translate(PRIORITY_KEY[priority]),
      profile: (profile: Profile) => translate(PROFILE_KEY[profile]),
      role: (role: Role) => translate(ROLE_KEY[role]),
    }),
    [translate],
  );
}
