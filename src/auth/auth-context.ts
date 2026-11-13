import { createContext, useContext } from "react";
import type { User } from "./users";

export interface AuthContextValue {
  user: User | null;
  signIn: (email: string, password: string) => boolean;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
