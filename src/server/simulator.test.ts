import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventType } from "@/domain/enums";
import type { DomainEvent } from "@/domain/types";
import { MARINA_ID, rawData } from "@/test-data";
import { getDb, initDb } from "./db";
import { startSimulator } from "./simulator";
import { subscribe } from "./socket";

describe("the activity simulator", () => {
  const received: DomainEvent[] = [];
  let stopListening: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    initDb(rawData);
    received.length = 0;
    stopListening = subscribe((event) => received.push(event));
  });

  afterEach(() => {
    stopListening();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const marina = () =>
    getDb().usuarios.find((person) => person.id === MARINA_ID)!;

  it("does nothing until the first interval has passed", () => {
    const stop = startSimulator(marina());
    vi.advanceTimersByTime(2999);
    expect(received).toHaveLength(0);
    stop();
  });

  it("brings in something new every few seconds", async () => {
    const stop = startSimulator(marina());
    await vi.advanceTimersByTimeAsync(8000);
    const ids = new Set(received.map((domainEvent) => domainEvent.id));
    expect(ids.size).toBeGreaterThanOrEqual(2);
    stop();
  });

  it("writes customer messages in tickets that exist", async () => {
    const stop = startSimulator(marina());
    await vi.advanceTimersByTimeAsync(4000);
    const messages = received.filter(
      (domainEvent) => domainEvent.tipo === EventType.MessageAdded,
    );
    expect(messages.length).toBeGreaterThan(0);
    for (const message of messages) {
      if (message.tipo !== EventType.MessageAdded) continue;
      expect(
        getDb().chamados.some(
          (ticket) => ticket.id === message.payload.chamado_id,
        ),
      ).toBe(true);
    }
    stop();
  });

  it("stops when asked to", async () => {
    const stop = startSimulator(marina());
    await vi.advanceTimersByTimeAsync(4000);
    stop();
    await vi.advanceTimersByTimeAsync(2000);
    const before = received.length;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(received).toHaveLength(before);
    expect(vi.getTimerCount()).toBe(0);
  });
});
