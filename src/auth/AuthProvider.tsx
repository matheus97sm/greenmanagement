import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DEMO_PASSWORD, USERS } from "./users";
import type { User } from "./users";
import { AuthContext } from "./auth-context";
import { clearSession, getSessionUser, saveSession } from "./session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getSessionUser);

  const signIn = useCallback((email: string, password: string) => {
    const found = USERS.find((u) => u.email === email.trim().toLowerCase());
    if (!found || password !== DEMO_PASSWORD) return null;
    saveSession(found.id);
    setUser(found);
    return found;
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, signIn, signOut }),
    [user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
