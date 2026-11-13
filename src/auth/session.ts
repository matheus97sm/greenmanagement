import { USERS } from "./users";
import type { User } from "./users";

export const SESSION_KEY = "greenmanagement.session";

export function getSessionUser(): User | null {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    return USERS.find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

export function saveSession(userId: string): void {
  try {
    localStorage.setItem(SESSION_KEY, userId);
  } catch {}
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}
