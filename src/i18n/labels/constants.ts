import { Role } from "@/auth/enums";
import { Priority, Profile, Status } from "@/domain/enums";
import type { locales } from "./locales";

type LabelKey = keyof (typeof locales)["pt-BR"];

export const STATUS_KEY: Record<Status, LabelKey> = {
  [Status.Open]: "statusOpen",
  [Status.InProgress]: "statusInProgress",
  [Status.WaitingCustomer]: "statusWaitingCustomer",
  [Status.Resolved]: "statusResolved",
  [Status.Closed]: "statusClosed",
};

export const PRIORITY_KEY: Record<Priority, LabelKey> = {
  [Priority.Critical]: "priorityCritical",
  [Priority.High]: "priorityHigh",
  [Priority.Medium]: "priorityMedium",
  [Priority.Low]: "priorityLow",
};

export const PROFILE_KEY: Record<Profile, LabelKey> = {
  [Profile.Customer]: "profileCustomer",
  [Profile.Consultant]: "profileConsultant",
  [Profile.Manager]: "profileManager",
};

export const ROLE_KEY: Record<Role, LabelKey> = {
  [Role.Consultant]: "roleConsultant",
  [Role.Manager]: "roleManager",
  [Role.Customer]: "roleCustomer",
};
