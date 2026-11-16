import { Role } from "./auth/enums";

export const homePath = (role: Role) => `/${role}/tickets`;

export const MANAGER_DASHBOARD_PATH = `/${Role.Manager}/dashboard`;

export interface NavItem {
  label: string;
  to: string;
}

export function navItemsFor(role: Role): NavItem[] {
  if (role !== Role.Manager) return [];
  return [
    { label: "Equipe e chamados", to: homePath(Role.Manager) },
    { label: "Semana da equipe", to: MANAGER_DASHBOARD_PATH },
  ];
}
