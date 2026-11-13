let offsetMs: number | null = null;

export function anchorClock(simulatedNowIso: string): void {
  if (offsetMs !== null) return;
  offsetMs = Date.parse(simulatedNowIso) - Date.now();
}

export function resetClock(): void {
  offsetMs = null;
}

export function now(): number {
  return Date.now() + (offsetMs ?? 0);
}

export function nowIso(): string {
  return new Date(now()).toISOString();
}
