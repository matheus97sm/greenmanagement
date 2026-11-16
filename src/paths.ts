import { Role } from "./auth/enums";

export const homePath = (role: Role) => `/${role}/tickets`;

export const MANAGER_DASHBOARD_PATH = `/${Role.Manager}/dashboard`;

export enum NavPage {
  Team = "team",
  Dashboard = "dashboard",
}

export interface NavItem {
  page: NavPage;
  to: string;
}

export function navItemsFor(role: Role): NavItem[] {
  if (role !== Role.Manager) return [];
  return [
    { page: NavPage.Team, to: homePath(Role.Manager) },
    { page: NavPage.Dashboard, to: MANAGER_DASHBOARD_PATH },
  ];
}
