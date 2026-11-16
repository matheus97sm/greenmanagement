import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Profile } from "@/domain/enums";
import { getDb } from "@/server/db";
import { assumeTicket } from "@/server/ops";
import { scopedSnapshot } from "@/server/visibility";
import { startRealtime } from "@/store/realtime";
import { LoadStatus } from "@/store/enums";
import { ticketsStore } from "@/store/ticketsStore";
import { HELENA_ID, MARINA_ID, RICARDO_ID, rawData } from "@/test-data";
import {
  LOAD_TIMEOUT,
  renderApp,
  resetWorld,
  signInAs,
  signOut,
  sleep,
  ticketIdsInStore,
  waitForStore,
} from "./helpers";

vi.mock("@/server/simulator", () => ({ startSimulator: () => () => {} }));

const personOf = (id: string) =>
  getDb().usuarios.find((person) => person.id === id)!;
const visibleTo = (id: string) =>
  scopedSnapshot(getDb(), personOf(id))
    .chamados.map((ticket) => ticket.id)
    .sort();

describe("switching users", () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it("gives each profile only its own slice of the data", async () => {
    const user = userEvent.setup();
    const { router } = renderApp({ route: "/" });

    await signInAs(user, "Marina Almeida");
    await waitForStore(LoadStatus.Ready);
    expect([...ticketIdsInStore()].sort()).toEqual(visibleTo(MARINA_ID));
    expect(ticketIdsInStore().length).toBeLessThan(rawData.chamados.length);

    await signOut(user);
    expect(router.state.location.pathname).toBe("/");
    expect(ticketsStore.getState().status).toBe(LoadStatus.Idle);
    expect(ticketIdsInStore()).toEqual([]);

    await signInAs(user, "Ricardo Monteiro");
    await waitForStore(LoadStatus.Ready);
    expect([...ticketIdsInStore()].sort()).toEqual(visibleTo(RICARDO_ID));
    expect(ticketIdsInStore()).toHaveLength(rawData.chamados.length);

    await signOut(user);
    await signInAs(user, "Helena Fernandes");
    await waitForStore(LoadStatus.Ready);

    const state = ticketsStore.getState();
    expect([...ticketIdsInStore()].sort()).toEqual(visibleTo(HELENA_ID));
    expect(ticketIdsInStore()).toHaveLength(4);
    expect(Object.keys(state.messages).every((id) => id in state.tickets)).toBe(
      true,
    );
    expect(
      Object.values(state.messages)
        .flat()
        .some((message) => message.interna),
    ).toBe(false);
    const customers = Object.values(state.people).filter(
      (person) => person.perfil === Profile.Customer,
    );
    expect(customers.map((person) => person.id)).toEqual([HELENA_ID]);
  });

  it("picks up what changed while the same user was signed out", async () => {
    const user = userEvent.setup();
    renderApp({ route: "/" });

    await signInAs(user, "Marina Almeida");
    await screen.findByText(
      "Fila do grupo (35)",
      {},
      { timeout: LOAD_TIMEOUT },
    );
    await signOut(user);

    const marina = personOf(MARINA_ID);
    const queued = getDb().chamados.find(
      (ticket) => !ticket.responsavel_id && ticket.grupo_id === marina.grupo_id,
    )!;
    const colleague = getDb().usuarios.find(
      (person) =>
        person.perfil === Profile.Consultant &&
        person.id !== MARINA_ID &&
        person.grupo_id === marina.grupo_id,
    )!;
    assumeTicket(queued.id, colleague.id);

    await sleep(600);
    expect(ticketsStore.getState().status).toBe(LoadStatus.Idle);
    expect(ticketIdsInStore()).toEqual([]);

    await signInAs(user, "Marina Almeida");
    expect(
      await screen.findByText(
        "Fila do grupo (34)",
        {},
        { timeout: LOAD_TIMEOUT },
      ),
    ).toBeInTheDocument();
  });

  it("does not let a late answer for the previous user leak into the next one", async () => {
    const stopMarina = startRealtime(MARINA_ID);
    stopMarina();
    const stopHelena = startRealtime(HELENA_ID);

    await waitForStore(LoadStatus.Ready);
    await sleep(700);

    const state = ticketsStore.getState();
    expect([...ticketIdsInStore()].sort()).toEqual(visibleTo(HELENA_ID));
    expect(Object.keys(state.messages).every((id) => id in state.tickets)).toBe(
      true,
    );
    expect(
      Object.values(state.messages)
        .flat()
        .some((message) => message.interna),
    ).toBe(false);

    stopHelena();
  });
});
