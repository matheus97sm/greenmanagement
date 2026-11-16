import type { TicketsState } from "./ticketsStore";

const KEY_PREFIX = "greenmanagement.read.";

interface Observable {
  getState: () => Pick<TicketsState, "lastRead">;
  subscribe: (listener: () => void) => () => void;
}

const keyOf = (userId: string) => `${KEY_PREFIX}${userId}`;

function isMarks(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((mark) => typeof mark === "string")
  );
}

export function loadReadMarks(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(keyOf(userId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isMarks(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveReadMarks(
  userId: string,
  marks: Record<string, string>,
): void {
  try {
    localStorage.setItem(keyOf(userId), JSON.stringify(marks));
  } catch {}
}

export function persistReadMarks(
  userId: string,
  store: Observable,
): () => void {
  let last = store.getState().lastRead;
  return store.subscribe(() => {
    const next = store.getState().lastRead;
    if (next === last) return;
    last = next;
    saveReadMarks(userId, next);
  });
}
