import type { DomainEvent } from "../domain/types";

type Handler = (event: DomainEvent) => void;
type Filter = (event: DomainEvent) => DomainEvent | null;

interface Subscriber {
  handler: Handler;
  filter: Filter;
}

const subscribers = new Set<Subscriber>();

const between = (a: number, b: number) => a + Math.random() * (b - a);

export function subscribe(
  handler: Handler,
  filter: Filter = (event) => event,
): () => void {
  const subscriber = { handler, filter };
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

export function publish(event: DomainEvent) {
  for (const subscriber of subscribers) {
    const visible = subscriber.filter(event);
    if (!visible) continue;
    setTimeout(
      () => {
        if (subscribers.has(subscriber)) subscriber.handler(visible);
      },
      between(80, 350),
    );
    if (Math.random() < 0.12) {
      setTimeout(
        () => {
          if (subscribers.has(subscriber)) subscriber.handler(visible);
        },
        between(400, 1500),
      );
    }
  }
}
