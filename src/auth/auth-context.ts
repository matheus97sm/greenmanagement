import { createContext, useContext } from "react";
import type { User } from "./users";

export interface AuthContextValue {
  user: User | null;

  signIn: (email: string, password: string) => User | null;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser used without a signed-in user");
  return user;
}
