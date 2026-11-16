import { screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { expect, vi } from "vitest";
import type { DomainEvent } from "@/domain/types";
import { routes } from "@/routes";
import { initDb } from "@/server/db";
import { LoadStatus } from "@/store/enums";
import { ticketsStore } from "@/store/ticketsStore";
import { rawData } from "@/test-data";
import { renderRoutes } from "@/test-utils";
import type { RenderOptions } from "@/test-utils";

export const TEST_TIMEOUT = 20_000;
export const LOAD_TIMEOUT = 3000;
export const SETTLE_MS = 1800;

vi.setConfig({ testTimeout: TEST_TIMEOUT });

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function renderApp(options: RenderOptions = {}) {
  return renderRoutes(routes, options);
}

export function resetWorld(): void {
  vi.spyOn(Math, "random").mockImplementation(seededRandom(42));
  initDb(rawData);
  ticketsStore.reset();
}

export async function signInAs(user: UserEvent, name: string): Promise<void> {
  await screen.findByRole("button", { name: "Entrar" });
  await user.click(screen.getByText(new RegExp(name)));
  await user.click(screen.getByRole("button", { name: "Entrar" }));
}

export async function signOut(user: UserEvent): Promise<void> {
  await user.click(screen.getByRole("button", { name: "Sair" }));
}

export function waitForStore(status: LoadStatus): Promise<void> {
  return waitFor(() => expect(ticketsStore.getState().status).toBe(status), {
    timeout: LOAD_TIMEOUT,
  });
}

export function ticketIdsInStore(): string[] {
  return Object.keys(ticketsStore.getState().tickets);
}

export interface Delivery {
  event: DomainEvent;
  applied: boolean;
}

export function recordDeliveries(): Delivery[] {
  const log: Delivery[] = [];
  const original = ticketsStore.applyEvent.bind(ticketsStore);
  vi.spyOn(ticketsStore, "applyEvent").mockImplementation((event) => {
    const applied = original(event);
    log.push({ event, applied });
    return applied;
  });
  return log;
}
