import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/server/db";
import { LoadStatus } from "@/store/enums";
import { ticketsStore } from "@/store/ticketsStore";
import { HELENA_ID, MARINA_ID, RICARDO_ID, rawData } from "@/test-data";
import {
  LOAD_TIMEOUT,
  renderApp,
  resetWorld,
  signInAs,
  ticketIdsInStore,
  waitForStore,
} from "./helpers";

vi.mock("@/server/simulator", () => ({ startSimulator: () => () => {} }));

describe("logging in and landing on the profile page", () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it("signs Marina in, shows a spinner while loading, then her tickets", async () => {
    const user = userEvent.setup();
    const { router, container } = renderApp({ route: "/" });

    await signInAs(user, "Marina Almeida");

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/consultant/tickets"),
    );
    await waitFor(() =>
      expect(container.querySelector(".mantine-Loader-root")).toBeTruthy(),
    );

    expect(
      await screen.findByText("Meus (42)", {}, { timeout: LOAD_TIMEOUT }),
    ).toBeInTheDocument();
    expect(container.querySelector(".mantine-Loader-root")).toBeNull();

    const header = screen.getByRole("banner");
    expect(within(header).getByText("Marina Almeida")).toBeInTheDocument();
    expect(within(header).getByText("Consultora")).toBeInTheDocument();
    expect(localStorage.getItem("greenmanagement.session")).toBe(MARINA_ID);
  });

  it("puts the most urgent ticket on top of the list she just loaded", async () => {
    const user = userEvent.setup();
    const { container } = renderApp({ route: "/" });
    await signInAs(user, "Marina Almeida");

    await screen.findByText("Meus (42)", {}, { timeout: LOAD_TIMEOUT });
    const [first] = container.querySelectorAll(".ticket-row");
    expect(first).toHaveTextContent("#10503");
  });

  it("loads only what Marina may see, not the whole data set", async () => {
    const user = userEvent.setup();
    renderApp({ route: "/" });
    await signInAs(user, "Marina Almeida");
    await waitForStore(LoadStatus.Ready);

    expect(ticketIdsInStore().length).toBeGreaterThan(42);
    expect(ticketIdsInStore().length).toBeLessThan(getDb().chamados.length);
  });

  it.each([
    {
      name: "Ricardo Monteiro",
      path: "/manager/tickets",
      heading: "Equipe e chamados",
      tickets: () => rawData.chamados.length,
    },
    {
      name: "Helena Fernandes",
      path: "/customer/tickets",
      heading: "Meus chamados",
      tickets: () =>
        rawData.chamados.filter((t) => t.solicitante_id === HELENA_ID).length,
    },
  ])(
    "signs $name in and sends them to $path with their own data",
    async ({ name, path, heading, tickets }) => {
      const user = userEvent.setup();
      const { router } = renderApp({ route: "/" });

      await signInAs(user, name);

      await waitFor(() => expect(router.state.location.pathname).toBe(path));
      expect(
        await screen.findByRole("heading", { name: heading }),
      ).toBeInTheDocument();
      await waitForStore(LoadStatus.Ready);
      expect(ticketIdsInStore()).toHaveLength(tickets());
    },
  );

  it("sends someone who is already signed in straight to their page", async () => {
    const { router } = renderApp({ route: "/", userId: RICARDO_ID });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/manager/tickets"),
    );
    expect(
      await screen.findByRole("heading", { name: "Equipe e chamados" }),
    ).toBeInTheDocument();
  });

  it("keeps a visitor on the login page and loads nothing", async () => {
    const { router } = renderApp({ route: "/consultant/tickets" });
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(ticketsStore.getState().status).toBe(LoadStatus.Idle);
  });
});
