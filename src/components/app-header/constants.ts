import { NavPage } from "@/paths";
import type { NavPageKey } from "./types";

export const NAV_PAGE_KEY: Record<NavPage, NavPageKey> = {
  [NavPage.Team]: "pageTeam",
  [NavPage.Dashboard]: "pageDashboard",
};
