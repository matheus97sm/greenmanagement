import { AppShell } from "@mantine/core";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth/auth-context";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <AppHeader />
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
