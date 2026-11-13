import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEMO_PASSWORD, USERS } from "./users";
import type { User } from "./users";
import { AuthContext } from "./auth-context";

const STORAGE_KEY = "greenmanagement.session";

function loadStoredUser(): User | null {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    return USERS.find((u) => u.id === id) ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser);

  const signIn = useCallback((email: string, password: string) => {
    const found = USERS.find((u) => u.email === email.trim().toLowerCase());
    if (!found || password !== DEMO_PASSWORD) return false;
    try {
      localStorage.setItem(STORAGE_KEY, found.id);
    } catch {
      // ignore
    }
    setUser(found);
    return true;
  }, []);

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
