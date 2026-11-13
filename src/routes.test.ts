import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter } from "react-router";
import { SESSION_KEY } from "./auth/session";
import { routes } from "./routes";
import { HELENA_ID, MARINA_ID, RICARDO_ID } from "./test-data";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

async function visit(path: string): Promise<string> {
  const router = createMemoryRouter(routes, { initialEntries: ["/"] });
  await router.navigate(path);
  const pathname = router.state.location.pathname;
  router.dispose();
  return pathname;
}

describe("route guards", () => {
  beforeEach(() => vi.stubGlobal("localStorage", fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  const signInAs = (userId: string) =>
    vi.stubGlobal("localStorage", fakeStorage({ [SESSION_KEY]: userId }));

  it("sends anonymous users to the login page", async () => {
    expect(await visit("/consultant/tickets")).toBe("/");
    expect(await visit("/manager/tickets")).toBe("/");
    expect(await visit("/unknown")).toBe("/");
  });

  it("lets each profile into its own area", async () => {
    signInAs(MARINA_ID);
    expect(await visit("/consultant/tickets")).toBe("/consultant/tickets");
    expect(await visit("/consultant/tickets/ch-1000")).toBe(
      "/consultant/tickets/ch-1000",
    );
  });

  it("redirects a profile away from another profile's area", async () => {
    signInAs(MARINA_ID);
    expect(await visit("/manager/tickets")).toBe("/consultant/tickets");
    signInAs(HELENA_ID);
    expect(await visit("/consultant/tickets")).toBe("/customer/tickets");
  });

  it("sends signed-in users from the login page and unknown paths home", async () => {
    signInAs(RICARDO_ID);
    expect(await visit("/")).toBe("/manager/tickets");
    expect(await visit("/unknown")).toBe("/manager/tickets");
    expect(await visit("/manager")).toBe("/manager/tickets");
  });
});
