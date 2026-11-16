import { describe, expect, it } from "vitest";
import { Role } from "./auth/enums";
import { homePath, MANAGER_DASHBOARD_PATH, navItemsFor } from "./paths";

describe("homePath", () => {
  it("sends each profile to its own tickets area", () => {
    expect(homePath(Role.Consultant)).toBe("/consultant/tickets");
    expect(homePath(Role.Manager)).toBe("/manager/tickets");
    expect(homePath(Role.Customer)).toBe("/customer/tickets");
  });
});

describe("navItemsFor", () => {
  it("gives the manager the team view and the weekly dashboard", () => {
    expect(navItemsFor(Role.Manager)).toEqual([
      { label: "Equipe e chamados", to: "/manager/tickets" },
      { label: "Semana da equipe", to: MANAGER_DASHBOARD_PATH },
    ]);
  });

  it("starts the manager on the team view, which is the home page", () => {
    expect(navItemsFor(Role.Manager)[0].to).toBe(homePath(Role.Manager));
  });

  it("gives profiles with a single page no navigation", () => {
    expect(navItemsFor(Role.Consultant)).toEqual([]);
    expect(navItemsFor(Role.Customer)).toEqual([]);
  });
});
