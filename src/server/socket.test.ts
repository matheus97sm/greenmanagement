import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventType } from "@/domain/enums";
import type { DomainEvent } from "@/domain/types";
import { publish, subscribe } from "./socket";

const event = (id: string): DomainEvent => ({
  id,
  tipo: EventType.TicketAssigned,
  ocorrido_em: "2026-11-03T13:00:00Z",
  payload: { chamado_id: "t", consultor_id: "c" },
});

const NO_DUPLICATE = 0.5;
const DUPLICATE = 0.01;

function randoms(...values: number[]) {
  const spy = vi.spyOn(Math, "random");
  for (const value of values) spy.mockReturnValueOnce(value);
  spy.mockReturnValue(0.5);
}

describe("socket", () => {
  const stops: Array<() => void> = [];
  const listen: typeof subscribe = (handler, filter) => {
    const stop = subscribe(handler, filter);
    stops.push(stop);
    return stop;
  };

  beforeEach(() => vi.useFakeTimers());

  afterEach(() => {
    stops.splice(0).forEach((stop) => stop());
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("delivers an event to a subscriber after a delay, not at once", () => {
    const handler = vi.fn();
    listen(handler);
    randoms(0, NO_DUPLICATE);
    publish(event("a"));
    expect(handler).not.toHaveBeenCalled();
    vi.advanceTimersByTime(79);
    expect(handler).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event("a"));
  });

  it("delays by up to 350 ms", () => {
    const handler = vi.fn();
    listen(handler);
    randoms(0.99, NO_DUPLICATE);
    publish(event("a"));
    vi.advanceTimersByTime(346);
    expect(handler).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("delivers the same event again later about one time in eight", () => {
    const handler = vi.fn();
    listen(handler);
    randoms(0, DUPLICATE, 0);
    publish(event("a"));
    vi.advanceTimersByTime(350);
    expect(handler).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1500);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[1][0]).toEqual(handler.mock.calls[0][0]);
  });

  it("does not repeat an event when the draw says no", () => {
    const handler = vi.fn();
    listen(handler);
    randoms(0, NO_DUPLICATE);
    publish(event("a"));
    vi.advanceTimersByTime(5000);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("reaches every subscriber", () => {
    const first = vi.fn();
    const second = vi.fn();
    listen(first);
    listen(second);
    publish(event("a"));
    vi.advanceTimersByTime(350);
    expect(first).toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
  });

  it("lets the filter of each subscriber decide what it receives", () => {
    const seen = vi.fn();
    const hidden = vi.fn();
    listen(seen, (domainEvent) => domainEvent);
    listen(hidden, () => null);
    publish(event("a"));
    vi.advanceTimersByTime(2000);
    expect(seen).toHaveBeenCalled();
    expect(hidden).not.toHaveBeenCalled();
  });

  it("delivers what the filter returns, which may be another version of the event", () => {
    const handler = vi.fn();
    listen(handler, (domainEvent) => ({ ...domainEvent, id: "changed" }));
    publish(event("a"));
    vi.advanceTimersByTime(350);
    expect(handler.mock.calls[0][0].id).toBe("changed");
  });

  it("stops delivering to someone who unsubscribed, even for events in flight", () => {
    const handler = vi.fn();
    const stop = listen(handler);
    publish(event("a"));
    stop();
    vi.advanceTimersByTime(5000);
    expect(handler).not.toHaveBeenCalled();
  });

  it("does nothing when nobody is listening", () => {
    expect(() => publish(event("a"))).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});
